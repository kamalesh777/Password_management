var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kammo:kammo120@productservice-ci6mm.mongodb.net/project1', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
const passportLocalMongoose = require('passport-local-mongoose');
var db = mongoose.connection;
var registerSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        index: true
    },
    phone: {
        type: String,
        required: true,
        index: true
    },
    
    date: {
        type: String
    }

});
registerSchema.plugin(passportLocalMongoose);
var registerModel = mongoose.model("account", registerSchema);

module.exports = registerModel;