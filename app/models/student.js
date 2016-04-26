var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var StudentSchema   = new Schema({
    name: String,
    password: String,
    admin: Boolean
});

module.exports = mongoose.model('Student', StudentSchema);
