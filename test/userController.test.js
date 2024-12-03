const {
  peminjamanHandler,
  getPeminjamanAllHandler,
  getPeminjamanByIdHandler,
  extendPeminjamanHandler,
  updateExpiredPeminjaman,
  checkPeminjamanStatus,
  upload
} = require('../controllers/userController');

const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const { checkAvailability } = require('../middleware/checkAvailability');
const { sendAdminNotification } = require('../controllers/notificationController');

// Mock all dependencies
jest.mock('../middleware/checkAvailability');
jest.mock('../models/peminjamanModel');
jest.mock('googleapis', () => ({
  google: {
    auth: {
      JWT: jest.fn().mockReturnValue({
        authorize: jest.fn().mockResolvedValue({})
      })
    },
    drive: jest.fn().mockReturnValue({
      files: {
        create: jest.fn().mockResolvedValue({ data: { id: 'test-file-id' } }),
        get: jest.fn().mockResolvedValue({ data: { webViewLink: 'https://drive.google.com/test' } })
      },
      permissions: {
        create: jest.fn().mockResolvedValue({})
      }
    })
  }
}));
jest.mock('multer');
jest.mock('../controllers/notificationController');
jest.mock('axios');

// Mock environment variables
process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj\n-----END PRIVATE KEY-----\n';
process.env.GOOGLE_DRIVE_FOLDER_ID = 'test-folder-id';

describe('User Controller Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      params: {},
      body: {},
      file: {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      },
      user: {
        userId: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com'
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock date for consistent testing
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2024-12-03'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('peminjamanHandler', () => {
    beforeEach(() => {
      mockReq.params.type = 'cnc';
      mockReq.body = {
        email: 'test@example.com',
        nama_pemohon: 'Test User',
        tipe_pengguna: 'Mahasiswa',
        nomor_identitas: '12345678',
        tanggal_peminjaman: '2024-12-03',
        awal_peminjaman: '10:00 AM',
        akhir_peminjaman: '11:00 AM',
        jumlah: 1,
        kategori: 'Praktek',
        detail_keperluan: 'Testing purpose',
        jurusan: 'Informatika',
        program_studi: 'S1'
      };

      checkAvailability.mockResolvedValue(true);
      sendAdminNotification.mockResolvedValue({ success: true });
    });

    test('should create peminjaman successfully', async () => {
      const mockPeminjamanEntry = {
        _id: 'test-id',
        nama_mesin: 'Cnc Milling',
        status: 'Menunggu',
        toObject: () => ({
          _id: 'test-id',
          nama_mesin: 'Cnc Milling',
          status: 'Menunggu'
        })
      };

      Cnc.create.mockResolvedValue(mockPeminjamanEntry);

      await peminjamanHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Uploaded!'
        })
      );
    });

    test('should validate email format', async () => {
      mockReq.body.email = 'invalid-email';
      
      await peminjamanHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Format email tidak valid'
        })
      );
    });

    test('should validate NIM format for Mahasiswa', async () => {
      mockReq.body.nomor_identitas = '123'; // Invalid NIM
      
      await peminjamanHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Format NIM tidak valid'
        })
      );
    });
  });

  describe('getPeminjamanAllHandler', () => {
    test('should return all peminjaman for user', async () => {
      const mockPeminjaman = [{
        _id: 'test-id',
        user: 'test-user-id',
        nama_mesin: 'Cnc Milling',
        status: 'Menunggu'
      }];

      Cnc.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPeminjaman)
      });

      await getPeminjamanAllHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    test('should handle no peminjaman found', async () => {
      Cnc.find.mockReturnValue([]);
      Laser.find.mockReturnValue([]);
      Printing.find.mockReturnValue([]);

      await getPeminjamanAllHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: []
        })
      );
    });
  });

  describe('getPeminjamanByIdHandler', () => {
    beforeEach(() => {
      mockReq.params.peminjamanId = 'test-peminjaman-id';
    });

    test('should return peminjaman details', async () => {
      const mockPeminjaman = {
        _id: 'test-peminjaman-id',
        nama_mesin: 'Cnc Milling',
        user: {
          _id: 'test-user-id',
          email: 'test@example.com'
        },
        status: 'Menunggu',
        populate: jest.fn().mockReturnThis()
      };

      Cnc.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPeminjaman)
      });

      await getPeminjamanByIdHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    test('should handle peminjaman not found', async () => {
      Cnc.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Laser.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Printing.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getPeminjamanByIdHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Data peminjaman tidak ditemukan'
        })
      );
    });
  });

  describe('extendPeminjamanHandler', () => {
    beforeEach(() => {
      mockReq.params.peminjamanId = 'test-peminjaman-id';
      mockReq.body = {
        type: 'cnc',
        newEndTime: '2024-12-03T12:00:00.000Z'
      };
    });

    test('should extend peminjaman successfully', async () => {
      const mockUpdatedPeminjaman = {
        _id: 'test-peminjaman-id',
        akhir_peminjaman: new Date('2024-12-03T12:00:00.000Z'),
        status: 'Disetujui'
      };

      Cnc.findOneAndUpdate.mockResolvedValue(mockUpdatedPeminjaman);

      await extendPeminjamanHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Peminjaman extended successfully'
        })
      );
    });

    test('should validate machine type', async () => {
      mockReq.body.type = 'invalid';

      await extendPeminjamanHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid or missing machine type'
        })
      );
    });
  });

  describe('updateExpiredPeminjaman', () => {
    test('should update expired peminjaman', async () => {
      const mockExpiredPeminjaman = [{
        _id: 'expired-1',
        status: 'Menunggu',
        save: jest.fn().mockResolvedValue(true)
      }];

      Cnc.find.mockResolvedValue(mockExpiredPeminjaman);
      Laser.find.mockResolvedValue([]);
      Printing.find.mockResolvedValue([]);

      const result = await updateExpiredPeminjaman();
      expect(result).toBe(true);
    });

    test('should handle errors gracefully', async () => {
      Cnc.find.mockRejectedValue(new Error('Database error'));

      const result = await updateExpiredPeminjaman();
      expect(result).toBe(false);
    });
  });

  describe('checkPeminjamanStatus', () => {
    test('should return status overview', async () => {
      const mockPeminjaman = [{
        _id: 'status-1',
        status: 'Menunggu',
        tanggal_peminjaman: '2024-12-02',
        awal_peminjaman: '09:00'
      }];

      Cnc.find.mockResolvedValue(mockPeminjaman);
      Laser.find.mockResolvedValue([]);
      Printing.find.mockResolvedValue([]);

      await checkPeminjamanStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cnc': expect.any(Object),
          'Laser': expect.any(Object),
          'Printing': expect.any(Object)
        })
      );
    });
  });
});
// // test/userController.test.js

// /**
//  * 1. SETUP DAN KONFIGURASI AWAL
//  */
// require("dotenv").config();

// // Mock semua dependencies yang dibutuhkan
// jest.mock("../middleware/checkAvailability");

