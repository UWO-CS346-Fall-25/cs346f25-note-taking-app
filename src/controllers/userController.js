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

// Timestamp helper
const ts = () => `[${new Date().toISOString()}]`;

/**
 * GET /users/register
 * Display registration form
 *
 * Input: none
 * Output: renders register.ejs
 */
exports.getRegister = (req, res) => {
  console.log(`${ts()} [UserController] GET /users/register`);
  res.render('register', {
    title: 'Register',
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/register
 * Process registration form
 *
 * Input: req.body { username, email, password }
 * Output: redirect to /users/login on success, or re-render register with error
 */
exports.postRegister = async (req, res, next) => {
  console.log(`${ts()} [UserController] POST /users/register start`, {
    email: req.body?.email,
  });
  try {
    const { username, email, password } = req.body;


    if(!email || !password || !username) {
      console.warn(`${ts()} [UserController] Registration missing fields`, {
        email,
      });
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
      console.error(`${ts()} [UserController] Registration error`, {
        message: error.message,
      });
      return res.render('register', {
        title: 'Register',
        error: error.message,
        csrfToken: req.csrfToken(),
      });
    }

    console.log(`${ts()} [UserController] Registration success`, { email });
    // Redirects after successful login
    res.redirect('/users/login');

    // Validate input
    // Hash password
    // Create user in database
    // const user = await User.create({ username, email, password: hashedPassword });

    // Set session
    // req.session.user = { id: user.id, username: user.username };
  } catch (error) {
    console.error(`${ts()} [UserController] Registration error`, {
      message: error?.message,
    });
    next(error);
  }
};

/**
 * GET /users/login
 * Display login form
 *
 * Input: none
 * Output: renders login.ejs
 */
exports.getLogin = (req, res) => {
  console.log(`${ts()} [UserController] GET /users/login`);
  res.render('login', {
    title: 'Login',
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/login
 * Process login form
 *
 * Input: req.body { email, password }
 * Output: redirect to /notes/list on success; 401 + login page on failure
 */
exports.postLogin = async (req, res, next) => {
  console.log(`${ts()} [UserController] POST /users/login start`, {
    email: req.body?.email,
  });
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const isProd = process.env.NODE_ENV === 'production';

    if(error || !data?.session) {
      console.warn(`${ts()} [UserController] Login failed`, { email });
      // Re-renders log in with error message
      return res.status(401).render('login',{
        title: 'Login',
        csrfToken: req.csrfToken(),
        error: error?.message || 'Invalid email or password.'
      });
    }

    // Sets cookies with the tokens
    const { access_token, refresh_token } = data.session;

    res.cookie('sb-access-token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
    });
    res.cookie('sb-refresh-token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
    });

    console.log(`${ts()} [UserController] Login success`, { email });

    // Redirect to home or dashboard
    res.redirect('/notes/list');
  } catch (error) {
    console.error(`${ts()} [UserController] Login error`, {
      message: error?.message,
    });
    next(error);
  }
};

/**
 * POST /users/logout
 * Logout user
 *
 * Input: none
 * Output: clears auth cookies, redirects to /
 */
exports.postLogout = async (req, res) => {
  console.log(`${ts()} [UserController] POST /users/logout`);
  try {
    await supabase.auth.signOut();

    res.clearCookie('sb-access-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.clearCookie('sb-refresh-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

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

    console.log(`${ts()} [UserController] Logout success`);

    res.redirect('/');
  } catch(error) {
    console.error(`${ts()} [UserController] Logout error`, {
      message: error?.message,
    });
    res.redirect('/');
  }
};

exports.getProfile = (req, res) => {
  if(!req.user) return res.redirect('/users/login');
  return res.render('profile', {
    title: 'Your Profile',
    csrfToken: req.csrfToken(),
    user: req.user,
  });
};

exports.postUpdateName = async (req, res) => {
  try {
    if(!req.user) return res.redirect('/users/login');
    const { displayName } = req.body;
    const name = (displayName || '').trim();
    if(!name || name.length < 2) {
      return res.redirect('/users/profile?error=Name%20too%20short');
    }

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name, username: name },
    });

    if(error) {
      return res.redirect('/users/profile?error=' +
        encodeURIComponent(error.message));
    }

    return res.redirect('/users/profile?message=' +
      encodeURIComponent('Name updated'));
  } catch (error) {
    console.error('Update name error:' + error);
    return res.redirect('/users/profile?error=Unexpected%20error');
  }
};

exports.postChangePassword = async (req, res) => {
  try {
    if (!req.user) return res.redirect('/users/login');
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.redirect('/users/profile?error=Password%20too%20short');
    }
    if (newPassword !== confirmPassword) {
      return res.redirect('/users/profile?error=Passwords%20do%20not%20match');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.redirect(
        '/users/profile?error=' +
          encodeURIComponent(error.message)
      );
    }

    return res.redirect(
      '/users/profile?message=' +
        encodeURIComponent('Password updated')
    );
  } catch (e) {
    console.error('Change password error:', e);
    return res.redirect('/users/profile?error=Unexpected%20error');
  }
};





// Add more controller methods as needed
