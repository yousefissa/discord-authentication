// get the config file and assign vars
const authConfig = require('./config.json')
const channelID = authConfig.discordChannelID;
const discordToken = authConfig.discordToken;
const botPrefix = authConfig.botPrefix;
const discordAdminID = authConfig.adminID;


// discord setup
const Discord = require('discord.js');
const discordClient = new Discord.Client();


// mongo setup
const mongoose = require('mongoose');
// set the conection, change your url!
const mongoDB = 'mongodb URL';
mongoose.connect(mongoDB);
// get connection
var datab = mongoose.connection;
// get error event
datab.on('error', console.error.bind(console, 'MongoDB connection error!'));


// get schema
const User = require('./model');
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
    // get the role object
    afkRole = discordClient.guilds.get('ROLE ID').roles.find('name', 'AFK');
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
    // looks for new lines. they break our bot.
    if (message.content.indexOf("\n") !== -1) {
        message.reply('Please keep your message on one line!');
        return;
    }

    // splits at spaces
    const messageArray = message.content.split(' ');
    // check if all arguments are present
    if (messageArray.length < 2 || messageArray[1].length > 9) {
        message.reply('Invalid argument count!');
        return;
    }
    // lets check if they're asking for help!
    // NOTE: Change to your domain.
    if (messageArray[1].toLowerCase() == 'help') {
        message.reply('Log onto http://houseofcarts.io to get your HOC-ID, then activate your account by using `h! activate <your-hoc-key>`! Check pinned for more info and commands.');
        return;
    }
    try {
        // check if they are trying to assign themselves as afk
        if (messageArray[1].toLowerCase() == 'afk') {
            try {
                message.guild.members.get(message.author.id).addRole(afkRole);
                message.reply('You\'ve been added to the AFK role. Enjoy your break! :heart:');
                return;
            } catch (err) {
                message.reply(`I ran into a problem! :cry: Contact <@${discordAdminID}>.`);
                return;
            }
        }
        // check if user wants to get off the afk role
        if (messageArray[1].toLowerCase() == 'back') {
            message.guild.members.get(message.author.id).removeRole(afkRole);
            message.reply('You\'ve been removed from the AFK role. Welcome back. :fire:');
            return;
        }
    } catch (err) {
        message.reply(`I ran into a problem! :cry: Contact <@${discordAdminID}>.`);
        return;
    };
    // check if the user included an extra space
    if (messageArray.indexOf('') >= 0) {
        message.reply('Watch your spacing! You seem to have added an extra space.');
        return;
    };

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
        // NOTE: Change your DB key
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