// // Mock untuk model database dengan detail lengkap
// jest.mock("../models/peminjamanModel", () => ({
//   // CNC Model mock
//   Cnc: {
//     // Untuk membuat data baru
//     create: jest.fn(),
//     // Untuk mencari banyak data
//     find: jest.fn(),
//     // Chain method untuk findOne -> populate -> exec
//     findOne: jest.fn().mockReturnThis(),
//     populate: jest.fn().mockReturnThis(),
//     exec: jest.fn(),
//     countDocuments: jest.fn(),
//   },
//   // Laser Model mock (struktur sama dengan CNC)
//   Laser: {
//     find: jest.fn(),
//     findOne: jest.fn().mockReturnThis(),
//     populate: jest.fn().mockReturnThis(),
//     exec: jest.fn(),
//     countDocuments: jest.fn(),
//   },
//   // Printing Model mock (struktur sama dengan CNC)
//   Printing: {
//     find: jest.fn(),
//     findOne: jest.fn().mockReturnThis(),
//     populate: jest.fn().mockReturnThis(),
//     exec: jest.fn(),
//     countDocuments: jest.fn(),
//   },
// }));

// // Mock untuk uploadFileToDrive dan controller lainnya
// jest.mock("../controllers/userController", () => {
//   const actualController = jest.requireActual("../controllers/userController");
//   return {
//     ...actualController,
//     uploadFileToDrive: jest
//       .fn()
//       .mockResolvedValue("https://drive.google.com/file/mockFileId/view"),
//   };
// });

// // Import setelah semua mock dideklarasikan
// const {
//   peminjamanHandler,
//   getPeminjamanAllHandler,
//   getPeminjamanByIdHandler,
//   extendPeminjamanHandler,
//   updateExpiredPeminjaman, // Tambahkan import ini
//   checkPeminjamanStatus,
// } = require("../controllers/userController");
// const { Cnc, Laser, Printing } = require("../models/peminjamanModel");
// const { checkAvailability } = require("../middleware/checkAvailability");

// /**
//  * 2. TEST SUITE UTAMA
//  */

// describe("User Controller Tests", () => {
//   // Deklarasi variabel yang akan digunakan di semua test
//   let mockReq;
//   let mockRes;
//   let consoleSpy;

//   beforeAll(() => {
//     jest.useFakeTimers({ legacyFakeTimers: false });
//   });

//   afterAll(() => {
//     jest.useRealTimers();
//   });

//   beforeEach(() => {
//     jest.useFakeTimers({
//       legacyFakeTimers: false,
//     });

//     jest.clearAllMocks();

//     // Perbaikan 1: Setup console spy dengan benar
//     consoleSpy = {
//       log: jest.spyOn(console, "log").mockImplementation(),
//       error: jest.spyOn(console, "error").mockImplementation(),
//     };

//     mockRes = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: 200,
//     };
//   });

//   afterEach(() => {
//     // Perbaikan 2: Restore console spy
//     consoleSpy.log.mockRestore();
//     consoleSpy.error.mockRestore();
//   });

//   // Test untuk Google Drive private key replacement (line 16)
//   // describe("Google Drive Configuration", () => {
//   //   it("should properly replace newline characters in Google private key", () => {
//   //     const originalKey = "test\\nkey\\nhere";
//   //     process.env.GOOGLE_PRIVATE_KEY = originalKey;

//   //     // Re-require the module to test the configuration
//   //     jest.isolateModules(() => {
//   //       require("../controllers/userController");
//   //     });

//   //     expect(process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")).toBe(
//   //       "test\nkey\nhere"
//   //     );
//   //   });
//   // });

//   // it("should handle Google Drive upload error", async () => {
//   //   // Clear existing mocks
//   //   jest.clearAllMocks();

//   //   // Setup mock kebutuhan dasar
//   //   checkAvailability.mockResolvedValue(true);

//   //   // Mock upload file error
//   //   const uploadError = new Error("Failed to upload to Google Drive");
//   //   jest
//   //     .spyOn(require("../controllers/userController"), "uploadFileToDrive")
//   //     .mockRejectedValue(uploadError);

//   //   // Execute
//   //   await peminjamanHandler(mockReq, mockRes);

//   //   // Verify error is logged
//   //   expect(console.error).toHaveBeenCalledWith(
//   //     "Error uploading file to Google Drive:",
//   //     uploadError
//   //   );

//   //   // Verify error response
//   //   expect(mockRes.status).toHaveBeenCalledWith(500);
//   //   expect(mockRes.json).toHaveBeenCalledWith({
//   //     success: false,
//   //     message: "Error saat membuat peminjaman atau mengunggah file",
//   //     error: expect.any(String),
//   //   });
//   // });

//   // it("should rethrow Google Drive upload error", async () => {
//   //   // Clear existing mocks
//   //   jest.clearAllMocks();

//   //   // Setup mock kebutuhan dasar
//   //   checkAvailability.mockResolvedValue(true);

//   //   // Mock upload file error
//   //   const uploadError = new Error("Failed to upload to Google Drive");
//   //   jest
//   //     .spyOn(require("../controllers/userController"), "uploadFileToDrive")
//   //     .mockRejectedValue(uploadError);

//   //   // Execute and verify error is thrown
//   //   await expect(peminjamanHandler(mockReq, mockRes)).rejects.toThrow();

//   //   // Verify error is logged
//   //   expect(console.error).toHaveBeenCalledWith(
//   //     "Error uploading file to Google Drive:",
//   //     expect.any(Error)
//   //   );
//   // });

//   /**
//    * 3. TEST SUITE UNTUK PEMINJAMAN HANDLER
//    */
//   describe("peminjamanHandler", () => {
//     beforeEach(() => {
//       // Setup mock request dengan data lengkap
//       mockReq = {
//         params: { type: "cnc" },
//         body: {
//           email: "test@example.com",
//           nama_pemohon: "John Doe",
//           tanggal_peminjaman: "2024-10-22",
//           awal_peminjaman: "10:00 AM",
//           akhir_peminjaman: "12:00 PM",
//           jumlah: 1,
//           jurusan: "Engineering",
//           program_studi: "Teknik Mesin",
//           kategori: "Praktek",
//           detail_keperluan: "Testing",
//         },
//         username: { userId: "userId", userName: "John" },
//         file: {
//           buffer: Buffer.from("file content"),
//           originalname: "file.pdf",
//           mimetype: "application/pdf",
//         },
//       };
//     });

//     // Test Case 1: Berhasil membuat peminjaman
//     it("should successfully create new peminjaman", async () => {
//       // Setup mock returns
//       checkAvailability.mockResolvedValue(true);
//       const mockCreatedPeminjaman = {
//         _id: "mockId",
//         nama_mesin: "Cnc Milling",
//         status: "Menunggu",
//         isStarted: false,
//         waktu: new Date(),
//       };
//       Cnc.create.mockResolvedValue(mockCreatedPeminjaman);

//       // Eksekusi function yang ditest
//       await peminjamanHandler(mockReq, mockRes);

//       // Verifikasi hasil
//       expect(checkAvailability).toHaveBeenCalled();
//       expect(Cnc.create).toHaveBeenCalled();
//       expect(mockRes.status).toHaveBeenCalledWith(201);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: true,
//           message: "Uploaded!",
//         })
//       );
//     }, 10000);

