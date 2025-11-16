/**
 * Express Application Configuration
 *
 * This file configures:
 * - Express middleware (Helmet, sessions, CSRF protection)
 * - View engine (EJS)
 * - Static file serving
 * - Routes
 * - Error handling
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const csrf = require('csurf');
const supabase = require('./config/supabase');
const cookie = require('cookie');

const usersRouter = require('./routes/users');
const notesRouter = require('./routes/notes');

// Initialize Express app
const app = express();

// Security middleware - Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// View engine setup - EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// CSRF protection
// Note: Apply this after session middleware
const csrfProtection = csrf({ cookie: false });

app.use(async (req, res, next) => {
  try {
    const raw = req.headers.cookie || '';
    const cookies = cookie.parse(raw || '');
    const access = cookies['sb-access-token'];
    if (!access) return next();

    const { data, error } = await supabase.auth.getUser(access);
    if (!error && data?.user) {
      const u = data.user;
      req.user = {
        id: u.id,
        email: u.email,
        name:
          (u.user_metadata &&
            (u.user_metadata.display_name || u.user_metadata.username)) ||
          (u.email ? u.email.split('@')[0] : 'User'),
      };
    }
  } catch (_) { /* empty */ }
  next();
});

// Make CSRF token available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

async function requireAuth(req, res, next) {
  try {
    const raw = req.headers.cookie || '';
    const cookies = cookie.parse(raw);

    const access = cookies['sb-access-token'];
    const refresh = cookies['sb-refresh-token'];

    if(!access) return res.redirect('/users/login');

    let { data: userData, error } = await supabase.auth.getUser(access);

    if(error && refresh) {
      const { data: sessionData, error: refreshErr } =
        await supabase.auth.setSession({
          access_token: access,
          refresh_token: refresh
        });

        if(refreshErr || !sessionData?.session) {
          return res.redirect('/users/login');
        }

        const newAccess = sessionData.session.access_token;
        const newRefresh = sessionData.session.refresh_token;

        res.cookie('sb-access-token', newAccess, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });

        res.cookie('sb-refresh-token', newRefresh, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });

        const again = await supabase.auth.getUser(newAccess);
        userData = again.data;
    }

    if(!userData?.user) return res.redirect('/users/login');

    const u = userData.user;
    req.user = {
      id: u.id,
      email: u.email,
      name: (u.user_metadata && (u.user_metadata.display_name || u.user_metadata.username))
            || (u.email ? u.email.split('@')[0] : 'User')
    };

    next();
  } catch(err) {
    console.error('Auth error:', err);
    return res.redirect('/users/login');
  }
}

// Placeholder home route
app.get('/', csrfProtection, (req, res) => {
  res.render('index', {
    title: 'Home',
    csrfToken: req.csrfToken(),
  });
});

//Register page
app.get('/users/register', csrfProtection, (req, res) => {
  res.render('register', {
    title: 'Register',
    csrfToken: req.csrfToken(),
  });
});

//About page
app.get('/users/about', csrfProtection, (req, res) => {
  res.render('about', {
    title: 'About',
    csrfToken: req.csrfToken(),
  });
});

// Log in page
app.get('/users/login', csrfProtection, (req, res) => {
  if (req.user) return res.redirect('/notes/list');
  res.render('login', {
    title: 'Login',
    csrfToken: req.csrfToken(),
  });
});

//logging out current user
app.get('/users/logout', async (req, res) => {
  await supabase.auth.signOut();
  res.clearCookie('sb-access-token');    //clear user data
  res.clearCookie('sb-refresh-token');   //clear more user data
  res.redirect('/');                     //go back to homepage
});

app.use('/users', csrfProtection, usersRouter);

app.use('/notes', csrfProtection, requireAuth, notesRouter);


// 404 handler error page
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: { status: 404 },
  });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Set locals, only providing error details in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // Render error page
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error',
    message: err.message,
    error: res.locals.error,
  });
});

module.exports = app;
