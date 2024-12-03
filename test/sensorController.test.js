// // sensorController.test.js

// const axios = require("axios");
// // Deklarasikan mock sebelum menggunakannya
// const mockAxios = {
//   post: jest.fn().mockResolvedValue({ status: 201 }),
// };

// // Setup mock untuk axios
// // Mock axios secara global
// jest.mock("axios", () => ({
//   post: jest.fn(),
// }));

// const {
//   startRental,
//   buttonPeminjaman,
//   getLatestData,
//   updateCurrent,
//   getLatestCurrent,
// } = require("../controllers/sensorController");

// const { Cnc, Laser, Printing } = require("../models/peminjamanModel");
// const {
//   CncSensor,
//   LaserSensor,
//   PrintingSensor,
// } = require("../models/sensorModel");

// // Mock the models
// jest.mock("../models/peminjamanModel", () => ({
//   Cnc: { findById: jest.fn(), save: jest.fn() },
//   Laser: { findById: jest.fn(), save: jest.fn() },
//   Printing: { findById: jest.fn(), save: jest.fn() },
// }));

// jest.mock("../models/sensorModel", () => ({
//   CncSensor: { create: jest.fn(), findOne: jest.fn() },
//   LaserSensor: { create: jest.fn(), findOne: jest.fn() },
//   PrintingSensor: { create: jest.fn(), findOne: jest.fn() },
// }));

// // describe("startRental", () => {
// //   let req;
// //   let res;
// //   let mockNow;

// //   beforeEach(() => {
// //     // Clear all mocks
// //     jest.clearAllMocks();
// //     mockNow = new Date("2024-03-03T10:00:00.000Z");
// //     jest.useFakeTimers().setSystemTime(new Date("2024-03-03T10:00:00.000Z"));

// //     // Setup mock request and response
// //     req = {
// //       body: {
// //         peminjamanId: "testId123",
// //         type: "cnc",
// //       },
// //     };

// //     res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Define global mock for convertTimeStringToDate
// //     global.convertTimeStringToDate = jest.fn((timeString, baseDate) => {
// //       if (timeString === "11:00 AM")
// //         return new Date("2024-03-03T11:00:00.000Z");
// //       if (timeString === "12:00 PM")
// //         return new Date("2024-03-03T12:00:00.000Z");
// //       return null;
// //     });
// //   });

// //   afterEach(() => {
// //     jest.useRealTimers();
// //     delete global.convertTimeStringToDate;
// //   });

// //   test("should return 400 if peminjamanId or type is missing", async () => {
// //     // Test missing peminjamanId
// //     req.body = { type: "cnc" };
// //     await startRental(req, res);
// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "peminjamanId dan type harus disediakan.",
// //     });

// //     // Test missing type
// //     req.body = { peminjamanId: "testId123" };
// //     await startRental(req, res);
// //     expect(res.status).toHaveBeenCalledWith(400);
// //   });

// //   test("should return 404 if peminjaman is not found", async () => {
// //     Cnc.findById = jest.fn().mockResolvedValue(null);

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(404);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Peminjaman tidak ditemukan.",
// //     });
// //   });

// //   test("should return 400 if peminjaman is already started", async () => {
// //     Cnc.findById = jest.fn().mockResolvedValue({
// //       isStarted: true,
// //       tanggal_peminjaman: "2024-03-03",
// //       awal_peminjaman: "9:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       alamat_esp: "http://test-esp.local",
// //     });

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Peminjaman sudah dimulai.",
// //     });
// //   });

// //   //   test("should return 400 if rental time has not started yet", async () => {
// //   //     // Mock peminjaman with future start time
// //   //     const mockPeminjaman = {
// //   //       isStarted: false,
// //   //       tanggal_peminjaman: "2024-03-03T00:00:00.000Z",
// //   //       awal_peminjaman: "11:00 AM",
// //   //       akhir_peminjaman: "12:00 PM",
// //   //       alamat_esp: "http://test-esp.local",
// //   //       save: jest.fn(),
// //   //     };

// //   //     // Set up mocks
// //   //     Cnc.findById.mockResolvedValue(mockPeminjaman);

// //   //     // Mock the time conversion to ensure future start time
// //   //     const futureStartTime = new Date("2024-03-03T11:00:00.000Z"); // 1 hour in future
// //   //     const futureEndTime = new Date("2024-03-03T12:00:00.000Z"); // 2 hours in future

// //   //     global.convertTimeStringToDate = jest
// //   //       .fn()
// //   //       .mockReturnValueOnce(futureStartTime) // For awal_peminjaman
// //   //       .mockReturnValueOnce(futureEndTime); // For akhir_peminjaman

// //   //     await startRental(req, res);

// //   //     expect(global.convertTimeStringToDate).toHaveBeenCalled();
// //   //     expect(res.status).toHaveBeenCalledWith(400);
// //   //     expect(res.json).toHaveBeenCalledWith({
// //   //       message: "Waktu peminjaman belum dimulai.",
// //   //     });
// //   //   });

// //   test("should return 400 if rental time has already ended", async () => {
// //     Cnc.findById = jest.fn().mockResolvedValue({
// //       isStarted: false,
// //       tanggal_peminjaman: "2024-03-03",
// //       awal_peminjaman: "8:00 AM",
// //       akhir_peminjaman: "9:00 AM", // Past time
// //       alamat_esp: "http://test-esp.local",
// //       save: jest.fn(),
// //     });

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Waktu peminjaman sudah berakhir.",
// //     });
// //   });

// //   test("should return 400 if rental time has not started yet", async () => {
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       tanggal_peminjaman: "2024-03-03",
// //       awal_peminjaman: "11:00 AM",
// //       akhir_peminjaman: "12:00 PM",
// //       alamat_esp: "http://test-esp.local",
// //       save: jest.fn(),
// //     };

// //     Cnc.findById.mockResolvedValue(mockPeminjaman);

// //     // Simpan mock awal
// //     jest.spyOn(global, "convertTimeStringToDate").mockImplementation((time, base) => {
// //       return new Date(base.setHours(11, 0, 0, 0)); // Mock agar mengembalikan waktu yang diinginkan
// //     });

// //     await startRental(req, res);

// //     expect(global.convertTimeStringToDate).toHaveBeenCalled();
// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Waktu peminjaman belum dimulai.",
// //     });

// //     // Bersihkan mock
// //     global.convertTimeStringToDate.mockRestore();
// //   });

// //   test("should handle relay activation failure", async () => {
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       tanggal_peminjaman: "2024-03-03T00:00:00.000Z",
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       alamat_esp: "http://test-esp.local",
// //       save: jest.fn(),
// //     };