//     // Test Case 2: Slot waktu tidak tersedia
//     it("should return 409 when time slot is not available", async () => {
//       checkAvailability.mockResolvedValue(false);

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(409);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Waktu yang dipilih tidak tersedia. Silakan pilih waktu lain.",
//       });
//     });

//     // Test Case 3: Jumlah invalid
//     it("should return 400 for invalid jumlah", async () => {
//       mockReq.body.jumlah = "invalid";

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         statusCode: mockRes.statusCode,
//         message: "Jumlah harus berupa bilangan bulat positif",
//       });
//     });

//     // Test Case 4: Detail keperluan kosong
//     it("should return 400 when detail_keperluan is missing for Praktek category", async () => {
//       mockReq.body.detail_keperluan = "";

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         statusCode: mockRes.statusCode,
//         message: "Detail keperluan wajib diisi",
//       });
//     });

//     it("should reject when end time is not greater than start time", async () => {
//       mockReq.body.awal_peminjaman = "10:00 AM";
//       mockReq.body.akhir_peminjaman = "09:00 AM";

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         statusCode: 400,
//         message: "Waktu akhir peminjaman harus lebih besar dari waktu awal",
//       });
//     });

//     describe("Time Validation", () => {
//       it("should return error when awal_peminjaman is missing", async () => {
//         mockReq.body.awal_peminjaman = null;

//         await peminjamanHandler(mockReq, mockRes);

//         expect(mockRes.status).toHaveBeenCalledWith(400);
//         expect(mockRes.json).toHaveBeenCalledWith({
//           success: false,
//           statusCode: 400,
//           message: "Waktu awal peminjaman harus diisi",
//         });
//       });

//       it("should return error when akhir_peminjaman is missing", async () => {
//         mockReq.body.akhir_peminjaman = null;

//         await peminjamanHandler(mockReq, mockRes);

//         expect(mockRes.status).toHaveBeenCalledWith(400);
//         expect(mockRes.json).toHaveBeenCalledWith({
//           success: false,
//           statusCode: 400,
//           message: "Waktu akhir peminjaman harus diisi",
//         });
//       });
//     });

//     // Test untuk file size limit
//     it("should handle file size limit exceeded", async () => {
//       const error = new Error("File too large");
//       error.code = "LIMIT_FILE_SIZE";
//       mockReq.file = undefined;
//       mockReq.error = error;

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Ukuran file melebihi batas maksimum (2MB)",
//       });
//     });

//     // Test Case: Invalid email format
//     it("should return 400 for invalid email format", async () => {
//       mockReq.body.email = "invalid-email-format";

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Format email tidak valid",
//       });
//     });

//     // 1. Ubah timeout dan perbaiki test peminjaman dengan minimum fields
//     it("should create peminjaman with minimum required fields", async () => {
//       const minimalMockReq = {
//         params: { type: "cnc" },
//         body: {
//           email: "mahasiswa@example.com",
//           nama_pemohon: "Budi Santoso",
//           tanggal_peminjaman: "2024-10-22",
//           awal_peminjaman: "10:00 AM",
//           akhir_peminjaman: "12:00 PM",
//           jumlah: 1,
//           program_studi: "D3 Teknik Mesin",
//           kategori: "Lainnya",
//         },
//         username: { userId: "userId123", userName: "Budi" },
//         file: {
//           buffer: Buffer.from("surat peminjaman"),
//           originalname: "surat_peminjaman.pdf",
//           mimetype: "application/pdf",
//         },
//       };

//       const mockCreatedPeminjaman = {
//         _id: "peminjamanId123",
//         ...minimalMockReq.body,
//         nama_mesin: "Cnc Milling",
//         status: "Menunggu",
//         isStarted: false,
//       };

//       // Setup mocks
//       checkAvailability.mockResolvedValue(true);
//       Cnc.create.mockResolvedValue(mockCreatedPeminjaman);
//       jest
//         .spyOn(require("../controllers/userController"), "uploadFileToDrive")
//         .mockResolvedValue("https://drive.google.com/mockfile");

//       // Execute
//       await peminjamanHandler(minimalMockReq, mockRes);

//       // Verify
//       expect(mockRes.status).toHaveBeenCalledWith(201);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: true,
//           message: "Uploaded!",
//         })
//       );
//     }, 10000);

//     // 2. Perbaiki database error handling test
//     it("should handle database errors", async () => {
//       jest.clearAllMocks();

//       const dbError = new Error("Database error");
//       Cnc.create.mockRejectedValue(dbError);
//       checkAvailability.mockResolvedValue(true);

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(500);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: false,
//           message: "Error saat membuat peminjaman atau mengunggah file",
//           error: expect.any(String),
//         })
//       );
//     }, 15000);

//     // 3. Perbaiki specific status update test
//     it("should only update peminjaman with specific status", async () => {
//       jest.clearAllMocks();

//       const mockPeminjaman1 = {
//         _id: "mock1",
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };

//       Cnc.modelName = "Cnc";
//       Cnc.find.mockResolvedValue([mockPeminjaman1]);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await updateExpiredPeminjaman();

//       expect(mockPeminjaman1.save).toHaveBeenCalledTimes(1);
//     }, 15000);

//     // 4. Perbaiki date comparison test
//     it("should correctly compare dates for expiration", async () => {
//       const pastDate = new Date("2024-10-20T08:00:00Z");
//       const futureDate = new Date("2024-10-23T08:00:00Z");

//       const mockPeminjaman1 = {
//         _id: "mock1",
//         status: "Menunggu",
//         tanggal_peminjaman: pastDate,
//         awal_peminjaman: pastDate,
//         save: jest.fn().mockResolvedValue(true),
//       };

//       Cnc.modelName = "Cnc";
//       Cnc.find.mockResolvedValueOnce([mockPeminjaman1]);
//       Laser.find.mockResolvedValueOnce([]);
//       Printing.find.mockResolvedValueOnce([]);

//       await updateExpiredPeminjaman();

//       expect(mockPeminjaman1.save).toHaveBeenCalledTimes(1);
//     }, 15000);

//     // 5. Perbaiki invalid time format test
//     it("should handle invalid time formats", async () => {
//       const invalidTime = "invalid-time";
//       mockReq.body = {
//         ...mockReq.body,
//         awal_peminjaman: invalidTime,
//         akhir_peminjaman: invalidTime,
//       };

//       // Mock implementation yang sesuai dengan controller
//       console.error = jest.fn();
//       checkAvailability.mockResolvedValue(true);

//       await peminjamanHandler(mockReq, mockRes);

//       // Verifikasi response sesuai dengan implementasi controller
//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         statusCode: 400,
//         message: expect.any(String),
//       });
//     });

//     it("should return 400 for invalid machine name", async () => {
//       mockReq.params.type = "invalid-machine";

//       await peminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Invalid machine name",
//       });
//     });
//   });

//   // describe("ESP32 URL Configuration", () => {
//   //   beforeEach(() => {
//   //     // Reset semua mock sebelum setiap test
//   //     jest.clearAllMocks();

