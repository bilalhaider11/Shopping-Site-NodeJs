const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const {validationResult} = require('express-validator')

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: process.env.API_KEY
  }
}));

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password:'',
      confirmPassword: ''
    },
    validationErrors: []
  });
};


// exports.getLogin =  (req, res, next) => {
//     // const isLoggedIn = req
//     //     .get('Cookie')
//     //     .split(';')[4]
//     //     .trim()
//     //     .split('=')[1];
//     // console.log(isLoggedIn)
//     // console.log(req.session.isLoggedIn)
//     res.render('auth/login', {
//         pageTitle: 'Login', 
//         path: '/login',
//         isAuthenticated: false
//     }); 
// };

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({email: email})
    .then(user => {
      if(!user){
        // req.flash('error', 'Invalid Email or Password!')
        // res.redirect('/login')
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid Email or Password!',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if(doMatch){
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            })
          }
          // req.flash('error', 'Invalid Email or Password!');
          // res.redirect('/login');
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid Email or Password!',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login')
        })
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
  };

// exports.postLogin =  (req, res, next) => {
//     // res.setHeader('Set-Cookie', 'loggedIn=true; HTTPOnly');
//     req.session.isLoggedIn = true;
//     res.redirect('/');
// };

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email, 
        password: password, 
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  // User.findOne({email: email})
  //   .then(userDoc => {
  //     if(userDoc){
  //       req.flash('error', 'Email already exists, please pick another one!')
  //       return res.redirect('/signup');
  //     }
      // return bcrypt
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {items: []}
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      // return transporter.sendMail({
      //   to: email,
      //   from: 'hafizbilal4706@gmail.com',
      //   subject: 'SignUp Successful!',
      //   html: '<h1>you Have successfully signedup!</h1>'
      // });
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
    // })
    // .catch(err => {
    //   console.log(err);
    // })
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });    
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      console.log(err);
      res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
      .then(user => {
        if(!user){
          req.flash('error', 'No account with such email exists!');
          res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'hafizbilal4706@gmail.com',
          subject: 'Reset Password',
          html: `
            <p>YOU HAVE REQUESTED FOR PASSWORD RESET</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new pasword!</p>
          `
        })
      })
      .catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      let message = req.flash('error');
      if(message.length > 0){
        message = message[0];
      }
      else{
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  let resetUser;

  User.findOne({
    resetToken: passwordToken, 
    resetTokenExpiration: {$gt: Date.now()}, 
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}