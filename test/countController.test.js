// test/countController.test.js

/**
 * Import dependencies dan models yang diperlukan
 */
const { getAndUpdateCounts } = require("../controllers/countController");
const Count = require("../models/countModel");
const { Cnc, Laser, Printing } = require("../models/peminjamanModel");
const { updateExpiredPeminjaman } = require("../controllers/userController");

/**
 * Setup mocks untuk semua dependencies
 */
jest.mock("../models/countModel");
jest.mock("../models/peminjamanModel", () => ({
  Cnc: {
    countDocuments: jest.fn(),
  },
  Laser: {
    countDocuments: jest.fn(),
  },
  Printing: {
    countDocuments: jest.fn(),
  },
}));
jest.mock("../controllers/userController", () => ({
  updateExpiredPeminjaman: jest.fn(),
}));

describe("Count Controller Tests", () => {
  // Mock untuk response object
  let mockRes;

  beforeEach(() => {
    // Reset semua mocks sebelum setiap test
    jest.clearAllMocks();

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Spy pada console.log dan console.error
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  /**
   * Test Case 1: Sukses mendapatkan dan memperbarui counts
   * Use Case: Admin mengambil data hitungan peminjaman dan berhasil
   */
  it("should successfully get and update counts", async () => {
    // Setup mock returns
    updateExpiredPeminjaman.mockResolvedValue(true);

    // Mock count untuk setiap status dan mesin
    Cnc.countDocuments.mockImplementation((query) => {
      if (query.status === "Disetujui") return Promise.resolve(5);
      if (query.status === "Ditolak") return Promise.resolve(3);
      if (query.status === "Menunggu") return Promise.resolve(2);
    });

    Laser.countDocuments.mockImplementation((query) => {
      if (query.status === "Disetujui") return Promise.resolve(4);
      if (query.status === "Ditolak") return Promise.resolve(2);
      if (query.status === "Menunggu") return Promise.resolve(1);
    });

    Printing.countDocuments.mockImplementation((query) => {
      if (query.status === "Disetujui") return Promise.resolve(3);
      if (query.status === "Ditolak") return Promise.resolve(1);
      if (query.status === "Menunggu") return Promise.resolve(2);
    });

    // Mock untuk Count.findOneAndUpdate
    const mockUpdatedCount = {
      disetujui_cnc: 5,
      ditolak_cnc: 3,
      menunggu_cnc: 2,
      disetujui_laser: 4,
      ditolak_laser: 2,
      menunggu_laser: 1,
      disetujui_printing: 3,
      ditolak_printing: 1,
      menunggu_printing: 2,
      toObject: () => ({
        disetujui_cnc: 5,
        ditolak_cnc: 3,
        menunggu_cnc: 2,
        disetujui_laser: 4,
        ditolak_laser: 2,
        menunggu_laser: 1,
        disetujui_printing: 3,
        ditolak_printing: 1,
        menunggu_printing: 2,
      }),
    };

    Count.findOneAndUpdate.mockResolvedValue(mockUpdatedCount);

    // Execute
    await getAndUpdateCounts(null, mockRes);

    // Verify
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "Data count berhasil diperbarui",
      data: expect.objectContaining({
        disetujui_cnc: 5,
        ditolak_cnc: 3,
        menunggu_cnc: 2,
      }),
    });
  });

  /**
   * Test Case 2: Error saat mengambil count
   * Use Case: Terjadi error saat mengakses database
   */
  it("should handle errors when getting counts", async () => {
    // Setup mock untuk throw error
    Cnc.countDocuments.mockRejectedValue(new Error("Database error"));

    // Execute
    await getAndUpdateCounts(null, mockRes);

    // Verify
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Server Error",
      error: "Database error",
      data: null,
    });
  });

  /**
   * Test Case 3: Fungsi berjalan tanpa response object
   * Use Case: Fungsi dipanggil dari background job
   */
  it("should work without response object", async () => {
    // Setup mocks
    updateExpiredPeminjaman.mockResolvedValue(true);

    const mockCounts = {
      disetujui_cnc: 1,
      ditolak_cnc: 1,
      menunggu_cnc: 1,
      toObject: () => ({
        disetujui_cnc: 1,
        ditolak_cnc: 1,
        menunggu_cnc: 1,
      }),
    };

    Count.findOneAndUpdate.mockResolvedValue(mockCounts);
    Cnc.countDocuments.mockResolvedValue(1);
    Laser.countDocuments.mockResolvedValue(1);
    Printing.countDocuments.mockResolvedValue(1);

    // Execute
    const result = await getAndUpdateCounts();

    // Verify
    expect(result).toEqual({
      success: true,
      message: "Data count berhasil diperbarui",
      data: expect.any(Object),
    });
  });

  /**
   * Test Case 4: Error saat update expired peminjaman
   * Use Case: Terjadi error saat memperbarui peminjaman kadaluarsa
   * Ekspektasi: Mengembalikan error 500 karena ada kegagalan proses
   */
  it("should handle error when updateExpiredPeminjaman fails", async () => {
    // Setup mock untuk throw error pada updateExpiredPeminjaman
    updateExpiredPeminjaman.mockRejectedValue(new Error("Update failed"));

    // Execute
    await getAndUpdateCounts(null, mockRes);

    // Verify response error 500
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Server Error",
      error: "Update failed",
      data: null,
    });

    // Verify error logging
    expect(console.error).toHaveBeenCalled();
  });

  /**
   * Test Case 5: Berhasil mendapatkan count meski ada error pada expired peminjaman
   * Use Case: Update expired gagal tapi proses count tetap berjalan
   */
  it("should get counts successfully even with updateExpiredPeminjaman warning", async () => {
    // Setup mock returns
    updateExpiredPeminjaman.mockResolvedValue(false); // Tidak ada yang diupdate

    const mockCounts = {
      toObject: () => ({
        disetujui_cnc: 1,
        ditolak_cnc: 1,
        menunggu_cnc: 1,
      }),
    };

    // Setup successful counts
    Count.findOneAndUpdate.mockResolvedValue(mockCounts);
    Cnc.countDocuments.mockResolvedValue(1);
    Laser.countDocuments.mockResolvedValue(1);
    Printing.countDocuments.mockResolvedValue(1);

    // Execute
    await getAndUpdateCounts(null, mockRes);

    // Verify success response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Data count berhasil diperbarui",
        data: expect.any(Object),
      })
    );

    // Verify logging
    expect(console.log).toHaveBeenCalledWith(
      "Update expired peminjaman: Tidak ada peminjaman yang kadaluarsa"
    );
  });
  /**
   * Test Case 6: Error handling tanpa response object
   * Use Case: Error terjadi saat dipanggil sebagai background job
   */
  it("should handle errors without response object", async () => {
    // Setup error scenario
    const testError = new Error("Test error");
    Cnc.countDocuments.mockRejectedValue(testError);

    // Execute tanpa response object
    const result = await getAndUpdateCounts();

    // Verify error response object
    expect(result).toEqual({
      success: false,
      message: "Server Error",
      error: "Test error",
      data: null,
    });

    // Verify logging
    expect(console.error).toHaveBeenCalledWith(
      "Error dalam getAndUpdateCounts:",
      testError
    );
    expect(console.log).toHaveBeenCalledWith(
      "Sending error response:",
      JSON.stringify({
        success: false,
        message: "Server Error",
        error: "Test error",
        data: null,
      })
    );
  });

  /**
   * Test Case 7: Error handling untuk updateExpiredPeminjaman tanpa response object
   * Use Case: Error pada update expired peminjaman saat dipanggil sebagai background job
   */
  it("should handle updateExpiredPeminjaman error without response object", async () => {
    // Setup error pada updateExpiredPeminjaman
    const updateError = new Error("Update expired error");
    updateExpiredPeminjaman.mockRejectedValue(updateError);

    // Execute tanpa response object
    const result = await getAndUpdateCounts();

    // Verify error response
    expect(result).toEqual({
      success: false,
      message: "Server Error",
      error: "Update expired error",
      data: null,
    });

    // Verify error logging
    expect(console.error).toHaveBeenCalledWith(
      "Error saat update expired peminjaman:",
      updateError
    );
    expect(console.log).toHaveBeenCalledWith(
      "Sending error response:",
      JSON.stringify({
        success: false,
        message: "Server Error",
        error: "Update expired error",
        data: null,
      })
    );
  });
});
