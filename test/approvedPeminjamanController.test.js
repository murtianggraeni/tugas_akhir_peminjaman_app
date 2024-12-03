const { getApprovedPeminjaman, getApprovedPeminjamanByDate } = require('../controllers/approvedPeminjamanController');
const { Cnc, Laser, Printing } = require('../models/peminjamanModel');

describe('Approved Peminjaman Controllers', () => {
    let mockReq;
    let mockRes;
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup console spies
        global.console.error = jest.fn();
        global.console.log = jest.fn();
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockReq = {};

        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-10-22T10:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getApprovedPeminjaman', () => {
        it('should return all approved peminjaman with correct time format', async () => {
            const mockApprovedData = [
                {
                    _id: 'cnc1',
                    nama_mesin: 'Cnc Milling',
                    tanggal_peminjaman: new Date('2024-10-22'),
                    awal_peminjaman: '09:00',
                    akhir_peminjaman: '11:00',
                    nama_pemohon: 'John Doe'
                }
            ];

            // Mock database calls
            Cnc.find = jest.fn().mockResolvedValue(mockApprovedData);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjaman(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'cnc1',
                        nama_mesin: 'Cnc Milling',
                        tanggal_peminjaman: '2024-10-22', // Date only
                        awal_peminjaman: '09:00',
                        akhir_peminjaman: '11:00',
                        nama_pemohon: 'John Doe'
                    })
                ])
            });
        });

        it('should handle different time formats correctly', async () => {
            const mockApprovedData = [
                {
                    _id: 'cnc1',
                    nama_mesin: 'Cnc Milling',
                    tanggal_peminjaman: new Date('2024-10-22'),
                    awal_peminjaman: new Date('2024-10-22T09:00:00Z'),
                    akhir_peminjaman: new Date('2024-10-22T11:00:00Z'),
                    nama_pemohon: 'John Doe'
                },
                {
                    _id: 'cnc2',
                    nama_mesin: 'Cnc Milling',
                    tanggal_peminjaman: new Date('2024-10-22'),
                    awal_peminjaman: '09:00',
                    akhir_peminjaman: '11:00',
                    nama_pemohon: 'Jane Doe'
                }
            ];

            Cnc.find = jest.fn().mockResolvedValue(mockApprovedData);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjaman(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(2);
            expect(response.data[0].awal_peminjaman).toMatch(/^\d{2}:\d{2}$/);
            expect(response.data[1].awal_peminjaman).toMatch(/^\d{2}:\d{2}$/);
        });

        it('should handle invalid time format', async () => {
            const mockApprovedData = [
                {
                    _id: 'cnc1',
                    nama_mesin: 'Cnc Milling',
                    tanggal_peminjaman: new Date('2024-10-22'),
                    awal_peminjaman: undefined, // Invalid time format
                    akhir_peminjaman: '11:00',
                    nama_pemohon: 'John Doe'
                }
            ];

            // Setup mocks
            Cnc.find = jest.fn().mockResolvedValue(mockApprovedData);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjaman(mockReq, mockRes);

            // Verify that console.error was called with the correct message
            expect(console.error).toHaveBeenCalledWith(
                'Unexpected time format:',
                undefined
            );

            // Verify response contains Invalid Time
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data[0].awal_peminjaman).toBe('Invalid Time');
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            Cnc.find = jest.fn().mockRejectedValue(dbError);

            await getApprovedPeminjaman(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith(
                'Error in getApprovedPeminjaman:',
                dbError
            );
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Database connection failed'
            });
        });
    });

    describe('getApprovedPeminjamanByDate', () => {
        beforeEach(() => {
            mockReq = {
                params: { date: '2024-10-22' }
            };
        });

        it('should return approved peminjaman for specific date', async () => {
            const testDate = new Date('2024-10-22');
            const mockApprovedData = [
                {
                    _id: 'cnc1',
                    nama_mesin: 'Cnc Milling',
                    tanggal_peminjaman: testDate,
                    awal_peminjaman: '09:00',
                    akhir_peminjaman: '11:00',
                    nama_pemohon: 'John Doe'
                }
            ];

            Cnc.find = jest.fn().mockResolvedValue(mockApprovedData);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjamanByDate(mockReq, mockRes);

            expect(Cnc.find).toHaveBeenCalledWith({
                status: 'Disetujui',
                tanggal_peminjaman: {
                    $gte: expect.any(Date),
                    $lte: expect.any(Date)
                }
            });

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'cnc1',
                        nama_mesin: 'Cnc Milling',
                        nama_pemohon: 'John Doe'
                    })
                ])
            });
        });

        it('should handle valid date parameter', async () => {
            const testDate = new Date('2024-10-22');
            const mockApprovedData = [{
                _id: 'cnc1',
                nama_mesin: 'Cnc Milling',
                tanggal_peminjaman: testDate,
                awal_peminjaman: '09:00',
                akhir_peminjaman: '11:00',
                nama_pemohon: 'John Doe'
            }];

            Cnc.find = jest.fn().mockResolvedValue(mockApprovedData);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjamanByDate(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'cnc1',
                        nama_mesin: 'Cnc Milling',
                        nama_pemohon: 'John Doe'
                    })
                ])
            });
        });
        
        it('should handle empty results', async () => {
            Cnc.find = jest.fn().mockResolvedValue([]);
            Laser.find = jest.fn().mockResolvedValue([]);
            Printing.find = jest.fn().mockResolvedValue([]);

            await getApprovedPeminjamanByDate(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: []
            });
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            Cnc.find = jest.fn().mockRejectedValue(dbError);

            await getApprovedPeminjamanByDate(mockReq, mockRes);

            expect(console.error).toHaveBeenCalledWith(
                'Error in getApprovedPeminjamanByDate:',
                dbError
            );
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Database connection failed'
            });
        });
    });
});