// //     Cnc.findById.mockResolvedValue(mockPeminjaman);
// //     axios.post.mockRejectedValue(new Error("Network Error"));

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(500);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Gagal memulai peminjaman.",
// //     });
// //   });

// //   test("should handle invalid time format", async () => {
// //     Cnc.findById = jest.fn().mockResolvedValue({
// //       isStarted: false,
// //       tanggal_peminjaman: "2024-03-03",
// //       awal_peminjaman: "invalid time",
// //       akhir_peminjaman: "11:00 AM",
// //       alamat_esp: "http://test-esp.local",
// //       save: jest.fn(),
// //     });

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Invalid waktu peminjaman format.",
// //     });
// //   });
// // });

// // describe("startRental", () => {
// //   beforeEach(() => {
// //     jest.clearAllMocks();
// //     jest.useFakeTimers();
// //     jest.setSystemTime(new Date("2024-01-01T10:00:00Z"));

// //     // Reset axios mock
// //     axios.post.mockClear();
// //     axios.post.mockResolvedValue({ status: 201 });

// //     // Debug log
// //     console.log("Before test - axios.post mock:", axios.post);
// //   });

// //   afterEach(() => {
// //     jest.useRealTimers();
// //     mockAxios.post.mockClear();
// //   });

// //   it("should return 400 if peminjamanId or type is not provided", async () => {
// //     const req = { body: {} };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "peminjamanId dan type harus disediakan.",
// //     });
// //   });

// //   it("should return 404 if peminjaman not found", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     Cnc.findById.mockResolvedValue(null);

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(404);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Peminjaman tidak ditemukan.",
// //     });
// //   });

// //   it("should return 400 if rental has already started", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     Cnc.findById.mockResolvedValue({ isStarted: true });

// //     await startRental(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Peminjaman sudah dimulai.",
// //     });
// //   });

