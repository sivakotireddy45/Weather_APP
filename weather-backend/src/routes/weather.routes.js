const express = require('express');
const {
  fetchAndStoreWeather,
  getResults,
  getResultById,
  clearResults
} = require('../controllers/weather.controller');

const router = express.Router();

router.get('/weather', fetchAndStoreWeather);

// All records
router.get('/results', getResults);

// Single record
router.get('/results/:id', getResultById);


router.delete('/results', clearResults);

module.exports = router;
