var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kammo:kammo120@productservice-ci6mm.mongodb.net/project1', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

var db = mongoose.connection;
var categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        index: true
    },
    projectName: {
        type: String,
        required: true,
        index: true
    },
    passwordDetails: {
        type: String,
        required: true,
        index: true
    },
    userId: String,
    date: {
        type: String
    },
    lastEdit : String

});

var categoryModel = mongoose.model("category", categorySchema);

module.exports = categoryModel;