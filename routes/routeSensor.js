const express = require('express');
const sensorController = require('../controllers/sensorController');

const router = express.Router();

router.post('/:type/buttonPeminjaman', sensorController.buttonPeminjaman);
router.get('/:type/buttonPeminjaman', sensorController.getLatestData);
router.post('/:type/current', sensorController.updateCurrent);
router.get('/:type/current', sensorController.getLatestCurrent);

module.exports = router;