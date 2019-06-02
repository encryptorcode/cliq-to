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
        },cliProgress.Presets.rect);
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
        },(error,responseMessage)=>{
            progressBar.update(totalFileSize);
            progressBar.stop();
            if(error || parseInt(responseMessage.statusCode/100 != 2)){
                console.log("Failed to send the file.");
                console.log("Reponse details:");
                console.log("status: "+responseMessage.statusCode);
                console.log("body: "+responseMessage.body);
            } else {
                console.log("File uploaded successfully.")
            }
        });
    });
}