//   //     mockReq = {
//   //       params: { type: "cnc" },
//   //       body: {
//   //         email: "test@example.com",
//   //         nama_pemohon: "John Doe",
//   //         tanggal_peminjaman: "2024-10-22",
//   //         awal_peminjaman: "10:00 AM",
//   //         akhir_peminjaman: "12:00 PM",
//   //         jumlah: 1,
//   //         kategori: "Praktek",
//   //         detail_keperluan: "Testing",
//   //       },
//   //       username: { userId: "userId", userName: "John" },
//   //       file: {
//   //         buffer: Buffer.from("file content"),
//   //         originalname: "file.pdf",
//   //         mimetype: "application/pdf",
//   //       },
//   //     };

//   //     checkAvailability.mockResolvedValue(true);
//   //     jest
//   //       .spyOn(require("../controllers/userController"), "uploadFileToDrive")
//   //       .mockResolvedValue("https://drive.google.com/mockfile");
//   //   });

//   //   it("should set correct ESP URL for CNC Milling", async () => {
//   //     const expectedUrl =
//   //       "https://kh8ppwzx-5000.asse.devtunnels.ms/sensor/cnc/buttonPeminjaman";

//   //     await peminjamanHandler(mockReq, mockRes);

//   //     expect(Cnc.create).toHaveBeenCalledWith(
//   //       expect.objectContaining({
//   //         nama_mesin: "Cnc Milling",
//   //         alamat_esp: expectedUrl,
//   //       })
//   //     );
//   //   });

//   //   it("should set correct ESP URL for Laser Cutting", async () => {
//   //     mockReq.params.type = "laser";
//   //     const expectedUrl =
//   //       "https://kh8ppwzx-5000.asse.devtunnels.ms/sensor/laser/buttonPeminjaman";

//   //     await peminjamanHandler(mockReq, mockRes);

//   //     expect(Laser.create).toHaveBeenCalledWith(
//   //       expect.objectContaining({
//   //         nama_mesin: "Laser Cutting",
//   //         alamat_esp: expectedUrl,
//   //       })
//   //     );
//   //   });

//   //   it("should set correct ESP URL for 3D Printing", async () => {
//   //     mockReq.params.type = "printing";
//   //     const expectedUrl =
//   //       "https://kh8ppwzx-5000.asse.devtunnels.ms/sensor/printing/buttonPeminjaman";

//   //     await peminjamanHandler(mockReq, mockRes);

//   //     expect(Printing.create).toHaveBeenCalledWith(
//   //       expect.objectContaining({
//   //         nama_mesin: "3D Printing",
//   //         alamat_esp: expectedUrl,
//   //       })
//   //     );
//   //   });

//   //   it("should return error for invalid machine name", async () => {
//   //     mockReq.params.type = "invalid";

//   //     await peminjamanHandler(mockReq, mockRes);

//   //     expect(mockRes.status).toHaveBeenCalledWith(400);
//   //     expect(mockRes.json).toHaveBeenCalledWith({
//   //       message: "Invalid machine name",
//   //     });
//   //   });
//   // });

//   /**
//    * 4. TEST SUITE UNTUK GET ALL PEMINJAMAN
//    */
//   describe("getPeminjamanAllHandler", () => {
//     beforeEach(() => {
//       mockReq = {
//         username: { userId: "userId" },
//       };
//     });

//     // Test Case 1: Berhasil mendapatkan semua peminjaman
//     it("should return all peminjaman for user", async () => {
//       const mockPeminjaman = [
//         {
//           _id: "mockId1",
//           nama_pemohon: "John Doe",
//           nama_mesin: "Cnc Milling",
//           status: "Menunggu",
//         },
//       ];

//       // Setup mock untuk ketiga model
//       Cnc.find.mockResolvedValue(mockPeminjaman);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await getPeminjamanAllHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(200);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: true,
//           data: expect.any(Array),
//         })
//       );
//     });

//     // Test Case 2: Tidak ada data
//     it("should return 404 when no peminjaman found", async () => {
//       Cnc.find.mockResolvedValue([]);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await getPeminjamanAllHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(404);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Data tidak ditemukan",
//       });
//     });

//     it("should handle database error in getPeminjamanAllHandler", async () => {
//       mockReq = {
//         username: { userId: "testUserId" },
//       };

//       const dbError = new Error("Database connection failed");
//       Cnc.find.mockRejectedValue(dbError);

//       await getPeminjamanAllHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(500);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         error: "Database connection failed",
//       });
//     });

//     // Test untuk sorting logic
//     it("should correctly sort peminjaman by status", async () => {
//       mockReq = {
//         username: { userId: "testUserId" },
//       };

//       const mockData = [
//         { _id: "1", status: "Ditolak", nama_pemohon: "User1" },
//         { _id: "2", status: "Menunggu", nama_pemohon: "User2" },
//         { _id: "3", status: "Disetujui", nama_pemohon: "User3" },
//       ];

//       Cnc.find.mockResolvedValue(mockData);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await getPeminjamanAllHandler(mockReq, mockRes);

//       const responseData = mockRes.json.mock.calls[0][0].data;
//       expect(responseData[0].status).toBe("Menunggu");
//     });
//   });

//   /**
//    * 5. TEST SUITE UNTUK GET PEMINJAMAN BY ID
//    */
//   describe("getPeminjamanByIdHandler", () => {
//     beforeEach(() => {
//       mockReq = {
//         params: { peminjamanId: "mockId" },
//         username: { userId: "userId" },
//       };
//     });

//     // Test Case 1: Invalid ObjectId
//     it("should return 404 for invalid ObjectId", async () => {
//       mockReq.params.peminjamanId = "invalid-id";

//       const castError = new Error("Cast to ObjectId failed");
//       castError.name = "CastError";
//       castError.kind = "ObjectId";

//       Cnc.findOne.mockImplementation(() => {
//         throw castError;
//       });

//       await getPeminjamanByIdHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(404);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Data tidak ditemukan",
//       });
//     });

//     // Test Case 2: Berhasil mendapatkan detail
//     it("should return peminjaman details if found", async () => {
//       const mockPeminjaman = {
//         _id: "mockId",
//         nama_mesin: "Cnc Milling",
//         user: { email: "test@example.com" },
//       };

//       Cnc.findOne.mockReturnThis();
//       Cnc.populate.mockReturnThis();
//       Cnc.exec.mockResolvedValue(mockPeminjaman);

//       await getPeminjamanByIdHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(200);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: true,
//           data: expect.any(Object),
//         })
//       );
//     });

//     // Test Case 3: Data tidak ditemukan
//     it("should return 404 if peminjaman not found", async () => {
//       Cnc.exec.mockResolvedValue(null);
//       Laser.exec.mockResolvedValue(null);
//       Printing.exec.mockResolvedValue(null);

//       await getPeminjamanByIdHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(404);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Data tidak ditemukan",
//       });
//     });

//     it("should handle case when peminjaman not found", async () => {
//       mockReq = {
//         params: { peminjamanId: "nonexistent-id" },
//         username: { userId: "userId" },
//       };

//       Cnc.findOne.mockReturnThis();
//       Cnc.populate.mockReturnThis();
//       Cnc.exec.mockResolvedValue(null);
//       Laser.findOne.mockReturnThis();
//       Laser.populate.mockReturnThis();
//       Laser.exec.mockResolvedValue(null);
//       Printing.findOne.mockReturnThis();
//       Printing.populate.mockReturnThis();
//       Printing.exec.mockResolvedValue(null);

