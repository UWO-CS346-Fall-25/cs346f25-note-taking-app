/**
 * User Controller
 *
 * Handles user-related operations:
 * - Registration
 * - Login/Logout
 * - Profile management
 * - Authentication
 */

// Import models
// const User = require('../models/User');

const supabase = require('../config/supabase');
const cookie = require('cookie');

/**
 * GET /users/register
 * Display registration form
 */
exports.getRegister = (req, res) => {
  res.render('register', {
    title: 'Register',
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/register
 * Process registration form
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;


    if(!email || !password || !username) {
      return res.render('register', {
        title: 'Register',
        error: 'All fields are required.',
        csrfToken: req.csrfToken(),
      })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        }
      }
    });

    if(error) {
      console.error('Registration error:', error.message);
      return res.render('register', {
        title: 'Register',
        error: error.message,
        csrfToken: req.csrfToken(),
      });
    }

    // Redirects after successful login
    res.redirect('/users/login');

    // Validate input
    // Hash password
    // Create user in database
    // const user = await User.create({ username, email, password: hashedPassword });

    // Set session
    // req.session.user = { id: user.id, username: user.username };
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/login
 * Display login form
 */
exports.getLogin = (req, res) => {
  res.render('login', {
    title: 'Login',
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/login
 * Process login form
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if(error) {
      console.error('Login error:', error.message);
      return res.render('login',{
        title: 'Login',
        error: error.message,
        csrfToken: req.csrfToken(),
      });
    }

    // Sets cookies with the tokens
    const { access_token, refresh_token } = data.session;

    res.setHeader('Set-Cookie', [
      cookie.serialize('sb-access-token', access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      }),
      cookie.serialize('sb-refresh-token', refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      }),
    ]);

    // Set session
    // req.session.user = { id: user.id, username: user.username };

    // Redirect to home or dashboard
    res.redirect('/notes');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /users/logout
 * Logout user
 */
exports.postLogout = async (req, res) => {
  try {
    await supabase.auth.signOut();

    res.setHeader('Set-Cookie', [
      cookie.serialize('sb-access-token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      }),
      cookie.serialize('sb-refresh-token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      }),
    ]);

    res.redirect('/')
  } catch(error) {
    console.error('Logout error:', error);
    res.redirect('/');
  }
};

// Add more controller methods as needed