// //   it("should activate the relay and start rental", async () => {
// //     // Setup request dan response
// //     const req = {
// //       body: {
// //         peminjamanId: "123",
// //         type: "cnc",
// //       },
// //     };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Setup mock peminjaman
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: "2024-01-01T10:00:00Z",
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockImplementation(function () {
// //         this.isStarted = true;
// //         return Promise.resolve(this);
// //       }),
// //     };

// //     // Setup mock convertTimeStringToDate
// //     global.convertTimeStringToDate = jest
// //       .fn()
// //       .mockReturnValueOnce(new Date("2024-01-01T09:00:00Z")) // untuk awal_peminjaman
// //       .mockReturnValueOnce(new Date("2024-01-01T11:00:00Z")); // untuk akhir_peminjaman

// //     // Setup mock database
// //     Cnc.findById = jest.fn().mockResolvedValue(mockPeminjaman);

// //     // Debug: Log mock axios sebelum test
// //     console.log("axios.post mock before:", axios.post.mock);

// //     // Jalankan fungsi yang akan ditest
// //     await startRental(req, res);

// //     // Debug: Log calls ke axios.post setelah fungsi dijalankan
// //     console.log("axios.post calls after:", axios.post.mock.calls);

// //     // Verifikasi dalam urutan yang benar
// //     expect(Cnc.findById).toHaveBeenCalledWith("123");
// //     expect(axios.post).toHaveBeenCalledWith("http://example.com", {
// //       button: true,
// //     });
// //     expect(mockPeminjaman.isStarted).toBe(true);
// //     expect(mockPeminjaman.save).toHaveBeenCalled();
// //     expect(res.status).toHaveBeenCalledWith(200);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Relay diaktifkan, peminjaman dimulai.",
// //     });
// //   });

// //   it("should successfully activate the rental", async () => {
// //     // Setup request
// //     const req = {
// //       body: {
// //         peminjamanId: "123",
// //         type: "cnc",
// //       },
// //     };

// //     // Setup response
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Setup mock peminjaman
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: "2024-01-01T10:00:00Z",
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockResolvedValue(true),
// //     };

// //     // Setup mocks
// //     global.convertTimeStringToDate = jest.fn((timeString) => {
// //       if (timeString === "09:00 AM") return new Date("2024-01-01T09:00:00Z");
// //       if (timeString === "11:00 AM") return new Date("2024-01-01T11:00:00Z");
// //       return null;
// //     });

// //     Cnc.findById = jest.fn().mockResolvedValue(mockPeminjaman);

// //     // Debug logs
// //     console.log("Before startRental:", {
// //       axiosPost: axios.post.mock,
// //       findById: Cnc.findById.mock,
// //     });

// //     // Execute
// //     await startRental(req, res);

// //     // Debug logs
// //     console.log("After startRental:", {
// //       axiosPostCalls: axios.post.mock.calls,
// //       saveMethodCalls: mockPeminjaman.save.mock.calls,
// //       statusCalls: res.status.mock.calls,
// //       jsonCalls: res.json.mock.calls,
// //     });

// //     // Verify
// //     expect(Cnc.findById).toHaveBeenCalledWith("123");
// //     expect(axios.post).toHaveBeenCalledWith("http://example.com", {
// //       button: true,
// //     });
// //     expect(mockPeminjaman.save).toHaveBeenCalled();
// //     expect(res.status).toHaveBeenCalledWith(200);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Relay diaktifkan, peminjaman dimulai.",
// //     });
// //   });

// //   // Test case untuk sukses dengan kondisi berbeda
// //   it("should successfully start rental if all conditions are met", async () => {
// //     const mockReq = {
// //       body: {
// //         peminjamanId: "testId",
// //         type: "cnc milling",
// //       },
// //     };
// //     const mockRes = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: "2024-01-01T10:00:00Z",
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockImplementation(function () {
// //         this.isStarted = true;
// //         return Promise.resolve(this);
// //       }),
// //     };

// //     // Setup mocks
// //     global.convertTimeStringToDate = jest
// //       .fn()
// //       .mockReturnValueOnce(new Date("2024-01-01T09:00:00Z"))
// //       .mockReturnValueOnce(new Date("2024-01-01T11:00:00Z"));

// //     Cnc.findById = jest.fn().mockResolvedValue(mockPeminjaman);

// //     // Debug logs
// //     console.log("axios.post mock before:", axios.post.mock);

// //     await startRental(mockReq, mockRes);

// //     console.log("axios.post calls after:", axios.post.mock.calls);

// //     // Verifikasi
// //     expect(Cnc.findById).toHaveBeenCalledWith("testId");
// //     expect(axios.post).toHaveBeenCalledWith("http://example.com", {
// //       button: true,
// //     });
// //     expect(mockPeminjaman.isStarted).toBe(true);
// //     expect(mockPeminjaman.save).toHaveBeenCalled();
// //     expect(mockRes.status).toHaveBeenCalledWith(200);
// //     expect(mockRes.json).toHaveBeenCalledWith({
// //       message: "Relay diaktifkan, peminjaman dimulai.",
// //     });
// //   });

// //   it("should handle invalid time format", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Create a mock peminjaman with invalid time format
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: new Date("2024-11-02T10:00:00.000Z").toISOString(),
// //       awal_peminjaman: "invalid-time",
// //       akhir_peminjaman: "invalid-time",
// //       save: jest.fn().mockResolvedValue(true),
// //     };

// //     // Setup the mocks
// //     Cnc.findById.mockResolvedValue(mockPeminjaman);

// //     // Execute the function
// //     await startRental(req, res);

// //     // Verify the response
// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Invalid waktu peminjaman format.",
// //     });
// //   });

// //   it("should handle relay communication failure", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Create a mock peminjaman with valid time format
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: new Date("2024-11-02T10:00:00.000Z").toISOString(),
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockResolvedValue(true),
// //     };

// //     // Setup the mocks
// //     Cnc.findById.mockResolvedValue(mockPeminjaman);
// //     axios.post.mockRejectedValue(new Error("Network Error"));

// //     // Execute the function
// //     await startRental(req, res);

// //     // Verify the response
// //     expect(res.status).toHaveBeenCalledWith(500);
// //     expect(res.json).toHaveBeenCalledWith({
// //       message: "Gagal memulai peminjaman.",
// //     });
// //   });

// //   it("should handle automatic rental end", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Create a mock peminjaman with valid time format
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: new Date("2024-11-02T10:00:00.000Z").toISOString(),
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockImplementation(function () {
// //         this.isStarted = true;
// //         return Promise.resolve(this);
// //       }),
// //     };

// //     // Setup the mocks
// //     Cnc.findById
// //       .mockResolvedValueOnce(mockPeminjaman) // First call for initial check
// //       .mockResolvedValue({
// //         // Subsequent calls for interval checks
// //         ...mockPeminjaman,
// //         akhir_peminjaman: "10:01 AM", // Set to just after current time
// //       });

// //     axios.post
// //       .mockResolvedValueOnce({ status: 201 }) // Initial activation
// //       .mockResolvedValue({ status: 201 }); // Subsequent calls

// //     // Execute the function
// //     await startRental(req, res);

// //     // Verify initial relay activation
// //     expect(axios.post).toHaveBeenCalledWith("http://example.com", {
// //       button: true,
// //     });
// //     expect(mockPeminjaman.save).toHaveBeenCalled();

// //     // Fast forward time past the rental end time
// //     jest.advanceTimersByTime(60000); // Advance 1 minute
// //     await Promise.resolve();

// //     // Verify the relay was turned off
// //     expect(axios.post).toHaveBeenLastCalledWith("http://example.com", {
// //       button: false,
// //     });
// //   });

// //   it("should handle error during automatic rental end", async () => {
// //     const req = { body: { peminjamanId: "123", type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     // Create a mock peminjaman
// //     const mockPeminjaman = {
// //       isStarted: false,
// //       alamat_esp: "http://example.com",
// //       tanggal_peminjaman: new Date("2024-11-02T10:00:00.000Z").toISOString(),
// //       awal_peminjaman: "09:00 AM",
// //       akhir_peminjaman: "11:00 AM",
// //       save: jest.fn().mockImplementation(function () {
// //         this.isStarted = true;
// //         return Promise.resolve(this);
// //       }),
// //     };

// //     // Setup the mocks
// //     Cnc.findById.mockResolvedValue(mockPeminjaman);
// //     axios.post.mockResolvedValueOnce({ status: 201 }); // Initial activation succeeds

// //     // Execute the function
// //     await startRental(req, res);

// //     // Verify the peminjaman was started
// //     expect(mockPeminjaman.isStarted).toBe(true);
// //     expect(axios.post).toHaveBeenCalledWith("http://example.com", {
// //       button: true,
// //     });
// //   });

// //   it("should handle invalid type parameter", async () => {
// //     const req = {
// //       params: { type: "invalid-type" },
// //       body: { button: true },
// //     };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //       statusCode: null,
// //     };

// //     res.status.mockImplementation((code) => {
// //       res.statusCode = code;
// //       return res;
// //     });

// //     try {
// //       await buttonPeminjaman(req, res);
// //     } catch (error) {
// //       expect(error.message).toBe("Invalid type for sensor: invalid-type");
// //     }
// //   });
// // });

// // describe('startRental', () => {
// //     it('should return 400 if peminjamanId or type is not provided', async () => {
// //         const req = { body: {} };
// //         const res = {
// //             status: jest.fn().mockReturnThis(),
// //             json: jest.fn()
// //         };

// //         await startRental(req, res);

// //         expect(res.status).toHaveBeenCalledWith(400);
// //         expect(res.json).toHaveBeenCalledWith({ message: "peminjamanId dan type harus disediakan." });
// //     });

// //     it('should return 404 if peminjaman not found', async () => {
// //         const req = { body: { peminjamanId: '123', type: 'cnc' } };
// //         const res = {
// //             status: jest.fn().mockReturnThis(),
// //             json: jest.fn()
// //         };

// //         Cnc.findById.mockResolvedValue(null);

// //         await startRental(req, res);

// //         expect(res.status).toHaveBeenCalledWith(404);
// //         expect(res.json).toHaveBeenCalledWith({ message: "Peminjaman tidak ditemukan." });
// //     });

// //     it('should return 400 if rental has already started', async () => {
// //         const req = { body: { peminjamanId: '123', type: 'cnc' } };
// //         const res = {
// //             status: jest.fn().mockReturnThis(),
// //             json: jest.fn()
// //         };

// //         Cnc.findById.mockResolvedValue({ isStarted: true });

// //         await startRental(req, res);

// //         expect(res.status).toHaveBeenCalledWith(400);
// //         expect(res.json).toHaveBeenCalledWith({ message: "Peminjaman sudah dimulai." });
// //     });

// //     it('should activate the relay and start rental', async () => {
// //         const req = { body: { peminjamanId: '123', type: 'cnc' } };
// //         const res = {
// //             status: jest.fn().mockReturnThis(),
// //             json: jest.fn()
// //         };

// //         Cnc.findById.mockResolvedValue({
// //             isStarted: false,
// //             alamat_esp: 'http://example.com',
// //             tanggal_peminjaman: new Date().toISOString(),
// //             awal_peminjaman: '8:00 AM',
// //             akhir_peminjaman: '5:00 PM',
// //             save: jest.fn()
// //         });

// //         axios.post.mockResolvedValue({ status: 201 });

// //         await startRental(req, res);

// //         expect(axios.post).toHaveBeenCalledWith('http://example.com', { button: true });
// //         expect(res.status).toHaveBeenCalledWith(200);
// //         expect(res.json).toHaveBeenCalledWith({ message: "Relay diaktifkan, peminjaman dimulai." });
// //     });
// // });

// describe("startRental", () => {
//   let req, res;

//   beforeEach(() => {
//     // Set up request dan response mocks
//     req = {
//       body: {
//         peminjamanId: "testId",
//         type: "cnc",
//       },
//     };

//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     // Reset axios.post mock untuk setiap test case
//     axios.post.mockClear();
//   });

//     // // Setup base mock date for consistent testing
//     // mockDate = new Date("2024-03-03T08:00:00.000Z"); // 8 AM
//     // jest.useFakeTimers();
//     // jest.setSystemTime(mockDate);

//     // // Explicitly set the convertTimeStringToDate mock implementation
//     // global.convertTimeStringToDate = jest
//     //   .fn()
//     //   .mockImplementation((timeString, baseDate) => {
//     //     if (timeString === "10:00 AM") {
//     //       // Start time: future time (10 AM)
//     //       const date = new Date(baseDate);
//     //       date.setHours(10, 0, 0, 0);
//     //       return date;
//     //     }
//     //     if (timeString === "11:00 AM") {
//     //       // End time: future time (11 AM)
//     //       const date = new Date(baseDate);
//     //       date.setHours(11, 0, 0, 0);
//     //       return date;
//     //     }
//     //     return null;
//     //   });
//   });

//   afterEach(() => {
//     jest.useRealTimers();
//     delete global.convertTimeStringToDate;
//   });

//   it("should return 400 if peminjamanId or type is not provided", async () => {
//     req.body.peminjamanId = null;

//     await startRental(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "peminjamanId dan type harus disediakan.",
//     });
//   });

//   it("should return 404 if peminjaman is not found", async () => {
//     Cnc.findById.mockResolvedValue(null);

//     await startRental(req, res);

//     expect(Cnc.findById).toHaveBeenCalledWith("testId");
//     expect(res.status).toHaveBeenCalledWith(404);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Peminjaman tidak ditemukan.",
//     });
//   });

//   it("should return 400 if peminjaman has already started", async () => {
//     Cnc.findById.mockResolvedValue({ isStarted: true });

//     await startRental(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Peminjaman sudah dimulai.",
//     });
//   });

//   it("should return 400 if rental time has not started yet", async () => {
//     Cnc.findById.mockResolvedValue({
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: "2024-03-03T00:00:00.000Z",
//       awal_peminjaman: "10:00 AM",
//       akhir_peminjaman: "11:00 PM",
//       save: jest.fn(),
//     });

//     console.log("Current mock time in test:", new Date()); // Debugging log

//     await startRental(req, res);

//     console.log("Response status calls in test:", res.status.mock.calls); // Debugging log
//     console.log("Response JSON calls in test:", res.json.mock.calls); // Debugging log

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Waktu peminjaman belum dimulai.",
//     });
//   });

//   it("should return 400 if the rental time has already ended", async () => {
//     // Mock peminjaman dengan waktu yang valid
//     Cnc.findById.mockResolvedValue({
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: "2024-03-03T00:00:00.000Z",
//       awal_peminjaman: "08:00 AM",
//       akhir_peminjaman: "09:00 AM",
//       save: jest.fn(),
//     });

//     // Simulasikan waktu saat ini setelah akhir peminjaman
//     jest.useFakeTimers().setSystemTime(new Date("2024-03-03T10:00:00.000Z"));

//     await startRental(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Waktu peminjaman sudah berakhir.",
//     });
//   });

//   it("should handle relay activation and start the rental", async () => {
//     const mockPeminjaman = {
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: new Date().toISOString(),
//       awal_peminjaman: "12:01 PM",
//       akhir_peminjaman: "11:59 PM",
//       save: jest.fn(),
//     };

//     Cnc.findById.mockResolvedValue(mockPeminjaman);
//     axios.post.mockResolvedValue({ status: 201 });

//     await startRental(req, res);

//     expect(axios.post).toHaveBeenCalledWith("http://test-esp.local", {
//       button: true,
//     });
//     expect(mockPeminjaman.isStarted).toBe(true);
//     expect(mockPeminjaman.save).toHaveBeenCalled();
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Relay diaktifkan, peminjaman dimulai.",
//     });
//   });

//   it("should return 500 if relay activation fails", async () => {
//     // Mock data peminjaman yang valid
//     const mockPeminjaman = {
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: new Date().toISOString(),
//       awal_peminjaman: "12:01 PM",
//       akhir_peminjaman: "11:59 PM",
//       save: jest.fn(),
//     };

//     // Set mock pada Model dan axios.post
//     Cnc.findById.mockResolvedValue(mockPeminjaman);
//     axios.post.mockRejectedValueOnce(new Error("Relay error")); // Atur mock untuk gagal

//     // Jalankan fungsi startRental
//     await startRental(req, res);

//     // Verifikasi hasil pengujian
//     expect(axios.post).toHaveBeenCalledWith("http://test-esp.local", {
//       button: true,
//     });
//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Gagal memulai peminjaman.",
//     });
//   });

// describe("buttonPeminjaman", () => {
//   it("should create a new sensor entry", async () => {
//     const req = { params: { type: "cnc" }, body: { button: true } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null, // Simulate statusCode
//     };

//     // Mock the implementation to set statusCode directly
//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     CncSensor.create.mockResolvedValue({ button: true });

//     await buttonPeminjaman(req, res);

//     expect(CncSensor.create).toHaveBeenCalledWith({ button: true });
//     expect(res.statusCode).toBe(201); // Check statusCode directly
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: 201,
//       message: "Terunggah",
//       data: { button: true },
//     });
//   });

//   it("should handle database error", async () => {
//     const req = { params: { type: "cnc" }, body: { button: true } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null,
//     };

//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     CncSensor.create.mockRejectedValue(new Error("Database Error"));

//     await buttonPeminjaman(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Error mengunggah data",
//     });
//   });

//   it("should handle invalid type parameter", async () => {
//     const req = {
//       params: { type: "invalid-type" },
//       body: { button: true },
//     };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null,
//     };

//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     try {
//       await buttonPeminjaman(req, res);
//     } catch (error) {
//       expect(error.message).toBe("Invalid type for sensor: invalid-type");
//     }
//   });

//   it("should handle missing button value", async () => {
//     const req = {
//       params: { type: "cnc" },
//       body: {},
//     };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null,
//     };

//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     await buttonPeminjaman(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Error mengunggah data",
//     });
//   });
// });

// describe("getLatestData", () => {
//   it("should return the latest sensor data", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null, // Simulate statusCode
//     };

//     // Mock the implementation to set statusCode directly
//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     const mockData = { button: true, waktu: new Date() };
//     const mockCurrentData = { current: 10, waktu: new Date() };

//     CncSensor.findOne
//       .mockReturnValueOnce({
//         sort: jest.fn().mockResolvedValue(mockData),
//       })
//       .mockReturnValueOnce({
//         sort: jest.fn().mockResolvedValue(mockCurrentData),
//       });

//     await getLatestData(req, res);

//     expect(res.statusCode).toBe(200); // Check statusCode directly
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: 200,
//       data: {
//         button: mockData.button,
//         current: mockCurrentData.current,
//         waktu: mockCurrentData.waktu,
//       },
//     });
//   });

//   it("should return 404 if no data is found", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null, // Simulate statusCode
//     };

//     // Mock the implementation to set statusCode directly
//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     CncSensor.findOne.mockReturnValue({
//       sort: jest.fn().mockResolvedValue(null),
//     });

//     await getLatestData(req, res);

//     expect(res.statusCode).toBe(404); // Check statusCode directly
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "No data found",
//     });
//   });
// });

// describe("updateCurrent", () => {
//   let req;
//   let res;

//   beforeEach(() => {
//     jest.useFakeTimers();
//     jest.setSystemTime(new Date("2024-11-02T12:15:51.852Z"));

//     res = {
//       statusCode: null,
//       status: jest.fn(function (code) {
//         this.statusCode = code;
//         return this;
//       }),
//       json: jest.fn(),
//     };
//   });

//   afterEach(() => {
//     jest.useRealTimers();
//   });

//   it("should create a new current entry", async () => {
//     req = {
//       params: { type: "cnc" },
//       body: { current: 10 },
//     };

//     const expectedData = {
//       current: parseFloat(10),
//       waktu: new Date("2024-11-02T12:15:51.852Z"),
//     };

//     CncSensor.create.mockResolvedValue(expectedData);

//     await updateCurrent(req, res);

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: 201,
//       message: "Data arus terunggah",
//       data: expectedData,
//     });
//   });

//   it("should handle database errors", async () => {
//     req = {
//       params: { type: "cnc" },
//       body: { current: 10 },
//     };

//     CncSensor.create.mockRejectedValue(new Error("Database error"));

//     await updateCurrent(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Error updating current data",
//     });
//   });

//   it("should handle missing current value", async () => {
//     req = {
//       params: { type: "cnc" },
//       body: {},
//     };

//     await updateCurrent(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Current value is required",
//     });
//   });

//   it("should handle invalid current value", async () => {
//     req = {
//       params: { type: "cnc" },
//       body: { current: "invalid" },
//     };

//     await updateCurrent(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Invalid current value",
//     });
//   });
// });

// describe("getLatestCurrent", () => {
//   it("should return the latest current data", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null, // Simulate statusCode
//     };

//     // Mock the implementation to set statusCode directly
//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     const mockCurrentData = { current: 10, waktu: new Date() };

//     CncSensor.findOne.mockReturnValue({
//       sort: jest.fn().mockResolvedValue(mockCurrentData),
//     });

//     await getLatestCurrent(req, res);

//     expect(res.statusCode).toBe(200); // Check statusCode directly
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: 200,
//       data: {
//         current: mockCurrentData.current,
//         waktu: mockCurrentData.waktu,
//       },
//     });
//   });

//   it("should return 404 if no current data is found", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: null, // Simulate statusCode
//     };

//     // Mock the implementation to set statusCode directly
//     res.status.mockImplementation((code) => {
//       res.statusCode = code;
//       return res;
//     });

//     CncSensor.findOne.mockReturnValue({
//       sort: jest.fn().mockResolvedValue(null),
//     });

//     await getLatestCurrent(req, res);

//     expect(res.statusCode).toBe(404); // Check statusCode directly
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "No current data found",
//     });
//   });
// });

// --------------------------------------------------------------------------------------------------------------------------------- //
// const axios = require("axios");

// // Mock axios
// jest.mock("axios", () => ({
//   post: jest.fn(),
// }));

// const {
//   startRental,
//   buttonPeminjaman,
//   getLatestData,
//   updateCurrent,
//   getLatestCurrent,
// } = require("../controllers/sensorController");

// const { Cnc, Laser, Printing } = require("../models/peminjamanModel");
// const {
//   CncSensor,
//   LaserSensor,
//   PrintingSensor,
// } = require("../models/sensorModel");

// // Mock model peminjaman dan sensor
// jest.mock("../models/peminjamanModel", () => ({
//   Cnc: { findById: jest.fn(), save: jest.fn() },
//   Laser: { findById: jest.fn(), save: jest.fn() },
//   Printing: { findById: jest.fn(), save: jest.fn() },
// }));

// jest.mock("../models/sensorModel", () => ({
//   CncSensor: { create: jest.fn(), findOne: jest.fn() },
//   LaserSensor: { create: jest.fn(), findOne: jest.fn() },
//   PrintingSensor: { create: jest.fn(), findOne: jest.fn() },
// }));

// describe("startRental", () => {
//   let req, res;
//   let mockDate;

//   beforeEach(() => {
//     req = {
//       body: {
//         peminjamanId: "testId",
//         type: "cnc",
//       },
//     };
//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     // Reset all mocks
//     jest.clearAllMocks();
//     axios.post.mockClear();
//   });

//   afterEach(() => {
//     jest.useRealTimers();
//   });

//   it("should return 400 if peminjamanId or type is not provided", async () => {
//     req.body.peminjamanId = null;
//     await startRental(req, res);
//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "peminjamanId dan type harus disediakan.",
//     });
//   });

//   it("should return 404 if peminjaman is not found", async () => {
//     Cnc.findById.mockResolvedValue(null);
//     await startRental(req, res);
//     expect(Cnc.findById).toHaveBeenCalledWith("testId");
//     expect(res.status).toHaveBeenCalledWith(404);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Peminjaman tidak ditemukan.",
//     });
//   });

//   it("should return 400 if peminjaman has already started", async () => {
//     Cnc.findById.mockResolvedValue({ isStarted: true });
//     await startRental(req, res);
//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Peminjaman sudah dimulai.",
//     });
//   });

//   it("should return 400 if rental time has not started yet", async () => {
//     // Mock current time to 07:00:00 WIB (00:00:00 UTC)
//     const mockCurrentTime = new Date("2024-03-03T00:00:00.000Z"); // 07:00 WIB
//     jest.useFakeTimers();
//     jest.setSystemTime(mockCurrentTime);

//     const mockPeminjaman = {
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: "2024-03-03", // tanggal peminjaman
//       awal_peminjaman: "09:00:00 AM", // 09:00 WIB (02:00 UTC)
//       akhir_peminjaman: "11:00:00 AM", // 11:00 WIB (04:00 UTC)
//       save: jest.fn(),
//     };

//     // Setup mock
//     Cnc.findById.mockResolvedValue(mockPeminjaman);

//     // Execute
//     await startRental(req, res);

//     // Verifikasi response
//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Waktu peminjaman belum dimulai.",
//     });

//     jest.useRealTimers();
//   });

//   it("should return 400 if the rental time has already ended", async () => {
//     Cnc.findById.mockResolvedValue({
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: "2024-03-03T00:00:00.000Z",
//       awal_peminjaman: "08:00 AM",
//       akhir_peminjaman: "09:00 AM",
//       save: jest.fn(),
//     });

//     jest.useFakeTimers().setSystemTime(new Date("2024-03-03T10:00:00.000Z"));
//     await startRental(req, res);

//     expect(res.status).toHaveBeenCalledWith(400);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Waktu peminjaman sudah berakhir.",
//     });
//   });

//   it("should handle relay activation and start the rental", async () => {
//     const mockPeminjaman = {
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: new Date().toISOString(),
//       awal_peminjaman: "08:00 AM",
//       akhir_peminjaman: "11:59 PM",
//       save: jest.fn().mockImplementation(function () {
//         this.isStarted = true;
//         return Promise.resolve(this);
//       }),
//     };

//     Cnc.findById.mockResolvedValue(mockPeminjaman);
//     axios.post.mockResolvedValue({ status: 201 });

//     await startRental(req, res);

//     expect(axios.post).toHaveBeenCalledWith("http://test-esp.local", {
//       button: true,
//     });
//     expect(mockPeminjaman.isStarted).toBe(true);
//     expect(mockPeminjaman.save).toHaveBeenCalled();
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Relay diaktifkan, peminjaman dimulai.",
//     });
//   });

//   // Untuk test "should automatically end the rental after the end time"
//   it("should automatically end the rental after the end time", async () => {
//     // Setup fake timers
//     jest.useFakeTimers();

//     // Set current time to 8:00 AM WIB (1:00 UTC)
//     const currentTime = new Date("2024-03-03T01:00:00.000Z");
//     jest.setSystemTime(currentTime);

//     // Create mock peminjaman with proper structure
//     const mockPeminjaman = {
//       isStarted: false,
//       alamat_esp: "http://test-esp.local",
//       tanggal_peminjaman: "2024-03-03",
//       awal_peminjaman: "08:00:00 AM",
//       akhir_peminjaman: "08:01:00 AM",
//       save: jest.fn().mockResolvedValue(true),
//     };

//     // Setup mocks with clear state tracking
//     const saveSpy = jest.spyOn(mockPeminjaman, "save");

//     Cnc.findById
//       .mockResolvedValueOnce(mockPeminjaman)
//       .mockResolvedValue(mockPeminjaman);

//     axios.post
//       .mockResolvedValueOnce({ status: 201 }) // Initial activation
//       .mockResolvedValueOnce({ status: 201 }); // End rental call

//     // Make the request
//     await startRental(req, res);

//     // Verify initial rental started correctly
//     expect(axios.post).toHaveBeenNthCalledWith(1, "http://test-esp.local", {
//       button: true,
//     });
//     expect(saveSpy).toHaveBeenCalled();
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       message: "Relay diaktifkan, peminjaman dimulai.",
//     });

//     // Clear call counts for next phase
//     jest.clearAllMocks();
//     saveSpy.mockClear();

//     // Fast forward to just after the rental should end (1 minute + 1 second to ensure we're past the end time)
//     await jest.advanceTimersByTimeAsync(61000);

//     // Verify the end rental calls were made
//     expect(axios.post).toHaveBeenCalledWith("http://test-esp.local", {
//       button: false,
//     });
//     expect(saveSpy).toHaveBeenCalled();
//     expect(mockPeminjaman.isStarted).toBe(false);

//     // Cleanup
//     jest.useRealTimers();
//   }, 15000);
// });

// describe("buttonPeminjaman", () => {
//   it("should create a new sensor entry", async () => {
//     const req = {
//       params: { type: "cnc" },
//       body: { button: true },
//     };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: 201,
//     };

//     CncSensor.create.mockResolvedValue({ button: true });

//     await buttonPeminjaman(req, res);

//     expect(CncSensor.create).toHaveBeenCalledWith({ button: true });
//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: res.statusCode,
//       message: "Terunggah",
//       data: { button: true },
//     });
//   });

//   it("should handle database error", async () => {
//     const req = { params: { type: "cnc" }, body: { button: true } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     CncSensor.create.mockRejectedValue(new Error("Database Error"));

//     await buttonPeminjaman(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "Error mengunggah data",
//     });
//   });
// });

// describe("getLatestData", () => {
//   it("should return the latest sensor data", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       statusCode: 200,
//     };

//     const mockDate = new Date();
//     const mockButtonData = { button: true, waktu: mockDate };
//     const mockCurrentData = { current: 10, waktu: mockDate };

//     CncSensor.findOne
//       .mockReturnValueOnce({
//         sort: jest.fn().mockResolvedValue(mockButtonData),
//       })
//       .mockReturnValueOnce({
//         sort: jest.fn().mockResolvedValue(mockCurrentData),
//       });

//     await getLatestData(req, res);

//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       success: true,
//       statusCode: res.statusCode,
//       data: {
//         button: mockButtonData.button,
//         current: mockCurrentData.current,
//         waktu: mockCurrentData.waktu,
//       },
//     });
//   });

//   it("should return 404 if no data is found", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     CncSensor.findOne.mockReturnValue({
//       sort: jest.fn().mockResolvedValue(null),
//     });

//     await getLatestData(req, res);

//     expect(res.status).toHaveBeenCalledWith(404);
//     expect(res.json).toHaveBeenCalledWith({
//       success: false,
//       message: "No data found",
//     });
//   });
//   it("should log and return 500 on failed data retrieval in getLatestData", async () => {
//     const req = { params: { type: "cnc" } };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

//     try {
//       CncSensor.findOne.mockRejectedValue(new Error("Database error"));

//       await getLatestData(req, res);

//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         message: "Error retrieving data",
//       });
//       expect(mockConsoleError).toHaveBeenCalledWith(
//         "Error retrieving data:",
//         expect.any(Error)
//       );
//     } catch (error) {
//       console.error("Test error:", error);
//     } finally {
//       mockConsoleError.mockRestore();
//     }
//   });
// });

// // describe("updateCurrent", () => {
// //   let req, res;

// //   beforeEach(() => {
// //     req = {
// //       params: { type: "cnc" },
// //       body: { current: 10 },
// //     };
// //     res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };
// //   });

// //   it("should create a new current entry", async () => {
// //     const mockData = {
// //       current: 10,
// //       waktu: new Date(),
// //     };

// //     CncSensor.create.mockResolvedValue(mockData);

// //     await updateCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(201);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: true,
// //       statusCode: 201,
// //       message: "Data arus terunggah",
// //       data: mockData,
// //     });
// //   });

// //   it("should handle database errors", async () => {
// //     CncSensor.create.mockRejectedValue(new Error("Database error"));

// //     await updateCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(500);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: false,
// //       message: "Error updating current data",
// //     });
// //   });

// //   it("should return 400 if current value is not provided", async () => {
// //     req.body = {};

// //     await updateCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: false,
// //       message: "Current value is required",
// //     });
// //   });

// //   it("should return 400 if current value is invalid", async () => {
// //     req.body.current = "invalid";

// //     await updateCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(400);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: false,
// //       message: "Invalid current value",
// //     });
// //   });
// // });

// // describe("getLatestCurrent", () => {
// //   it("should return the latest current data", async () => {
// //     const req = { params: { type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //       statusCode: 200,
// //     };

// //     const mockDate = new Date();
// //     const mockCurrentData = { current: 10, waktu: mockDate };

// //     CncSensor.findOne.mockReturnValue({
// //       sort: jest.fn().mockResolvedValue(mockCurrentData),
// //     });

// //     await getLatestCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(200);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: true,
// //       statusCode: res.statusCode,
// //       data: {
// //         current: mockCurrentData.current,
// //         waktu: mockCurrentData.waktu,
// //       },
// //     });
// //   });

// //   it("should return 404 if no current data is found", async () => {
// //     const req = { params: { type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     CncSensor.findOne.mockReturnValue({
// //       sort: jest.fn().mockResolvedValue(null),
// //     });

// //     await getLatestCurrent(req, res);

// //     expect(res.status).toHaveBeenCalledWith(404);
// //     expect(res.json).toHaveBeenCalledWith({
// //       success: false,
// //       message: "No current data found",
// //     });
// //   });

// //   it("should log and return 500 on failed data retrieval in getLatestCurrent", async () => {
// //     const req = { params: { type: "cnc" } };
// //     const res = {
// //       status: jest.fn().mockReturnThis(),
// //       json: jest.fn(),
// //     };

// //     const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

// //     try {
// //       CncSensor.findOne.mockRejectedValue(new Error("Database error"));

// //       await getLatestCurrent(req, res);

// //       expect(res.status).toHaveBeenCalledWith(500);
// //       expect(res.json).toHaveBeenCalledWith({
// //         success: false,
// //         message: "Error retrieving current data",
// //       });
// //       expect(mockConsoleError).toHaveBeenCalledWith(
// //         "[HTTP] Get latest current error:",
// //         expect.any(Error)
// //       );
// //     } catch (error) {
// //       console.error("Test error:", error);
// //     } finally {
// //       mockConsoleError.mockRestore();
// //     }
// //   });

// //   // Continue from previous imports and mocks in sensorController.test.js

// //   describe("Error Handling and Miscellaneous Functions", () => {
// //     describe("convertTimeStringToDate", () => {
// //       it("should return null and log error for invalid date format", () => {
// //         const mockConsoleError = jest
// //           .spyOn(console, "error")
// //           .mockImplementation();
// //         const result = convertTimeStringToDate("invalid", new Date());

// //         expect(result).toBeNull();
//         expect(mockConsoleError).toHaveBeenCalledWith(
//           "ERROR: Failed to convert timeString to Date: TypeError"
//         );

//         mockConsoleError.mockRestore();
//       });
//     });

//     describe("initializeWebSocket", () => {
//       it("should set the WebSocket server and log initialization", () => {
//         const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
//         const mockServer = {}; // Dummy WebSocket server object

//         initializeWebSocket(mockServer);

//         expect(wss).toBe(mockServer);
//         expect(mockConsoleLog).toHaveBeenCalledWith(
//           "[WebSocket] Initialized in sensorController"
//         );

//         mockConsoleLog.mockRestore();
//       });
//     });

//     describe("getModelByType", () => {
//       it("should log error and throw for invalid peminjaman type", () => {
//         const type = "invalidType";
//         const mockLog = jest
//           .spyOn(console, "logWithTimestamp")
//           .mockImplementation();

//         expect(() => getModelByType(type, "peminjaman")).toThrow(
//           `Invalid type for peminjaman: ${type}`
//         );
//         expect(mockLog).toHaveBeenCalledWith("Error: Invalid peminjaman type");

//         mockLog.mockRestore();
//       });
//     });

//     describe("startRental", () => {
//       it("should handle invalid rental format and return 400", async () => {
//         const req = {
//           body: {
//             peminjamanId: "testId",
//             type: "cnc",
//           },
//         };
//         const res = {
//           status: jest.fn().mockReturnThis(),
//           json: jest.fn(),
//         };
//         const mockConsoleError = jest
//           .spyOn(console, "error")
//           .mockImplementation();

//         Cnc.findById.mockResolvedValue({
//           isStarted: false,
//           alamat_esp: "http://test-esp.local",
//           tanggal_peminjaman: "2024-11-03T00:00:00.000Z",
//           awal_peminjaman: "invalidTime",
//           akhir_peminjaman: "invalidTime",
//           save: jest.fn(),
//         });

//         await startRental(req, res);

//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({
//           message: "Invalid waktu peminjaman format.",
//         });
//         expect(mockConsoleError).toHaveBeenCalledWith(
//           "Invalid waktu peminjaman format detected"
//         );

//         mockConsoleError.mockRestore();
//       });

//       it("should clear shutdownTimeout if defined", () => {
//         let shutdownTimeout = setTimeout(() => {}, 10000);
//         const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

//         if (shutdownTimeout) {
//           clearTimeout(shutdownTimeout);
//         }

//         expect(clearTimeoutSpy).toHaveBeenCalledWith(shutdownTimeout);
//         clearTimeoutSpy.mockRestore();
//       });
//     });

//     describe("Relay and Timer Functions", () => {
//       it("should log error when turning off relay fails", async () => {
//         const mockConsoleError = jest
//           .spyOn(console, "error")
//           .mockImplementation();
//         const mockPeminjaman = {
//           alamat_esp: "http://test-esp.local",
//         };
//         axios.post.mockRejectedValue(new Error("Network Error"));

//         await turnOffRelay(mockPeminjaman);

//         expect(mockConsoleError).toHaveBeenCalledWith(
//           "Failed to turn off relay:",
//           expect.any(Error)
//         );

//         mockConsoleError.mockRestore();
//       });

//       it("should schedule shutdown and log shutdown time", async () => {
//         const shutdownTimeout = null;
//         const mockLogWithTimestamp = jest
//           .spyOn(console, "logWithTimestamp")
//           .mockImplementation();
//         const endTime = new Date(new Date().getTime() + 60000); // 1 min in future

//         scheduleShutdown(endTime);

//         expect(mockLogWithTimestamp).toHaveBeenCalledWith(
//           `Menjadwalkan mematikan relay dalam ${60000}ms (${endTime.toLocaleString()})`
//         );

//         mockLogWithTimestamp.mockRestore();
//       });
//     });

//     describe("Error Handling in getLatestData", () => {
//       it("should log and return 500 on error in getLatestData", async () => {
//         const req = { params: { type: "cnc" } };
//         const res = {
//           status: jest.fn().mockReturnThis(),
//           json: jest.fn(),
//         };
//         const mockConsoleError = jest
//           .spyOn(console, "error")
//           .mockImplementation();

//         CncSensor.findOne.mockRejectedValue(new Error("Database error"));

//         await getLatestData(req, res);

//         expect(res.status).toHaveBeenCalledWith(500);
//         expect(res.json).toHaveBeenCalledWith({
//           success: false,
//           message: "Error retrieving data",
//         });
//         expect(mockConsoleError).toHaveBeenCalledWith(
//           "Error retrieving data:",
//           expect.any(Error)
//         );

//         mockConsoleError.mockRestore();
//       });
//     });

//     // describe("Error Handling in getLatestCurrent", () => {
//     //   it("should log and return 500 on error in getLatestCurrent", async () => {
//     //     const req = { params: { type: "cnc" } };
//     //     const res = {
//     //       status: jest.fn().mockReturnThis(),
//     //       json: jest.fn(),
//     //     };
//     //     const mockConsoleError = jest
//     //       .spyOn(console, "error")
//     //       .mockImplementation();

//     //     CncSensor.findOne.mockRejectedValue(new Error("Database error"));

//     //     await getLatestCurrent(req, res);

//     //     expect(res.status).toHaveBeenCalledWith(500);
//     //     expect(res.json).toHaveBeenCalledWith({
//     //       success: false,
//     //       message: "Error retrieving current data",
//     //     });
//     //     expect(mockConsoleError).toHaveBeenCalledWith(
//     //       "[HTTP] Get latest current error:",
//     //       expect.any(Error)
//     //     );

//     //     mockConsoleError.mockRestore();
//     //   });
//     // });
//   });
// });

const axios = require("axios");

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn()
}));

const {
  startRental,
  buttonPeminjaman,
  getLatestData,
  updateCurrent,
  getLatestCurrent
} = require("../controllers/sensorController");

// Mock the models with all required methods
jest.mock("../models/peminjamanModel", () => ({
  Cnc: {
    findById: jest.fn(),
    save: jest.fn()
  },
  Laser: {
    findById: jest.fn(),
    save: jest.fn()
  },
  Printing: {
    findById: jest.fn(),
    save: jest.fn()
  }
}));

jest.mock("../models/sensorModel", () => ({
  CncSensor: {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn()
  },
  LaserSensor: {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn()
  },
  PrintingSensor: {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn()
  }
}));

// Mock logger
jest.mock("../config/logger", () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock websocket server
jest.mock("../config/websocketServer", () => ({
  getWebSocketServer: jest.fn(),
  broadcastCurrent: jest.fn()
}));

const { Cnc, Laser, Printing } = require("../models/peminjamanModel");
const { CncSensor, LaserSensor, PrintingSensor } = require("../models/sensorModel");

describe("Sensor Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startRental", () => {
    let req, res;

    beforeEach(() => {
      req = {
        body: {
          peminjamanId: "testId",
          type: "cnc"
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("should start rental successfully", async () => {
      const mockPeminjaman = {
        _id: "testId",
        isStarted: false,
        alamat_esp: "http://test-esp.local",
        tanggal_peminjaman: new Date().toISOString(),
        awal_peminjaman: "08:00 AM",
        akhir_peminjaman: "11:59 PM",
        save: jest.fn().mockResolvedValue(true)
      };

      Cnc.findById.mockResolvedValue(mockPeminjaman);
      axios.post.mockResolvedValue({ status: 201 });
      CncSensor.updateOne.mockResolvedValue({ nModified: 1 });

      await startRental(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Relay diaktifkan, peminjaman dimulai."
      });
    });

    test("should handle missing parameters", async () => {
      req.body = {};
      await startRental(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "peminjamanId dan type harus disediakan."
      });
    });

    test("should handle peminjaman not found", async () => {
      Cnc.findById.mockResolvedValue(null);
      await startRental(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Peminjaman tidak ditemukan."
      });
    });
  });

  describe("buttonPeminjaman", () => {
    test("should create button status successfully", async () => {
      const req = {
        params: { type: "cnc" },
        body: { button: true, buzzer: false }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 201
      };

      const mockSensorData = {
        button: true,
        buzzerStatus: false,
        waktu: new Date()
      };

      CncSensor.create.mockResolvedValue(mockSensorData);

      await buttonPeminjaman(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 201,
        message: "Terunggah",
        data: mockSensorData
      });
    });
  });

  describe("getLatestData", () => {
    test("should return latest data successfully", async () => {
      const req = { params: { type: "cnc" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200
      };

      const mockData = {
        button: true,
        current: 10,
        buzzerStatus: false,
        waktu: new Date()
      };

      CncSensor.findOne.mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(mockData)
      }));

      await getLatestData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: expect.any(Object)
      });
    });

    test("should handle no data found", async () => {
      const req = { params: { type: "cnc" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      CncSensor.findOne.mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(null)
      }));

      await getLatestData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No data found"
      });
    });
  });

  describe("getLatestCurrent", () => {
    test("should return latest current successfully", async () => {
      const req = { params: { type: "cnc" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200
      };

      const mockCurrentData = {
        current: 10,
        waktu: new Date()
      };

      CncSensor.findOne.mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(mockCurrentData)
      }));

      await getLatestCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: expect.objectContaining({
          current: mockCurrentData.current,
          waktu: mockCurrentData.waktu
        })
      });
    });

    test("should handle no current data found", async () => {
      const req = { params: { type: "cnc" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      CncSensor.findOne.mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(null)
      }));

      await getLatestCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No current data found"
      });
    });

    test("should handle database error", async () => {
      const req = { params: { type: "cnc" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      CncSensor.findOne.mockImplementation(() => ({
        sort: jest.fn().mockRejectedValue(new Error("Database error"))
      }));

      await getLatestCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error retrieving current data"
      });

      consoleSpy.mockRestore();
    });
  });
});