const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

const passwordRules = [
	body('password')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long')
		.matches(/[a-z]/)
		.withMessage('Password must contain a lowercase letter')
		.matches(/[A-Z]/)
		.withMessage('Password must contain an uppercase letter')
		.matches(/[0-9]/)
		.withMessage('Password must contain a number')
		.matches(/[^A-Za-z0-9]/)
		.withMessage('Password must contain a special character')
];

router.post(
	'/register',
	[
		body('fullName').trim().notEmpty().withMessage('Full name is required'),
		body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
		body('phone').matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
		...passwordRules,
		body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
	],
	authController.register
);

router.post(
	'/login',
	[
		body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
		body('password').notEmpty().withMessage('Password is required')
	],
	authController.login
);

router.get('/me', auth, authController.me);
router.put('/password', auth, authController.changePassword);

router.post(
	'/forgot-password',
	[
		body('identifier')
			.trim()
			.isEmail()
			.withMessage('A valid registered email is required')
			.normalizeEmail()
	],
	authController.requestPasswordReset
);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
