// routeAdmin

const express = require('express');
const authenticate = require('../middleware/verifyToken');
const handlePeminjaman = require('../controllers/adminController.js');

const router = express.Router();

// Rute dinamis berdasarkan parameter 'type'
router.get('/:type', authenticate, handlePeminjaman.getPeminjamanAll);
router.get('/:type/:peminjamanId', authenticate, handlePeminjaman.getPeminjamanById);
// put di node js untuk update
router.put('/:type/:peminjamanId/disetujui', authenticate, handlePeminjaman.editDisetujui);
router.put('/:type/:peminjamanId/ditolak', authenticate, handlePeminjaman.editDitolak);
router.delete('/:type/:peminjamanId/', authenticate, handlePeminjaman.deletePeminjamanById);

module.exports = router;