//       await getPeminjamanByIdHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(404);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Data tidak ditemukan",
//       });
//     });
//   });

//   /**
//    * 6. TEST SUITE UNTUK EXTEND PEMINJAMAN
//    */
//   describe("extendPeminjamanHandler", () => {
//     beforeEach(() => {
//       // Set waktu tetap untuk konsistensi test
//       jest.useFakeTimers();
//       jest.setSystemTime(new Date("2024-10-22T10:00:00Z"));

//       mockReq = {
//         params: { peminjamanId: "mockId" },
//         body: { newEndTime: "2024-10-23T12:00:00Z" },
//         username: { userId: "userId" },
//       };
//     });

//     afterEach(() => {
//       jest.useRealTimers();
//     });

//     // Test Case 1: Berhasil extend
//     it("should successfully extend peminjaman", async () => {
//       const mockPeminjaman = {
//         _id: "mockId",
//         status: "Disetujui",
//         isStarted: true,
//         extended_count: 0,
//         akhir_peminjaman: new Date("2024-10-22T12:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };

//       Cnc.findOne.mockResolvedValue(mockPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(200);
//       expect(mockRes.json).toHaveBeenCalledWith(
//         expect.objectContaining({
//           success: true,
//           message: "Waktu peminjaman berhasil diperpanjang",
//         })
//       );
//       expect(mockPeminjaman.save).toHaveBeenCalled();
//     });

//     it("should check Laser model if Cnc not found", async () => {
//       mockReq = {
//         params: { peminjamanId: "testId" },
//         body: { newEndTime: "2024-10-23T12:00:00Z" },
//         username: { userId: "testUserId" },
//       };

//       Cnc.findOne.mockResolvedValue(null);
//       const mockLaserPeminjaman = {
//         _id: "testId",
//         status: "Disetujui",
//         isStarted: true,
//         extended_count: 0,
//         akhir_peminjaman: new Date("2024-10-22T12:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };
//       Laser.findOne.mockResolvedValue(mockLaserPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(Laser.findOne).toHaveBeenCalled();
//       expect(mockRes.status).toHaveBeenCalledWith(200);
//     });

//     it("should check Printing model if Laser not found", async () => {
//       mockReq = {
//         params: { peminjamanId: "testId" },
//         body: { newEndTime: "2024-10-23T12:00:00Z" },
//         username: { userId: "testUserId" },
//       };

//       Cnc.findOne.mockResolvedValue(null);
//       Laser.findOne.mockResolvedValue(null);
//       const mockPrintingPeminjaman = {
//         _id: "testId",
//         status: "Disetujui",
//         isStarted: true,
//         extended_count: 0,
//         akhir_peminjaman: new Date("2024-10-22T12:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };
//       Printing.findOne.mockResolvedValue(mockPrintingPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(Printing.findOne).toHaveBeenCalled();
//       expect(mockRes.status).toHaveBeenCalledWith(200);
//     });

//     // Test Case 2: Peminjaman belum dimulai
//     it("should return 400 if peminjaman is not started", async () => {
//       const mockPeminjaman = {
//         _id: "mockId",
//         status: "Disetujui",
//         isStarted: false,
//         extended_count: 0,
//         save: jest.fn(),
//       };

//       Cnc.findOne.mockResolvedValue(mockPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Peminjaman belum disetujui atau belum dimulai.",
//       });
//     });

//     // Test Case 3: Batas perpanjangan tercapai
//     it("should return 400 if extension limit is reached", async () => {
//       const mockPeminjaman = {
//         _id: "mockId",
//         status: "Disetujui",
//         isStarted: true,
//         extended_count: 2,
//         akhir_peminjaman: new Date("2024-10-22T12:00:00Z"),
//         save: jest.fn(),
//       };

//       Cnc.findOne.mockResolvedValue(mockPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Batas perpanjangan sudah tercapai",
//       });
//     });

//     // Test Case 4: Peminjaman sudah berakhir
//     it("should return 400 if peminjaman has ended", async () => {
//       const mockPeminjaman = {
//         _id: "mockId",
//         status: "Disetujui",
//         isStarted: true,
//         extended_count: 0,
//         akhir_peminjaman: new Date("2024-10-20T12:00:00Z"),
//         save: jest.fn(),
//       };

//       Cnc.findOne.mockResolvedValue(mockPeminjaman);

//       await extendPeminjamanHandler(mockReq, mockRes);

//       expect(mockRes.status).toHaveBeenCalledWith(400);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         message: "Peminjaman sudah berakhir",
//       });
//     });
//   });

//   describe("updateExpiredPeminjaman", () => {
//     beforeEach(() => {
//       jest.clearAllMocks();
//       // Set fixed date for testing
//       jest.setSystemTime(new Date("2024-10-22T10:00:00Z"));

//       // Mock console methods
//       global.console.log = jest.fn();
//       global.console.error = jest.fn();

//       // Set model names
//       Cnc.modelName = "Cnc";
//       Laser.modelName = "Laser";
//       Printing.modelName = "Printing";
//     });

//     afterEach(() => {
//       jest.useRealTimers();
//     });

//     it("should successfully update expired peminjaman", async () => {
//       // Create mock data with save method
//       const mockPeminjaman = {
//         _id: "mock1",
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };

//       // Setup mock implementations
//       Cnc.find = jest.fn().mockResolvedValue([mockPeminjaman]);
//       Laser.find = jest.fn().mockResolvedValue([]);
//       Printing.find = jest.fn().mockResolvedValue([]);

//       // Execute function
//       const result = await updateExpiredPeminjaman();

//       // Verify result
//       expect(result).toBe(true);
//       expect(mockPeminjaman.save).toHaveBeenCalled();
//       expect(mockPeminjaman.status).toBe("Ditolak");
//       expect(mockPeminjaman.alasan).toBe(
//         "Peminjaman otomatis ditolak karena melebihi batas awal peminjaman."
//       );
//       expect(console.log).toHaveBeenCalledWith(
//         "1 peminjaman diperbarui karena kedaluwarsa."
//       );
//     });

//     it("should handle save errors gracefully", async () => {
//       // Mock data with failing save
//       const mockPeminjaman = {
//         _id: "mock1",
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockRejectedValue(new Error("Save failed")),
//       };

//       // Setup mock implementations
//       // Pastikan hanya ada satu peminjaman yang akan di-save dan menghasilkan error
//       Cnc.find.mockResolvedValue([mockPeminjaman]);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       // Execute function
//       const result = await updateExpiredPeminjaman();

//       // Verify error dipanggil
//       expect(result).toBe(false); // Karena ada error saat save
//       expect(console.error).toHaveBeenCalledWith(
//         "Error saving peminjaman:",
//         expect.any(Error)
//       );

//       // Verify bahwa tidak ada peminjaman yang berhasil diupdate
//       expect(mockPeminjaman.save).toHaveBeenCalled();
//       expect(console.log).not.toHaveBeenCalled(); // Karena fungsi return false sebelum console.log
//     });

//     it("should handle database query errors", async () => {
//       // Mock database error
//       const dbError = new Error("Database query failed");
//       Cnc.find = jest.fn().mockRejectedValue(dbError);
//       Laser.find = jest.fn().mockResolvedValue([]);
//       Printing.find = jest.fn().mockResolvedValue([]);

