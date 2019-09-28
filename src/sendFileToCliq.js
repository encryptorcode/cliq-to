const request = require('request'),
    fs = require('fs'),
    cliProgress = require('cli-progress');

exports.sendFileToCliq = (recipientData,accessTokenFetcher,filePath) => {
    if(!recipientData){
        throw 'You need to specify recipient inorder to send the file.';
    }

    var url;

    if(recipientData.channel){
        if(url != undefined){
            throw 'Multiple recipients are not supported.';
        }
        url = 'https://cliq.zoho.com/api/v2/channelsbyname/'+recipientData.channel+'/files'
    }

    if(recipientData.bot){
        if(url != undefined){
            throw 'Multiple recipients are not supported.';
        }
        url = 'https://cliq.zoho.com/api/v2/bots/'+recipientData.bot+'/files'
    }

    if(recipientData.chatId){
        if(url != undefined){
            throw 'Multiple recipients are not supported.';
        }
        url = 'https://cliq.zoho.com/api/v2/chats/'+recipientData.chatId+'/files'
    }
    
    if(recipientData.email){
        if(url != undefined){
            throw 'Multiple recipients are not supported.';
        }
        url = 'https://cliq.zoho.com/api/v2/buddies/'+recipientData.email+'/files'
    }

    if(url == undefined){
        throw 'You need to specify recipient inorder to send the file.'
    }

    if(!fs.existsSync(filePath)){
        throw "File specified doesn't exist"
    }

    if(!fs.existsSync(global.FileSystem.home)){
        fs.mkdirSync(global.FileSystem.home);
    }

    accessTokenFetcher.fetchAndCall(function(accessToken){
        var totalFileSize = fs.lstatSync(filePath).size;
        var uploadedSize = 0;
        let progressBar = new cliProgress.Bar({
            format: 'Uploading {bar} {percentage}%'
        },cliProgress.Presets.shades_classic);
        progressBar.start(totalFileSize,uploadedSize);
        request({
            url : url,
            method : 'POST',
            port : 443,
            headers : {
                "Authorization" : "Bearer " + accessToken,
                "Content-Type": "multipart/form-data"
            },
            formData : {
                file : fs.createReadStream(filePath).on('data', (chunk) => {
                    uploadedSize += chunk.length
                    progressBar.update(uploadedSize*0.8);
                })
            }
        },(error,res)=>{
            progressBar.update(totalFileSize);
            progressBar.stop();
            if(error){
                console.log('Something happened. Please report this error on https://github.com/encryptorcode/cliq-to/issues');
                console.error(error);
            } else if (res.statusCode == 200) {
                console.log("File uploaded successfully.");
            } else if (res.statusCode == 401) {
                console.log('Authentication Error. Please try to re-run the command.');
                fs.unlinkSync(global.FileSystem.tokenDataFile);
            } else {
                console.log('Something happened. Please report this error on https://github.com/encryptorcode/cliq-to/issues');
            }
            // FIXME: need to find out the actual root cause of process not exiting.
            process.exit();
        });
    });
}