var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kammo:kammo120@productservice-ci6mm.mongodb.net/project1', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

var db = mongoose.connection;
var registerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        index: true
    },
    userName: {
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

var registerModel = mongoose.model("account", registerSchema);

module.exports = registerModel;