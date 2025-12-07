/**
 * Index Controller
 *
 * Controllers handle the business logic for routes.
 * They process requests, interact with models, and send responses.
 *
 * Best practices:
 * - Keep controllers focused on request/response handling
 * - Move complex business logic to separate service files
 * - Use models to interact with the database
 * - Handle errors appropriately
 */

// Import models if needed
// const SomeModel = require('../models/SomeModel');
const ts = () => `[${new Date().toISOString()}]`;
/**
 * GET /
 * Display the home page
 */
exports.getHome = async (req, res, next) => {
  console.log(`${ts()} [IndexController] GET / start`);
  try {
    // Fetch any data needed for the home page
    // const data = await SomeModel.findAll();

    res.render('index', {
      title: 'Home',
      // data: data,
      csrfToken: req.csrfToken(),
    });
    console.log(`${ts()} [IndexController] GET / render success`);
  } catch (error) {
    console.error(`${ts()} [IndexController] GET / error`, {
      message: error?.message,
    });
    next(error);
  }
};

/**
 * GET /about
 * Display the about page
 */
exports.getAbout = async (req, res, next) => {
  console.log(`${ts()} [IndexController] GET /about start`);
  try {
    res.render('about', {
      title: 'About',
      csrfToken: req.csrfToken(),
    });
    console.log(`${ts()} [IndexController] GET /about render success`);
  } catch (error) {
    console.error(`${ts()} [IndexController] GET /about error`, {
      message: error?.message,
    });
    next(error);
  }
};

// Add more controller methods as needed
