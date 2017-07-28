// get the config file and assign vars
const authConfig = require('./config.json')
var channelID = authConfig.discordChannelID;
var discordToken = authConfig.discordToken;
var botPrefix = authConfig.botPrefix;
var discordAdminID = authConfig.adminID;


// discord setup
const Discord = require('discord.js');
const discordClient = new Discord.Client();


// mongo setup
const mongoose = require('mongoose');
// set the conection, change your url!
var mongoDB = 'mongodb URL';
mongoose.connect(mongoDB);
// get connection
var datab = mongoose.connection;
// get error event
datab.on('error', console.error.bind(console, 'MongoDB connection error!'));


// get schema
var User = require('./model');
datab.on('open', function(ref) {
    console.log('Connected to the mongo server. ');
    // login once database is ready
    discordClient.login(discordToken);
})

// wait for the discord client to be ready
discordClient.on('ready', () => {
    console.log('Auth bot is now live!');
    // sets and sends to the channel that we will use
    authChannel = discordClient.channels.get(channelID);
    authChannel.send('Authentication bot is now live!');
});

// looks for new messages
discordClient.on('message', message => {
    // check if the message is in the right channel
    if (message.channel.id != channelID) return;
    // we don't wnat to listen to bots
    if (message.author.bot) return;
    // check if message starts with prefix
    if (!message.content.startsWith(botPrefix)) return;

    // splits at spaces
    const messageArray = message.content.split(' ');
    // lets check if they're asking for help! Put your URL!
    if (messageArray[1].toLowerCase() == 'help') {
        message.reply('Log onto URL to get your ID, then activate your account by using `h! activate <your-key>`!');
        return;
    }
    // sure the user entered more than just the prefix. I have 3 arguments
    if (messageArray.length != 3) {
        message.reply('Invalid argument count!');
        return;
    }
    // lets store some variables for later
    const discordUserID = message.author.id;
    // user-id from our website
    const webUserID = messageArray[2];
    // our key should be between 30 and 40 characters
    // in our case, this block works fine here, but in others 
    // it should go after the specific word check later in the code.
    if (webUserID.length < 33 || webUserID.length > 39) {
        message.reply('That key isn\'t the right length. Try again!');
        return;
    };

    // looks for a specific word, in our case, activate
    if (messageArray[1].toLowerCase() == 'activate') {
        // finds a user with the id that we set earlier
        User.findOne({ 'local.webID': webUserID }, function(err, user) {
            if (err) {
                message.reply('I ran into an error. :(');
                return;
            } else if (user == null) {
                message.reply(`Invalid ID! Contact <@${discordAdminID}>.`);
                return;
            }
            // checks if their discord ID is undefined
            else if (user.local.discordID == undefined) {
                // update user info in our database!
                User.update({ '_id': user._id }, {
                    $set: {
                        'local.webID': discordUserID,
                        'local.UserVerifiedStatus': true
                    }
                }, function() {
                    message.reply('Your account has been activated! Log in!');
                    console.log(`Activated ${user.local.email}.`);
                    return;
                })
            } else {
                // looks like the user already activated an account!
                message.reply(`Hmm, discord account already used. Contact <@${discordAdminID}>.`);
                return;
            }
        })
    } else {
        // user entered an unsupported command.
        message.reply('Message not recognized! Try again!');
        return;
    }
});
