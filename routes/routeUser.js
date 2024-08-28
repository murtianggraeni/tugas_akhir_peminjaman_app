const express = require('express');
const { upload, peminjamanHandler, getPeminjamanAllHandler, getPeminjamanByIdHandler, extendPeminjamanHandler } = require('../controllers/userController');
const { getCounts } = require('../controllers/countController');
const authenticate = require('../middleware/verifyToken');

const router = express.Router();

// Rute dinamis berdasarkan parameter 'type'
router.post('/:type/peminjaman', authenticate, upload.single('desain_benda'), peminjamanHandler);
router.get('/peminjamanAll', authenticate, getPeminjamanAllHandler);
router.get('/peminjaman/:peminjamanId', authenticate, getPeminjamanByIdHandler);
router.put('/peminjaman/:peminjamanId', authenticate, extendPeminjamanHandler);


router.get('/counts', authenticate, getCounts);

module.exports = router;
