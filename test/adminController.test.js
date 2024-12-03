// Import dependencies yang diperlukan
const request = require('supertest');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const handlePeminjaman = require('../controllers/adminController');
const User = require('../models/userModel');
const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const { CncSensor, LaserSensor, PrintingSensor } = require('../models/sensorModel');

/**
 * MOCK SETUP
 * Membuat mock untuk semua model database yang digunakan
 * Ini diperlukan agar test tidak perlu koneksi ke database asli
 */
jest.mock('../models/userModel');
jest.mock('../models/peminjamanModel', () => ({
    // Mock untuk model Cnc, Laser, dan Printing dengan method yang diperlukan
    Cnc: { 
        findById: jest.fn(),           // Untuk mencari peminjaman berdasarkan ID
        find: jest.fn(),               // Untuk mencari banyak peminjaman
        findByIdAndDelete: jest.fn()   // Untuk menghapus peminjaman
    },
    Laser: { 
        findById: jest.fn(), 
        find: jest.fn(), 
        findByIdAndDelete: jest.fn() 
    },
    Printing: { 
        findById: jest.fn(), 
        find: jest.fn(), 
        findByIdAndDelete: jest.fn() 
    },
}));
jest.mock('../models/sensorModel', () => ({
    CncSensor: { find: jest.fn() },
    LaserSensor: { find: jest.fn() },
    PrintingSensor: { find: jest.fn() },
}));

jest.mock('../models/userModel', () => ({
    findOne: jest.fn()
}));

jest.mock('../middleware/checkAvailability', () => ({
    checkAvailability: jest.fn().mockResolvedValue(true), // Mock agar slot waktu selalu tersedia
}));

describe('Admin Controller', () => {
    let app;
    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use((req, res, next) => {
            req.username = { userId: 'adminUserId' };
            next();
        });
        app.get('/api/peminjaman/:type', handlePeminjaman.getPeminjamanAll);
        app.get('/api/peminjaman/:type/:peminjamanId', handlePeminjaman.getPeminjamanById);
        app.put('/api/peminjaman/approve/:type/:peminjamanId', handlePeminjaman.editDisetujui);
        app.put('/api/peminjaman/reject/:type/:peminjamanId', handlePeminjaman.editDitolak);
        app.delete('/api/peminjaman/:type/:peminjamanId', handlePeminjaman.deletePeminjamanById);
        app.get('/api/monitoring/:type', handlePeminjaman.getMonitoringData);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPeminjamanAll', () => {
        it('should return 403 if user is not admin', async () => {
            User.findOne.mockResolvedValue(null);
            const response = await request(app).get('/api/peminjaman/cnc');
            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Unauthorized. Only admin can approve peminjaman.");
        });

        it('should return 200 and peminjaman data if user is admin', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.find.mockResolvedValue([{ _id: '1', status: 'Menunggu' }, { _id: '2', status: 'Disetujui' }]);

            const response = await request(app).get('/api/peminjaman/cnc');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('getPeminjamanById', () => {
        it('should return 404 if peminjaman not found', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue(null);

            const response = await request(app).get('/api/peminjaman/cnc/123');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Data tidak ditemukan');
        });

        it('should return 200 and peminjaman data if found', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue({ _id: '123', nama_pemohon: 'John Doe' });

            const response = await request(app).get('/api/peminjaman/cnc/123');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.nama_pemohon).toBe('John Doe');
        });
    });

    describe('editDisetujui', () => {
        it('should return 400 if peminjaman is already rejected', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue({ _id: '123', status: 'Ditolak' });

            const response = await request(app).put('/api/peminjaman/approve/cnc/123');
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Peminjaman has already been rejected and cannot be approved.');
        });

        it('should approve the peminjaman if available', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue({ _id: '123', status: 'Menunggu', save: jest.fn() });
            jest.mock('../middleware/checkAvailability', () => ({
                checkAvailability: jest.fn().mockResolvedValue(true)
            }));

            const response = await request(app).put('/api/peminjaman/approve/cnc/123');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Peminjaman status updated to Disetujui.');
        });
    });

    describe('editDitolak', () => {
        it('should return 400 if rejection reason is not provided', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue({ _id: '123', status: 'Menunggu' });

            const response = await request(app)
                .put('/api/peminjaman/reject/cnc/123')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Reason for rejection is required.');
        });

        it('should reject the peminjaman if available', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findById.mockResolvedValue({ _id: '123', status: 'Menunggu', save: jest.fn() });

            const response = await request(app)
                .put('/api/peminjaman/reject/cnc/123')
                .send({ alasan: 'Not available' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Peminjaman status updated to Ditolak.');
        });
    });

    describe('deletePeminjamanById', () => {
        it('should delete peminjaman by id', async () => {
            User.findOne.mockResolvedValue({ _id: 'adminUserId', role: 'admin' });
            Cnc.findByIdAndDelete.mockResolvedValue({ _id: '123' });

            const response = await request(app).delete('/api/peminjaman/cnc/123');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Peminjaman deleted successfully.');
        });
    });

    describe('Admin Controller', () => {
        describe('getMonitoringData', () => {
            it('should return monitoring data for today and all approved peminjaman', async () => {
                // Mock data peminjaman yang disetujui
                Cnc.find.mockResolvedValue([
                    {
                        _id: '1',
                        nama_pemohon: 'User1',
                        status: 'Disetujui',
                        tanggal_peminjaman: new Date().toISOString(),
                        awal_peminjaman: '8:00 AM',
                        akhir_peminjaman: '5:00 PM'
                    }
                ]);
    
                // Mock data sensor untuk hari ini
                CncSensor.find.mockResolvedValue([
                    {
                        waktu: new Date(),
                        button: true
                    }
                ]);
    
                const response = await request(app).get('/api/monitoring/cnc');
    
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.userCountAll).toBeGreaterThanOrEqual(1);
            });
        });
    });
    
});
