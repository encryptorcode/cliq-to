#!/usr/bin/env node

const os = require('os'),
    path = require('path'),
    commander = require('commander'),
    sendFileToCliq = require('./src/sendFileToCliq').sendFileToCliq,
    accessTokenFetcher = require('./src/accessTokenFetcher').accessTokenFetcher,
    packageJson = require('./package.json');

global.FileSystem = {};
global.FileSystem.home = path.join(os.homedir(),".cliqTo");
global.FileSystem.oauthDataFile = path.join(global.FileSystem.home,"oauth.json");
global.FileSystem.tokenDataFile = path.join(global.FileSystem.home,"token.json");

global.app = {};
global.app.port = 12345;
global.app.authenticationPath = '/authentication';
global.app.authenticationUrl = "http://localhost:"+global.app.port+global.app.authenticationPath;
global.app.callbackPath = '/callback';
global.app.callbackUrl = "http://localhost:"+global.app.port+global.app.callbackPath;

let cliqTo = (filePath) => {
    try{
        sendFileToCliq(
            {
                channel : commander.channel,
                bot : commander.bot,            
                chatId : commander.chatId,
                email : commander.email
            },
            accessTokenFetcher,
            filePath
        );
    } catch(e){
        console.error(e);
    }
}

commander
    .version(packageJson.version,'-v, --version')
    .option('-ch, --channel [string]','Channel name in cliq')
    .option('-b, --bot [string]','Bot name in cliq')
    .option('-i, --chat-id [string]','Chat id on cliq')
    .option('-e, --email [string]','Email id on cliq')
    .action(cliqTo)
    .parse(process.argv);