//       // Execute function
//       const result = await updateExpiredPeminjaman();

//       // Verify error handling
//       expect(result).toBe(false);
//       expect(console.error).toHaveBeenCalledWith(
//         "Error processing Cnc:",
//         expect.any(Error)
//       );
//       expect(console.log).toHaveBeenCalledWith(
//         "0 peminjaman diperbarui karena kedaluwarsa."
//       );
//     });

//     it("should update multiple peminjaman across different models", async () => {
//       // Create mock data for different models
//       const mockCncPeminjaman = {
//         _id: "cnc1",
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };

//       const mockLaserPeminjaman = {
//         _id: "laser1",
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockResolvedValue(true),
//       };

//       // Setup mock implementations
//       Cnc.find = jest.fn().mockResolvedValue([mockCncPeminjaman]);
//       Laser.find = jest.fn().mockResolvedValue([mockLaserPeminjaman]);
//       Printing.find = jest.fn().mockResolvedValue([]);

//       // Execute function
//       const result = await updateExpiredPeminjaman();

//       // Verify results
//       expect(result).toBe(true);
//       expect(mockCncPeminjaman.save).toHaveBeenCalled();
//       expect(mockLaserPeminjaman.save).toHaveBeenCalled();
//       expect(console.log).toHaveBeenCalledWith(
//         "2 peminjaman diperbarui karena kedaluwarsa."
//       );
//     });

//     it("should return false if a model query fails", async () => {
//       Cnc.find.mockRejectedValue(new Error("Database query failed"));
//       await updateExpiredPeminjaman();
//       expect(console.error).toHaveBeenCalledWith(
//         "Error processing Cnc:",
//         expect.any(Error)
//       );
//     });

//     it("should handle individual peminjaman save errors", async () => {
//       const mockPeminjaman = {
//         status: "Menunggu",
//         tanggal_peminjaman: new Date("2024-10-20"),
//         awal_peminjaman: new Date("2024-10-20T08:00:00Z"),
//         save: jest.fn().mockRejectedValue(new Error("Save failed")),
//       };

//       Cnc.find.mockResolvedValue([mockPeminjaman]);

//       const result = await updateExpiredPeminjaman();

//       expect(result).toBe(false);
//       expect(console.error).toHaveBeenCalledWith(
//         "Error saving peminjaman:",
//         expect.any(Error)
//       );
//     });
//   });

//   describe("checkPeminjamanStatus", () => {
//     let mockReq;
//     let mockRes;
//     // let originalConsoleError;
//     let mockConsoleError;

//     beforeEach(() => {
//       jest.clearAllMocks();

//       // Setup mock console.error
//       mockConsoleError = jest.fn();
//       global.console.error = mockConsoleError;

//       mockReq = {};
//       mockRes = {
//         json: jest.fn(),
//         status: jest.fn().mockReturnThis(),
//       };

//       jest.useFakeTimers();
//       jest.setSystemTime(new Date("2024-10-22T10:00:00Z"));

//       // Set model names
//       Cnc.modelName = "Cnc";
//       Laser.modelName = "Laser";
//       Printing.modelName = "Printing";

//       // Reset all model mocks
//       jest.clearAllMocks();
//       Cnc.find.mockReset();
//       Laser.find.mockReset();
//       Printing.find.mockReset();
//     });

//     afterEach(() => {
//       // Kembalikan console.error ke fungsi aslinya
//       // console.error = originalConsoleError;
//       jest.useRealTimers();
//     });

//     it("should handle invalid time formats", async () => {
//       const mockPeminjamans = [
//         {
//           _id: "invalidId",
//           status: "Menunggu",
//           tanggal_peminjaman: "2024-10-20",
//           awal_peminjaman: "invalid-time",
//           nama_pemohon: "Test Invalid",
//         },
//       ];

//       // Setup mocks untuk return data
//       Cnc.find.mockResolvedValue(mockPeminjamans);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       // Execute function
//       await checkPeminjamanStatus(mockReq, mockRes);

//       // Verifikasi apakah console.error dipanggil dengan argumen yang benar
//       expect(mockConsoleError).toHaveBeenCalledWith(
//         "Invalid awal_peminjaman format for peminjaman invalidId:",
//         "invalid-time"
//       );

//       // Verifikasi struktur response
//       const response = mockRes.json.mock.calls[0][0];
//       expect(response.Cnc).toBeDefined();
//       expect(response.Cnc.details[0]).toEqual(
//         expect.objectContaining({
//           id: "invalidId",
//           status: "Menunggu",
//           isExpired: false,
//         })
//       );
//     });

//     it("should handle database errors gracefully", async () => {
//       // Mock implementations
//       Cnc.find = jest.fn().mockRejectedValue("Database error");
//       Laser.find = jest.fn().mockResolvedValue([]);
//       Printing.find = jest.fn().mockResolvedValue([]);

//       // Execute function
//       await checkPeminjamanStatus(mockReq, mockRes);

//       // Verify the response structure
//       const response = mockRes.json.mock.calls[0][0];

//       // Check that other models are still returned correctly
//       expect(response).toHaveProperty("Laser");
//       expect(response).toHaveProperty("Printing");
//       expect(response).not.toHaveProperty("Cnc");

//       // Verify the structure of successful models
//       expect(response.Laser).toEqual({
//         total: 0,
//         statusCounts: {
//           Menunggu: 0,
//           Disetujui: 0,
//           Ditolak: 0,
//           Diproses: 0,
//           Other: 0,
//         },
//         expired: 0,
//         needsUpdate: 0,
//         details: [],
//       });
//     });

//     it("should handle different time formats correctly", async () => {
//       const mockPeminjamans = [
//         {
//           _id: "id1",
//           status: "Menunggu",
//           tanggal_peminjaman: "2024-10-20",
//           awal_peminjaman: "2024-10-20T09:00:00.000Z", // ISO format
//           nama_pemohon: "Test 1",
//         },
//         {
//           _id: "id2",
//           status: "Disetujui",
//           tanggal_peminjaman: "2024-10-20",
//           awal_peminjaman: "09:00", // HH:mm format
//           nama_pemohon: "Test 2",
//         },
//         {
//           _id: "id3",
//           status: "Ditolak",
//           tanggal_peminjaman: "2024-10-23",
//           awal_peminjaman: new Date("2024-10-23T09:00:00Z"), // Date object
//           nama_pemohon: "Test 3",
//         },
//       ];

//       Cnc.find.mockResolvedValue(mockPeminjamans);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await checkPeminjamanStatus(mockReq, mockRes);

//       const response = mockRes.json.mock.calls[0][0];

//       // Verifikasi status counts
//       expect(response.Cnc.total).toBe(3);
//       expect(response.Cnc.statusCounts).toEqual({
//         Menunggu: 1,
//         Disetujui: 1,
//         Ditolak: 1,
//         Diproses: 0,
//         Other: 0,
//       });
//       expect(response.Cnc.details).toHaveLength(3);
//     });

//     it("should correctly identify expired peminjaman", async () => {
//       const now = new Date("2024-10-22T10:00:00Z");
//       jest.setSystemTime(now);

