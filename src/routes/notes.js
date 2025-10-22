const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const noteController = require('../controllers/noteController');

const csrfProtection = csrf({ cookie: false });

router.get('/', csrfProtection, noteController.getNotes);
router.post('/add', csrfProtection, noteController.createNote);

module.exports = router;
