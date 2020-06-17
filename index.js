var express = require('express');
var router = express.Router();
var url = require("url");

const { check, validationResult } = require('express-validator');
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

// Login Get Method
router.get('/login', hasItem, function (req, res, next) {
  res.render('login', { title: 'Login Here', msg: '' });
});

// Login Put Method
router.post('/login', function (req, res, next) {
  var loginUsername = req.body.username;
  var loginPassword = req.body.password;

  var getUser = registerModel.findOne({ userName: loginUsername });

  if (loginUsername != "" || loginPassword != "") {
    getUser.exec(function (err, data) {
      if (err) throw err;
      if(data){
        var userId = data._id;
        var userName = data.userName;

        if (loginPassword == data.password) {
          var token = jwt.sign({ _id: userId }, 'loginToken');
          console.log("Login Succesfully");

          localStorage.setItem('loginKey', token);
          localStorage.setItem('userName', userName);

          res.redirect("/category");
        } else {
          res.render("login", { msg: "Invalid User Name or Password" });
        }
      }else{
        res.render("login", { msg: "User Name Not Found" });
      }
    })
  }else{
    res.render("login", { msg: "Fill the text box before submit" });
  }
});

//Register Get Method
router.get('/register', hasItem, function (req, res, next) {
  res.render('register', { title: 'Register Now', msg: '' });
});
var Errors = {
  username : 'Username should be 5 characters long',
  password : 'Password should be 3 characters long',
  email : 'Enter a valid Email',
  phone : 'Phone should be a number type and 10 characters equal',
}

//Register Post Method
router.post('/register', [
  check('username', Errors.username).isLength({ min: 5 }), 
  check('email', Errors.email).isEmail(),
  check('password', Errors.password).isLength({ min: 3 }),
  check('phone', Errors.phone).isNumeric().isLength({ min: 10, max:10 })
], 
emailExist, userNameExist, function (req, res, next) {
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errorsObject = errors.mapped();
    for (err in errorsObject){
      res.render('register', { msg : errorsObject[err].msg });
    }

  }else{
    registerInstance.save(function (err, data) {
      if (err) throw err;
  
      // var rToken = jwt.sign({ userName: data.userName }, 'registerToken');
      // localStorage.setItem('registerKey', rToken);
      // localStorage.setItem('userName', data.userName);
     
      res.redirect("/category")
    })
  }
});

// category Get Creation
router.get('/category', checkLogin, function (req, res, next) {
  var getUserName = localStorage.getItem('userName');
  res.render('category', {user: getUserName, msg:'' });
});

// category Redirection
router.get('/add-category', function(req, res){
  res.redirect("/category");
})

// category Errors Object
var catErrors = {
  category : 'Category should be 3 characters long',
  projectName : 'Project Name should be 4 characters long',
  passwordDetails : 'Password Details Name should be 4 characters long',
}

// category Post method
router.post('/add-category', [
  check('categoryName', catErrors.category).isLength({ min: 3 }),
  check('projectName', catErrors.projectName).isLength({ min: 4 }),
  check('passwordDetails', catErrors.passwordDetails).isLength({ min: 4 }),
], function (req, res, next) {

  var getUserName = localStorage.getItem('userName');
  var date = moment().format("MMMM Do YYYY, h:mm:ss a");

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
    date: date,
    edit : "",
  })

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var catErrorsObject = errors.mapped();
    for (err in catErrorsObject){
      res.render('category', { msg : catErrorsObject[err].msg, user: getUserName });
    }

  }else{
    categoryInstance.save(function (err, data) {
      if (err) throw err;
      res.redirect("/view-category");
    })
  }
});

// View category get method and Join two collection
router.get("/view-category", function (req, res) {
  var getUserName = localStorage.getItem('userName');
  // registerModel.aggregate([
  //   {
  //     $lookup: {
  //       from: "categories",
  //       localField: "userName",
  //       foreignField: "userId",
  //       as: "userDetails"
  //     }
  //   },
  //   { $unwind: "$userDetails" },
  //   { $match : { userName :  getUserName} },
  // ]).exec(function (err, result) {
  //   if (err) throw err;
  //   res.render("view-category", { records: result, userValue: getUserName, user: getUserName});
  // })
  var page = 1;
  var perPageItem = 4;
  var categoryFind = categoryModel.find({userId: getUserName});
  
  categoryFind.skip((perPageItem * page)-perPageItem).limit(perPageItem).exec(function(err, result){
    if (err) throw err;
    categoryModel.find({userId: getUserName}).countDocuments({}).exec(function(err, count){
      if (err) throw err;
      // console.log(Math.ceil(count/perPageItem));
      res.render("view-category", { records: result, user: getUserName, count: Math.ceil(count/perPageItem), currentPage: page});
    })
    
  })
});

