const express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    fs = require('fs'),
    request = require('request');

exports.generateTokenData = (oauthData) => {
    console.log('Lets get you authenticated now...');
    console.log('Open the below given link in your favourite browser.');
    console.log('\t\t'+global.app.authenticationUrl);
    var tokenDataPromise = startAccessTokenGenerationServer(oauthData);
    tokenDataPromise.then(function(tokenData){
        tokenData.created_time = new Date().getTime();
        fs.writeFileSync(FileSystem.tokenDataFile,JSON.stringify(tokenData));
    })
    return tokenDataPromise;
}

function startAccessTokenGenerationServer(oauthData){
    var authenticationSuccessCallback;
    var authenticationFailureCallback;
    var authenticationPromise = new Promise((resolve,reject) => {
        authenticationSuccessCallback = resolve;
        authenticationFailureCallback = reject;
    })
    var httpServer;
    var server = express();
    server.use(bodyParser.json());
    server.get(global.app.authenticationPath, (req,res) => {
        res.redirect(oauthData.loginUrl + 
            "?client_id=" + oauthData.clientId +
            "&redirect_uri=" + global.app.callbackUrl +
            "&scope=" + oauthData.scope +
            "&access_type=offline" +
            "&response_type=code" +
            "&prompt=consent"
        );
    });
    server.get(global.app.callbackPath, (req,res) => {
        request({
            method : 'POST',
            url : oauthData.tokenUrl,
            formData : {
                code: req.query.code,
                client_id: oauthData.clientId,
                client_secret: oauthData.clientSecret,
                redirect_uri: global.app.callbackUrl,
                grant_type: "authorization_code"
            }
        }, (error, status, body) => {
            if(error){
                res.redirect('/failure')
                authenticationFailureCallback('Failed to generate access token');
            } else {
                res.redirect('/success')
                authenticationSuccessCallback(JSON.parse(body));
            }
        })
    });
    server.get("/success",(req,res)=>{
        res.send("You can return back to terminal to continue...");
    });
    server.get("/failure",(req,res)=>{
        res.send("Please try again. It failed...")
    });
    httpServer = http.createServer(server);
    httpServer.listen(global.app.port);

    authenticationPromise.then(function(){
        console.log('Closing server...');
        httpServer.close();
    },function(){
        console.log('Closing server2...');
        httpServer.close();
    })
    return authenticationPromise;
}