//       const mockPeminjamans = [
//         {
//           _id: "past1",
//           status: "Menunggu",
//           tanggal_peminjaman: "2024-10-20",
//           awal_peminjaman: "2024-10-20T08:00:00Z",
//           nama_pemohon: "Past User",
//         },
//         {
//           _id: "future1",
//           status: "Menunggu",
//           tanggal_peminjaman: "2024-10-23",
//           awal_peminjaman: "2024-10-23T08:00:00Z",
//           nama_pemohon: "Future User",
//         },
//       ];

//       Cnc.find.mockResolvedValue(mockPeminjamans);
//       Laser.find.mockResolvedValue([]);
//       Printing.find.mockResolvedValue([]);

//       await checkPeminjamanStatus(mockReq, mockRes);

//       const response = mockRes.json.mock.calls[0][0];

//       // Verifikasi expired status
//       expect(response.Cnc.details[0].isExpired).toBe(true);
//       expect(response.Cnc.details[1].isExpired).toBe(false);
//       expect(response.Cnc.expired).toBe(1);
//       expect(response.Cnc.needsUpdate).toBe(1);
//     });

//     it("should log error and mark invalid time formats as not expired", async () => {
//       const mockPeminjamans = [
//         {
//           _id: "invalidId",
//           status: "Menunggu",
//           tanggal_peminjaman: "2024-10-20",
//           awal_peminjaman: "invalid-time",
//         },
//       ];
//       Cnc.find.mockResolvedValue(mockPeminjamans);

//       await checkPeminjamanStatus(mockReq, mockRes);

//       expect(console.error).toHaveBeenCalledWith(
//         "Invalid awal_peminjaman format for peminjaman invalidId:",
//         "invalid-time"
//       );
//     });

//     // it("should handle null date", () => {
//     //   expect(formatDate(null)).toBeNull();
//     // });

//     // it("should handle Date instance", () => {
//     //   const date = new Date("2024-10-22");
//     //   expect(formatDate(date)).toBe("2024-10-22");
//     // });

//     // it("should handle string date", () => {
//     //   expect(formatDate("2024-10-22")).toBe("2024-10-22");
//     // });

//     // it("should handle invalid date", () => {
//     //   expect(formatDate("invalid-date")).toBe("invalid-date");
//     // });

//     it("should handle errors in processing individual model data", async () => {
//       Cnc.find.mockRejectedValue(new Error("Database error"));

//       await checkPeminjamanStatus(mockReq, mockRes);

//       expect(console.error).toHaveBeenCalledWith(
//         "Error processing Cnc:",
//         expect.any(Error)
//       );
//       expect(mockRes.json).toHaveBeenCalled();
//     });

//     it("should handle invalid awal_peminjaman formats", async () => {
//       const mockPeminjaman = [
//         {
//           _id: "testId",
//           tanggal_peminjaman: "2024-10-22",
//           awal_peminjaman: {},
//           status: "Menunggu",
//         },
//       ];

//       Cnc.find.mockResolvedValue(mockPeminjaman);

//       await checkPeminjamanStatus(mockReq, mockRes);

//       expect(console.error).toHaveBeenCalledWith(
//         expect.stringContaining("Invalid awal_peminjaman format"),
//         expect.anything()
//       );
//     });
//   });


