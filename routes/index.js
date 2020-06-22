var express = require('express');
var router = express.Router();
var url = require("url");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; 
const { check, validationResult } = require('express-validator');
var moment = require('moment');
var registerModel = require("../module/registerModule");
var categoryModel = require("../module/categoryModule");
var session = require('express-session');
var passport = require("passport");

router.use(session({
  secret: 'My session storage',
  resave: false,
  saveUninitialized: false
}))

router.use(passport.initialize());
router.use(passport.session());


passport.use(registerModel.createStrategy());
passport.serializeUser(registerModel.serializeUser());
passport.deserializeUser(registerModel.deserializeUser());


router.get('/', isAuthentic, function (req, res, next) {
  res.redirect("/login")
});

// Login Get Method
router.get('/login', isAuthentic, function (req, res, next) {
  res.render('login', { title: 'Login Here', errMsg: '' });
});

// Login Put Method
router.post('/login', function(req, res, next){
  passport.authenticate('local', function(err, user, info){
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log(info);
      return res.render("login", {errMsg: info.message})
    }
    req.login(user, function(err){
      if (err) {
        return next(err);
      }
      return res.redirect("/category");
    })
  })(req, res, next)

});

//Register Get Method
router.get('/register', isAuthentic, function (req, res, next) {
  res.render('register', { title: 'Register Now', errMsg: '' });
});
var Errors = {
  fullname: 'Full Name should be 5 characters long',
  username: 'Username should be 5 characters long',
  password: 'Password should be 3 characters long',
  email: 'Enter a valid Email',
  phone: 'Phone should be a number type and 10 characters equal',
}

//Register Post Method
router.post('/register', [
  check('fullname', Errors.fullname).isLength({ min: 5 }),
  check('username', Errors.username).isLength({ min: 5 }),
  check('email', Errors.email).isEmail(),
  check('password', Errors.password).isLength({ min: 3 }),
  check('phone', Errors.phone).isNumeric().isLength({ min: 10, max: 10 })
],
  function (req, res, next) {
    var User = new registerModel({
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      fullname: req.body.fullname,
      email: req.body.email,
      username: req.body.username,
      phone: req.body.phone,
    });
    var err = validationResult(req);
    if (!err.isEmpty()) {
      var errMapped = err.mapped();
      var errMsg = [];
      for (x in errMapped) {
        var err = errMapped[x].msg;
        res.render("register", { errMsg: err });
        errMsg.push(err);
      }

    } else {
      registerModel.register(User, req.body.password, function (err, user) {
        if (err) {

          // console.log(err); //err debugging
          res.render("register", { errMsg: err.message });
        } else {
          passport.authenticate('local')(req, res, function (err, result) {
            res.redirect("/category");
          })
        }
      });
    }
  });

// category Get Creation
router.get('/category', function (req, res, next) {
  if (req.isAuthenticated()) {
    var sessionUser = req.session.passport;
    res.render('category', { msg: '', user: sessionUser.user });
  } else {
    res.redirect("/");
  }
});

// category Redirection
router.get('/add-category', function (req, res) {
  res.redirect("/category");
})

// category Errors Object
var catErrors = {
  category: 'Category should be 3 characters long',
  projectName: 'Project Name should be 4 characters long',
  passwordDetails: 'Password Details Name should be 4 characters long',
}

// category Post method
router.post('/add-category', [
  check('categoryName', catErrors.category).isLength({ min: 3 }),
  check('projectName', catErrors.projectName).isLength({ min: 4 }),
  check('passwordDetails', catErrors.passwordDetails).isLength({ min: 4 }),
], function (req, res, next) {
  var sessionUser = req.session.passport.user;
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
    userId: sessionUser,
    date: date,
    edit: "",
  })

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var catErrorsObject = errors.mapped();
    for (err in catErrorsObject) {
      res.render('category', { msg: catErrorsObject[err].msg, user: sessionUser });
    }

  } else {
    categoryInstance.save(function (err, data) {
      if (err) throw err;
      res.redirect("/view-category");
    })
  }
});

