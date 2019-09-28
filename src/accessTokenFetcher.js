const fs = require('fs'),
    request = require('request'),
    cliProgress = require('cli-progress'),
    generateOauthData = require('./generateOauthData').generateOauthData,
    generateTokenData = require('./generateTokenData').generateTokenData;

exports.accessTokenFetcher = {
    fetchAndCall : (callback) => {
        var oauthData; 
        if(!fs.existsSync(FileSystem.oauthDataFile)){
            oauthDataPromise = generateOauthData()
        } else {
            var dataBuffer = fs.readFileSync(FileSystem.oauthDataFile);
            if(dataBuffer.length == 0){
                oauthDataPromise = generateOauthData();
            } else {
                oauthDataPromise = new Promise((resolve)=>{
                    resolve(JSON.parse(dataBuffer.toString()));
                });
            }
        }

        oauthDataPromise.then((oauthData)=>{
            var tokenDataPromise;
            if(!fs.existsSync(FileSystem.tokenDataFile)){
                tokenDataPromise = generateTokenData(oauthData);
            } else {
                var dataBuffer = fs.readFileSync(FileSystem.tokenDataFile);
                if(dataBuffer.length == 0){
                    tokenDataPromise = generateTokenData(oauthData);
                } else {
                    tokenDataPromise = new Promise(function(resolve){
                        resolve(JSON.parse(dataBuffer.toString()));
                    });
                }
            }

            tokenDataPromise.then(function(tokenData){
                tokenDataPromise = validateAndGetAccessToken(oauthData,tokenData);
                tokenDataPromise.then(function(tokenData){
                    callback(tokenData.access_token);
                });
            });
        })
    }
}

async function validateAndGetAccessToken(oauthData,tokenData){
    if(!tokenData){
        return generateTokenData(oauthData);
    }

    if(!tokenData.refresh_token){
        return generateTokenData(oauthData);
    }

    if(!tokenData.access_token || !tokenData.created_time || !tokenData.expires_in){
        tokenData = regenerateAccessTokenIfRequired(oauthData,tokenData);
    } else {
        var tokenExpiryTime = tokenData.created_time + tokenData.expires_in;
        var now = new Date().getTime();
        var secondsLeft = Math.floor((tokenExpiryTime - now)/1000);
        if(secondsLeft <= 0){
            tokenData = regenerateAccessTokenIfRequired(oauthData,tokenData);
        }
    }
    
    return tokenData;
}

function regenerateAccessTokenIfRequired(oauthData, tokenData) {
    if(!oauthData.clientId || !oauthData.clientSecret || !oauthData.tokenUrl){
        oauthData = generateOauthData();
    }
    
    let progress = 0;
    let progressBar = new cliProgress.Bar({
        format: 'Re-generating refresh token {bar} {percentage}%'
    }, cliProgress.Presets.shades_classic);
    progressBar.start(100, 1);
    let progressUpdate = setInterval(() => {
        if(progress < 80){
            progress += 10;
            progressBar.update(progress);
        } else {
            clearInterval(progressUpdate);
        }
    }, 100);

    return new Promise((resolve, reject) => {
        request({
            method : 'POST',
            url : oauthData.tokenUrl,
            formData : {
                refresh_token : tokenData.refresh_token,
                client_id : oauthData.clientId,
                client_secret : oauthData.clientSecret,
                redirect_uri : app.callbackUrl,
                grant_type : 'refresh_token'
            }
        },(error,status,body) => {
            progressBar.update(100);
            if(error){
                reject("Failed to re-generate access token.",error,status,body);
            } else {
                body = JSON.parse(body);
                tokenData.access_token = body.access_token;
                tokenData.created_time = new Date().getTime();
                tokenData.expires_in = body.expires_in;
                fs.writeFileSync(FileSystem.tokenDataFile,JSON.stringify(tokenData));
                resolve(tokenData);
            }
        });
    });
}