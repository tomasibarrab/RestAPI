var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var StudentSchema   = new Schema({
    name: String,
    password: String,
    admin: Boolean,
    token: String,
    secWord: String
});

module.exports = mongoose.model('Student', StudentSchema);
