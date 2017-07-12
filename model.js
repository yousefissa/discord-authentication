// use your own model. I've included a sample one I found online.

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');


var userSchema = mongoose.Schema({
    local: {
        userEmail: String,
        userPassword: String,
        webID: String,
        UserVerifiedStatus: Boolean,
        discordID: String
    }});


userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};
module.exports = mongoose.model('User', userSchema); 
