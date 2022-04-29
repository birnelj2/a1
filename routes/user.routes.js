const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const checkAuth = require('../middleware/checkAuth.middleware');
const userControllers = require('../controllers/users.controllers');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.json());
router.use(express.static('public'));


router.post('/logout', userControllers.userLogout);

router.post('/login', userControllers.userAuth, function(req, res, next) {
	res.redirect('/post');
});

router.get('/login', function(req, res) {
	res.render('login');
});

router.get('/register', function(req, res) {
	res.render('register', {
		title: 'Register'
	});
});

function checkErrors(req,res,next){
	const errors=validationResult(req);
	if(!errors.isEmpty()){
		console.log("Error Invalid Register Fields");
		return
	}
	console.log('hey')
	next();
}

router.post(
	'/register',
	body('username', 'Username field cannot be empty.').notEmpty(),
	body('password', 'Password must be at least 8 characters long, contain lowercase uppercase and symbol').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
	//body('username', 'Password must be at least 8 characters long, contain lowercase uppercase and symbol').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
	//body('email', 'Password must be at least 8 characters long, contain lowercase uppercase and symbol').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
	body('email','email cant be empty').notEmpty(),
	body('passwordMatch', 'Passwords do not match, please enter matching passwords.').custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error('Password confirmation does not match password');
		}
		// Indicates the success of this synchronous custom validator
		return true;
	}),
	checkErrors,
	userControllers.emailExists,
	userControllers.userExists,
    userControllers.userRegister
);

module.exports = router