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
  console.log('[UserController] GET /users/register');
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
  console.log('[UserController] POST /users/register start', {
    email: req.body?.email,
  });
  try {
    const { username, email, password } = req.body;


    if(!email || !password || !username) {
      console.warn('[UserController] Registration missing fields', { email });
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
      console.error('[UserController] Registration error', {
        message: error.message,
      });
      return res.render('register', {
        title: 'Register',
        error: error.message,
        csrfToken: req.csrfToken(),
      });
    }

    console.log('[UserController] Registration success', { email });
    // Redirects after successful login
    res.redirect('/users/login');

    // Validate input
    // Hash password
    // Create user in database
    // const user = await User.create({ username, email, password: hashedPassword });

    // Set session
    // req.session.user = { id: user.id, username: user.username };
  } catch (error) {
    console.error('[UserController] Registration error', {
      message: error?.message,
    });
    next(error);
  }
};

/**
 * GET /users/login
 * Display login form
 */
exports.getLogin = (req, res) => {
  console.log('[UserController] GET /users/login');
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
  console.log('[UserController] POST /users/login start', {
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
      console.warn('[UserController] Login failed', { email });
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

    console.log('[UserController] Login success', { email });

    // Redirect to home or dashboard
    res.redirect('/notes/list');
  } catch (error) {
    console.error('[UserController] Login error', { message: error?.message });
    next(error);
  }
};

/**
 * POST /users/logout
 * Logout user
 */
exports.postLogout = async (req, res) => {
  console.log('[UserController] POST /users/logout');
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

    console.log('[UserController] Logout success');

    res.redirect('/');
  } catch(error) {
    console.error('[UserController] Logout error', {
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
