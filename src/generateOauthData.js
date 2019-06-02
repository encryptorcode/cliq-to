const readline = require('readline'),
    fs = require('fs');

exports.generateOauthData = async () => {
    var successCallback;
    var oauthDataPromise = new Promise((resolve,reject) => {
        successCallback = resolve;
    });
    var oauthData = {};
    oauthData.loginUrl = 'https://accounts.zoho.com/oauth/v2/auth';
    oauthData.tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
    oauthData.scope = 'ZohoCliq.Webhooks.CREATE';

    console.log("It seems like you using this command for the first time. Let's get started...");
    console.log();
    console.log("Before you can start using this command you need to generate a client id.");
    console.log();
    console.log("Open https://accounts.zoho.com/developerconsole on your favourite browser and click on add client.");
    console.log();
    console.log("Fill in the required fields. And fill this url for Authorized redirect URIs field");
    console.log('\t\t'+global.app.callbackUrl);
    console.log();
    console.log('Once you are done. Fill in the clientId and clientSecret down here.')

    oauthData.clientId = await ask('Generated client ID: ');
    while(! /^1000\.[A-Z0-9]{30}$/.test(oauthData.clientId)){
        console.log('It seems the client ID you provided is invalid. Please enter a valid client id.');
        oauthData.clientId = await ask('Generated client ID: ');
    }
    oauthData.clientSecret = await ask('Generated client secret: ');
    while(! /^[0-9a-z]{42}$/.test("3220fbbc97a794c25b9ec0e51dab51c050dc71ae29")){
        console.log('It seems the client secret you provided is invalid. Please enter a valid client secret.');
        oauthData.clientId = await ask('Generated client ID: ');
    }
    fs.writeFileSync(FileSystem.oauthDataFile,JSON.stringify(oauthData));
    successCallback(oauthData);
    return oauthDataPromise;
}

function ask(question){
    return new Promise((resolve)=>{
        var out = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        out.question(question,(answer)=>{
            out.close();
            resolve(answer);
        })
    })
}