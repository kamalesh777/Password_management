var express = require('express');
var router = express.Router();
var url = require("url");
var moment = require('moment');
var jwt = require('jsonwebtoken');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

var registerModel = require("../module/registerModule");
var categoryModel = require("../module/categoryModule");




/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect("/login")
});
router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login Here', msg: '' });
});
router.post('/login', function (req, res, next) {
  var loginUsername = req.body.username;
  var loginPassword = req.body.password;

  var getUser = registerModel.findOne({ userName: loginUsername });
  if (loginUsername != "" || loginPassword != "") {
    getUser.exec(function (err, data) {
      if (err) throw err;
      var userId = data._id;
      var userName = data.userName;
      if (loginPassword == data.password) {
        var token = jwt.sign({ _id: userId }, 'loginToken');
        console.log("Login Succesfully");

        localStorage.setItem('myFirstKey', token);
        localStorage.setItem('userName', userName);

        res.redirect("/category?logID="+userId);
      } else {
        res.render("login", { msg: "Invalid User Name" });
      }
    })
  }else{
    res.render("login", { msg: "Invalid User Name" });
  }


});

//Register Method
router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Register Now', msg: '' });
});

router.post('/register', function (req, res, next) {
  var date = moment().format("MMMM Do YYYY, h:mm:ss a");
  var fullName = req.body.fullname;
  var email = req.body.email;
  var password = req.body.password;
  var userName = req.body.username;
  var phone = req.body.phone;

  var registerInstance = new registerModel({
    fullName: fullName,
    email: email,
    password: password,
    userName: userName,
    phone: phone,
    date: date
  })
  registerInstance.save(function (err, data) {
    if (err) throw err;
    // console.log(data);
    res.redirect("/category")
    // res.render('login', { user: data.userName, msg: '' });
  })
});


// category Creation
router.get('/category', function (req, res, next) {
  var getUserName = localStorage.getItem('userName');
  res.render('category', { title: 'Biodata', user: getUserName });
});

router.post('/add-category', function (req, res, next) {
  var date = moment().format("MMMM Do YYYY, h:mm:ss a");
  // var getUserName = localStorage.getItem('userName');
  var gethiddenName = req.body.hiddenUser;
  var categoryName = req.body.categoryName;
  categoryName = categoryName.slice(0, 1).toUpperCase() + categoryName.slice(1, categoryName.length).toLowerCase();
  var projectName = req.body.projectName;
  projectName = projectName.slice(0, 1).toUpperCase() + projectName.slice(1, projectName.length).toLowerCase();
  var passwordDetails = req.body.passwordDetails;

  var categoryInstance = new categoryModel({
    categoryName: categoryName,
    projectName: projectName,
    passwordDetails: passwordDetails,
    userId: gethiddenName,
    date: date
  })

  categoryInstance.save(function (err, data) {
    if (err) throw err;
    res.redirect("/view-category");
  })
});

router.get("/view-category", function (req, res) {
  var getUserName = localStorage.getItem('userName');

  registerModel.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "userName",
        foreignField: "userId",
        as: "userDetails"
      }
    },
    { $unwind: "$userDetails" },
    { $match : { userName :  getUserName} },
  ]).exec(function (err, result) {
    if (err) throw err;
    res.render("view-category", { records: result, userValue: getUserName });
  })
});

router.get('/logout', function (req, res, next) {
  localStorage.removeItem('loginToken');
  localStorage.removeItem('userName');
  res.redirect('/login');
});

module.exports = router;