//Pagination method
router.get("/view-category/:pages", (req, res) => {
  var getUserName = localStorage.getItem('userName');
  var page = req.params.pages;
  var perPageItem = 4;
  var categoryFind = categoryModel.find({userId: getUserName});
  categoryFind.skip((perPageItem * page)-perPageItem).limit(perPageItem).exec(function(err, result){
    if (err) throw err;
    categoryModel.find({userId: getUserName}).countDocuments({}).exec(function(err, count){
      if (err) throw err;
      // console.log(Math.ceil(count/perPageItem));
      res.render("view-category", { records: result, user: getUserName, count: Math.ceil(count/perPageItem), currentPage: page});
    })
    
  })  
})

// Edit Category get method
router.get('/category/edit/:id', function(req, res){
  var getUserUserId = req.params.id;
  var Error = req.body.hiddenErrors;
  var findResult = categoryModel.findById({'_id': getUserUserId});
  findResult.exec(function(err, result){
    if(result){
      res.render('edit-category', { msg:'', result: result, errorsValue: Error});
    }
  })
  
})

//Edit post method
router.post('/category/edit/:id', [
  check('categoryName', catErrors.category).isLength({ min: 3 }),
  check('projectName', catErrors.projectName).isLength({ min: 4 }),
  check('passwordDetails', catErrors.passwordDetails).isLength({ min: 4 }),
], function (req, res, next) {

  var getUserName = localStorage.getItem('userName');
  var date = moment().format("MMMM Do YYYY, h:mm:ss a");

  var gethiddenid = req.body.hiddenId;
  var categoryName = req.body.categoryName;
  categoryName = categoryName.slice(0, 1).toUpperCase() + categoryName.slice(1, categoryName.length).toLowerCase();
  var projectName = req.body.projectName;
  projectName = projectName.slice(0, 1).toUpperCase() + projectName.slice(1, projectName.length).toLowerCase();
  var passwordDetails = req.body.passwordDetails;
  const errors = validationResult(req);
    categoryModel.findById({'_id': gethiddenid}).exec(function(err, result){
      if (err) throw err;
      if (!errors.isEmpty()) {
        var catErrorsObject = errors.mapped();
        for (err in catErrorsObject){
          res.render('edit-category', { msg : catErrorsObject[err].msg, user: getUserName, result: result, errorsValue: catErrorsObject[err].value });
        }
    
      }else{
      categoryModel.findByIdAndUpdate({'_id': gethiddenid}, {
        categoryName: categoryName,
        projectName: projectName,
        passwordDetails: passwordDetails,
        userId: getUserName,
        date: date,
        lastEdit : "( last Edited )"

      }).exec((err) => {
        if (err) throw err;
        categoryModel.findById({'_id': gethiddenid}).exec(function(err, result){
          res.redirect("/view-category");
          // res.render('view-category', { msg:'', records: result});
        })
        
      })
    }
    });
})

// Single category delete method

router.get("/category/delete/:id", (req, res) => {
  var delId = req.params.id;

  categoryModel.findByIdAndDelete({_id: delId}).exec(function(err){
    if (err) throw err;
    res.redirect("/view-category");
  })
})

//get Id from checkbox

router.get("/delete-multiple", (req, res) => {
  res.redirect("/view-category");
})
router.post("/delete-multiple", (req, res) => {
  var allId = req.body.idVal;
  let _idArray = allId.split(",")

  categoryModel.deleteMany({_id: {$in: _idArray}}, function(err, data){
    if (err) throw err;
    console.log(data)
    res.redirect("/view-category");
  })
})


// Logout get method 
router.get('/logout', function (req, res, next) {
  localStorage.removeItem('loginKey');
  localStorage.removeItem('userName');
  res.redirect('/login');
});





// All Function Method
function emailExist(req, res, next){
  var findEmail = registerModel.findOne({email: req.body.email});
  findEmail.exec((err, email) => {
    if(err) throw err;
    if(email){
      res.render("register", {"msg": "This email already exist try different"})
    }else{
      next();
    }
  })
}
function userNameExist(req, res, next){
  var findUsername = registerModel.findOne({userName: req.body.username});
  findUsername.exec((err, userName) => {
    if(err) throw err;

    if(userName){
      res.render("register", {"msg": "This username already exist try different"})
    }else{
      next();
    }
  })
}
function checkLogin(req, res, next){
  var loginKey = localStorage.getItem('loginKey');
  try {
    var decoded = jwt.verify(loginKey, 'loginToken');
  } catch(err) {
    res.redirect("/login")
  }
  next();
}

function hasItem(req, res, next){
  var userName = localStorage.getItem('userName');
  if (userName) {
    res.redirect("/category")
  }
  next();
}


module.exports = router;