// ------------------------------------------------------------------------------------------------------//


  // describe('checkPeminjamanStatus', () => {
  //     let mockReq;
  //     let mockRes;
  //     let originalConsoleError;

  //     beforeEach(() => {
  //         jest.clearAllMocks();

  //         // Simpan console.error asli
  //         originalConsoleError = console.error;

  //         mockReq = {};
  //         mockRes = {
  //             json: jest.fn(),
  //             status: jest.fn().mockReturnThis()
  //         };

  //         // Set fixed date for testing
  //         jest.useFakeTimers();
  //         jest.setSystemTime(new Date('2024-10-22T10:00:00Z'));

  //         // Set model names
  //         Cnc.modelName = 'Cnc';
  //         Laser.modelName = 'Laser';
  //         Printing.modelName = 'Printing';
  //     });

  //     afterEach(() => {
  //         // Kembalikan console.error asli
  //         console.error = originalConsoleError;
  //         jest.useRealTimers();
  //     });

  //     it('should handle different time formats correctly', async () => {
  //         const mockPeminjamans = [
  //             {
  //                 _id: 'id1',
  //                 status: 'Menunggu',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '2024-10-20T09:00:00.000Z', // ISO format
  //                 nama_pemohon: 'Test 1'
  //             },
  //             {
  //                 _id: 'id2',
  //                 status: 'Disetujui',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '09:00', // HH:mm format
  //                 nama_pemohon: 'Test 2'
  //             },
  //             {
  //                 _id: 'id3',
  //                 status: 'Ditolak',
  //                 tanggal_peminjaman: '2024-10-23',
  //                 awal_peminjaman: new Date('2024-10-23T09:00:00Z'), // Date object
  //                 nama_pemohon: 'Test 3'
  //             }
  //         ];

  //         Cnc.find.mockResolvedValue(mockPeminjamans);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         const response = mockRes.json.mock.calls[0][0];

  //         // Verify Cnc results
  //         expect(response.Cnc).toEqual({
  //             total: 3,
  //             statusCounts: {
  //                 Menunggu: 1,
  //                 Disetujui: 1,
  //                 Ditolak: 1,
  //                 Diproses: 0,
  //                 Other: 0
  //             },
  //             expired: 2, // First two should be expired based on our fixed date
  //             needsUpdate: 1, // Only the 'Menunggu' status needs update
  //             details: expect.arrayContaining([
  //                 expect.objectContaining({
  //                     id: 'id1',
  //                     status: 'Menunggu',
  //                     isExpired: true,
  //                     needsUpdate: true
  //                 }),
  //                 expect.objectContaining({
  //                     id: 'id2',
  //                     status: 'Disetujui',
  //                     isExpired: true,
  //                     needsUpdate: false
  //                 }),
  //                 expect.objectContaining({
  //                     id: 'id3',
  //                     status: 'Ditolak',
  //                     isExpired: false,
  //                     needsUpdate: false
  //                 })
  //             ])
  //         });
  //     });

  //     it('should handle invalid time formats', async () => {
  //         // Mock console.error sebelum penggunaan
  //         const mockConsoleError = jest.fn();
  //         console.error = mockConsoleError;

  //         const mockPeminjamans = [{
  //             _id: 'invalidId',
  //             status: 'Menunggu',
  //             tanggal_peminjaman: '2024-10-20',
  //             awal_peminjaman: 'invalid-time',
  //             nama_pemohon: 'Test Invalid'
  //         }];

  //         Cnc.find.mockResolvedValue(mockPeminjamans);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         // Verify error logging
  //         expect(mockConsoleError).toHaveBeenCalledWith(
  //             expect.stringContaining('Invalid'),
  //             'invalid-time'
  //         );

  //         const response = mockRes.json.mock.calls[0][0];
  //         expect(response.Cnc).toBeDefined();
  //         expect(response.Cnc.details[0]).toEqual(
  //             expect.objectContaining({
  //                 id: 'invalidId',
  //                 status: 'Menunggu',
  //                 isExpired: false
  //             })
  //         );
  //     });

  //     it('should handle different time formats correctly', async () => {
  //         const mockPeminjamans = [
  //             {
  //                 _id: 'mock1',
  //                 status: 'Menunggu',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '2024-10-20T09:00:00Z' // ISO format
  //             },
  //             {
  //                 _id: 'mock2',
  //                 status: 'Menunggu',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '09:00 AM' // 12-hour format
  //             },
  //             {
  //                 _id: 'mock3',
  //                 status: 'Disetujui',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '14:00' // 24-hour format
  //             }
  //         ];

  //         Cnc.find.mockResolvedValue(mockPeminjamans);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         const response = mockRes.json.mock.calls[0][0];

  //         // Verify response structure
  //         expect(response).toHaveProperty('Cnc');
  //         expect(response.Cnc).toHaveProperty('total', 3);
  //         expect(response.Cnc.statusCounts).toEqual({
  //             Menunggu: 2,
  //             Disetujui: 1,
  //             Ditolak: 0,
  //             Diproses: 0,
  //             Other: 0
  //         });
  //         expect(response.Cnc.details).toHaveLength(3);
  //     });

  //     it('should handle multiple machine types', async () => {
  //         const mockCncPeminjaman = [{
  //             _id: 'cnc1',
  //             status: 'Menunggu',
  //             tanggal_peminjaman: '2024-10-20',
  //             awal_peminjaman: '09:00 AM'
  //         }];

  //         const mockLaserPeminjaman = [{
  //             _id: 'laser1',
  //             status: 'Disetujui',
  //             tanggal_peminjaman: '2024-10-20',
  //             awal_peminjaman: '10:00 AM'
  //         }];

  //         const mockPrintingPeminjaman = [{
  //             _id: 'printing1',
  //             status: 'Diproses',
  //             tanggal_peminjaman: '2024-10-20',
  //             awal_peminjaman: '11:00 AM'
  //         }];

  //         Cnc.find.mockResolvedValue(mockCncPeminjaman);
  //         Laser.find.mockResolvedValue(mockLaserPeminjaman);
  //         Printing.find.mockResolvedValue(mockPrintingPeminjaman);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         const response = mockRes.json.mock.calls[0][0];

  //         // Verify each machine type response
  //         expect(response).toHaveProperty('Cnc');
  //         expect(response).toHaveProperty('Laser');
  //         expect(response).toHaveProperty('Printing');

  //         // Verify counts for each type
  //         expect(response.Cnc.statusCounts.Menunggu).toBe(1);
  //         expect(response.Laser.statusCounts.Disetujui).toBe(1);
  //         expect(response.Printing.statusCounts.Diproses).toBe(1);
  //     });

  //     // it('should correctly identify expired peminjaman', async () => {
  //     //     const currentDate = new Date('2024-10-22T10:00:00Z');
  //     //     jest.setSystemTime(currentDate);

  //     //     const mockPeminjamans = [
  //     //         {
  //     //             _id: 'peminjamanId123',
  //     //             status: 'Menunggu',
  //     //             tanggal_peminjaman: '2024-10-20',
  //     //             awal_peminjaman: '2024-10-20T08:00:00Z',
  //     //             nama_pemohon: 'Budi Santoso'
  //     //         },
  //     //         {
  //     //             _id: 'peminjamanId124',
  //     //             status: 'Menunggu',
  //     //             tanggal_peminjaman: '2024-10-23',
  //     //             awal_peminjaman: '2024-10-23T08:00:00Z',
  //     //             nama_pemohon: 'Ahmad Faisal'
  //     //         }
  //     //     ];

  //     //     Cnc.find.mockResolvedValue(mockPeminjamans);
  //     //     Laser.find.mockResolvedValue([]);
  //     //     Printing.find.mockResolvedValue([]);

  //     //     await checkPeminjamanStatus(mockReq, mockRes);

  //     //     const response = mockRes.json.mock.calls[0][0];

  //     //     expect(response.Cnc.details[0].isExpired).toBe(true);
  //     //     expect(response.Cnc.details[1].isExpired).toBe(false);
  //     //     expect(response.Cnc.expired).toBe(1);
  //     // });

  //     it('should correctly identify expired peminjaman', async () => {
  //         const now = new Date('2024-10-22T10:00:00Z');
  //         jest.setSystemTime(now);

  //         const mockPeminjamans = [
  //             {
  //                 _id: 'past1',
  //                 status: 'Menunggu',
  //                 tanggal_peminjaman: '2024-10-20',
  //                 awal_peminjaman: '2024-10-20T08:00:00Z',
  //                 nama_pemohon: 'Past User'
  //             },
  //             {
  //                 _id: 'future1',
  //                 status: 'Menunggu',
  //                 tanggal_peminjaman: '2024-10-23',
  //                 awal_peminjaman: '2024-10-23T08:00:00Z',
  //                 nama_pemohon: 'Future User'
  //             }
  //         ];

  //         Cnc.find.mockResolvedValue(mockPeminjamans);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         const response = mockRes.json.mock.calls[0][0];

  //         expect(response.Cnc.details[0].isExpired).toBe(true);
  //         expect(response.Cnc.details[1].isExpired).toBe(false);
  //         expect(response.Cnc.expired).toBe(1);
  //         expect(response.Cnc.needsUpdate).toBe(1);
  //     });

  //     it('should handle empty results', async () => {
  //         Cnc.find.mockResolvedValue([]);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         const response = mockRes.json.mock.calls[0][0];

  //         // Verify empty response structure
  //         ['Cnc', 'Laser', 'Printing'].forEach(type => {
  //             expect(response[type]).toEqual({
  //                 total: 0,
  //                 statusCounts: {
  //                     Menunggu: 0,
  //                     Disetujui: 0,
  //                     Ditolak: 0,
  //                     Diproses: 0,
  //                     Other: 0
  //                 },
  //                 expired: 0,
  //                 needsUpdate: 0,
  //                 details: []
  //             });
  //         });
  //     });

  //     it('should handle database errors gracefully', async () => {
  //         // Mock console.error
  //         const mockConsoleError = jest.fn();
  //         console.error = mockConsoleError;

  //         // Setup mock error sebagai objek biasa
  //         const dbError = {
  //             name: 'MongoError',
  //             message: 'Database connection failed'
  //         };

  //         // Setup mocks
  //         Cnc.find.mockRejectedValue(dbError);
  //         Laser.find.mockResolvedValue([]);
  //         Printing.find.mockResolvedValue([]);

  //         await checkPeminjamanStatus(mockReq, mockRes);

  //         // Verify error logging
  //         expect(mockConsoleError).toHaveBeenCalled();

  //         // Verify response structure
  //         const response = mockRes.json.mock.calls[0][0];
  //         expect(response).toHaveProperty('Laser');
  //         expect(response).toHaveProperty('Printing');
  //         expect(response.Laser).toEqual({
  //             total: 0,
  //             statusCounts: {
  //                 Menunggu: 0,
  //                 Disetujui: 0,
  //                 Ditolak: 0,
  //                 Diproses: 0,
  //                 Other: 0
  //             },
  //             expired: 0,
  //             needsUpdate: 0,
  //             details: []
  //         });
  //     });
  // });
// });
