/**
 * User Routes
 *
 * Define routes related to user operations here.
 * This could include:
 * - User registration
 * - User login/logout
 * - User profile
 * - User management (admin)
 *
 * Example usage:
 * const express = require('express');
 * const router = express.Router();
 * const userController = require('../controllers/userController');
 *
 * router.get('/register', userController.getRegister);
 * router.post('/register', userController.postRegister);
 * router.get('/login', userController.getLogin);
 * router.post('/login', userController.postLogin);
 * router.post('/logout', userController.postLogout);
 *
 * module.exports = router;
 */

const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');

const ensureAuth = (req, res, next) => {
  if(!req.user) return res.redirect('/users/login');
  next();
};

// Define routes
router.get('/register', userController.getRegister);
router.post('/register', userController.postRegister);

// Log in
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);



router.get('/profile', ensureAuth, userController.getProfile);
router.post('/profile/name', ensureAuth, userController.postUpdateName);
router.post('/profile/password', ensureAuth, userController.postChangePassword);

router.post('/logout', userController.postLogout);


module.exports = router;
