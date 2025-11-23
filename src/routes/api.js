const express = require('express');
const router = express.Router();

const apiController = require('../controllers/apiController');

router.get('/inspire', apiController.getInspiration);

module.exports = router;