// View category get method and Join two collection
router.get("/view-category", function (req, res) {
  if (req.isAuthenticated()) {
    var sessionUser = req.session.passport;
    var getUserName = sessionUser.user;
    
    var page = 1;
    var perPageItem = 4;
    var categoryFind = categoryModel.find({ userId: getUserName });
    
    categoryFind.skip((perPageItem * page) - perPageItem).limit(perPageItem).exec(function (err, result) {
      if (err) throw err;
      categoryModel.find({ userId: getUserName }).countDocuments({}).exec(function (err, count) {
        if (err) throw err;
        // console.log(Math.ceil(count/perPageItem));
        res.render("view-category", { records: result, user: getUserName, count: Math.ceil(count / perPageItem), currentPage: page});
      })

    })
  } else {
    res.redirect("/");
  }
});

//Pagination method
router.get("/view-category/:pages", (req, res) => {
  if (req.isAuthenticated()) {
    var sessionUser = req.session.passport;
    var getUserName = sessionUser.user;
    var page = req.params.pages;
    var perPageItem = 4;
    var categoryFind = categoryModel.find({ userId: getUserName });
    categoryFind.skip((perPageItem * page) - perPageItem).limit(perPageItem).exec(function (err, result) {
      if (err) throw err;
      categoryModel.find({ userId: getUserName }).countDocuments({}).exec(function (err, count) {
        if (err) throw err;
        // console.log(Math.ceil(count/perPageItem));
        res.render("view-category", { records: result, user: getUserName, count: Math.ceil(count / perPageItem), currentPage: page });
      })

    })
  } else {
    res.redirect("/");
  }
})

// Edit Category get method
router.get('/category/edit/:id', function (req, res) {
  if (req.isAuthenticated()) {
    var sessionUser = req.session.passport;
    var getUserName = sessionUser.user;
    var getUserUserId = req.params.id;
    var Error = req.body.hiddenErrors;
    var findResult = categoryModel.findById({ '_id': getUserUserId });
    findResult.exec(function (err, result) {
      if (result) {
        res.render('edit-category', { msg: '', result: result, errorsValue: Error, user: getUserName });
      }
    })
  }
})

//Edit post method
router.post('/category/edit/:id', [
  check('categoryName', catErrors.category).isLength({ min: 3 }),
  check('projectName', catErrors.projectName).isLength({ min: 4 }),
  check('passwordDetails', catErrors.passwordDetails).isLength({ min: 4 }),
], function (req, res, next) {

  var sessionUser = req.session.passport;
  var getUserName = sessionUser.user;
  var date = moment().format("MMMM Do YYYY, h:mm:ss a");

  var gethiddenid = req.body.hiddenId;
  var categoryName = req.body.categoryName;
  categoryName = categoryName.slice(0, 1).toUpperCase() + categoryName.slice(1, categoryName.length).toLowerCase();
  var projectName = req.body.projectName;
  projectName = projectName.slice(0, 1).toUpperCase() + projectName.slice(1, projectName.length).toLowerCase();
  var passwordDetails = req.body.passwordDetails;
  const errors = validationResult(req);
  categoryModel.findById({ '_id': gethiddenid }).exec(function (err, result) {
    if (err) throw err;
    if (!errors.isEmpty()) {
      var catErrorsObject = errors.mapped();
      for (err in catErrorsObject) {
        res.render('edit-category', { msg: catErrorsObject[err].msg, user: getUserName, result: result, errorsValue: catErrorsObject[err].value });
      }

    } else {
      categoryModel.findByIdAndUpdate({ '_id': gethiddenid }, {
        categoryName: categoryName,
        projectName: projectName,
        passwordDetails: passwordDetails,
        date: date,
        lastEdit: "( last Edited )"

      }).exec((err) => {
        if (err) throw err;
        categoryModel.findById({ '_id': gethiddenid }).exec(function (err, result) {
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

  categoryModel.findByIdAndDelete({ _id: delId }).exec(function (err) {
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
  let _idArray = allId.split(",");

  categoryModel.deleteMany({ _id: { $in: _idArray } }, function (err, data) {
    if (err) throw err;
    // console.log(data)
    res.redirect("/view-category");
  })
})


// Logout get method 
router.get('/logout', function (req, res, next) {
  req.logout();
  res.redirect('/');
});





function isAuthentic(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/category");
  }
  next();
}
module.exports = router;
