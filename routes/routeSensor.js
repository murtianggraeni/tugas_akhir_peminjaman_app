const express = require('express');
const sensorController = require('../controllers/sensorController');

const router = express.Router();

router.post('/:type/buttonPeminjaman', sensorController.buttonPeminjaman);
router.get('/:type/buttonPeminjaman', sensorController.getLatestData);

module.exports = router;