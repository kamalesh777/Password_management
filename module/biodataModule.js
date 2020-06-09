var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kammo:kammo120@productservice-ci6mm.mongodb.net/project1', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

var db = mongoose.connection;
var biodataSchema = new mongoose.Schema({
    profession: {
        type: String,
        required: true,
        index: true
    },
    skill: {
        type: String,
        required: true,
        index: true
    },
    experience: {
        type: String,
        required: true,
        index: true
    },
    user: String,
    date: String,

});

var biodataModel = mongoose.model("biodata", biodataSchema);

module.exports = biodataModel;