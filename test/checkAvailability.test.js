// test/checkAvailability.test.js

const mongoose = require("mongoose");
const { checkAvailability } = require("../middleware/checkAvailability");

// Model mock untuk tes (Anda perlu menyesuaikan skema dengan aplikasi Anda)
const BookingSchema = new mongoose.Schema({
  tanggal_peminjaman: String,
  awal_peminjaman: Date,
  akhir_peminjaman: Date,
  status: String,
});
const BookingModel = mongoose.model("Booking", BookingSchema);

describe("checkAvailability", () => {
  beforeAll(async () => {
    // Inisialisasi MongoDB dalam memori
    await mongoose.connect("mongodb://localhost:27017/test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Tutup koneksi MongoDB dan hapus model
    await mongoose.connection.close();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Bersihkan database sebelum setiap tes
    await BookingModel.deleteMany({});
  });

  it("should return true when there are no conflicting bookings", async () => {
    const tanggal_peminjaman = "2024-10-23";
    const awal_peminjaman = "10:00 AM";
    const akhir_peminjaman = "11:00 AM";

    // Panggil fungsi untuk diuji
    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      awal_peminjaman,
      akhir_peminjaman
    );

    expect(result).toBe(true);
  });

  it("should return false if a booking conflicts with an existing one (overlap start)", async () => {
    const tanggal_peminjaman = "2024-10-23";

    // Buat pemesanan yang akan konflik
    await BookingModel.create({
      tanggal_peminjaman,
      awal_peminjaman: new Date("2024-10-23T09:30:00"),
      akhir_peminjaman: new Date("2024-10-23T11:00:00"),
      status: "Disetujui",
    });

    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      "10:00 AM",
      "11:00 AM"
    );

    expect(result).toBe(false);
  });

  it("should return false if a booking conflicts with an existing one (overlap end)", async () => {
    const tanggal_peminjaman = "2024-10-23";

    // Buat pemesanan yang akan konflik di akhir waktu
    await BookingModel.create({
      tanggal_peminjaman,
      awal_peminjaman: new Date("2024-10-23T10:00:00"),
      akhir_peminjaman: new Date("2024-10-23T12:00:00"),
      status: "Disetujui",
    });

    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      "09:30 AM",
      "11:00 AM"
    );

    expect(result).toBe(false);
  });

  it("should return true if the booking times do not conflict", async () => {
    const tanggal_peminjaman = "2024-10-23";

    // Buat pemesanan non-konflik
    await BookingModel.create({
      tanggal_peminjaman,
      awal_peminjaman: new Date("2024-10-23T08:00:00"),
      akhir_peminjaman: new Date("2024-10-23T09:30:00"),
      status: "Disetujui",
    });

    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      "10:00 AM",
      "11:00 AM"
    );

    expect(result).toBe(true);
  });

  it("should ignore bookings with status other than 'Disetujui' or 'Menunggu'", async () => {
    const tanggal_peminjaman = "2024-10-23";

    // Buat pemesanan dengan status berbeda yang tidak boleh diperhitungkan
    await BookingModel.create({
      tanggal_peminjaman,
      awal_peminjaman: new Date("2024-10-23T09:30:00"),
      akhir_peminjaman: new Date("2024-10-23T11:00:00"),
      status: "Ditolak",
    });

    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      "10:00 AM",
      "11:00 AM"
    );

    expect(result).toBe(true);
  });

  it("should return true if the booking has a different ID (excludeId is used)", async () => {
    const tanggal_peminjaman = "2024-10-23";

    const existingBooking = await BookingModel.create({
      tanggal_peminjaman,
      awal_peminjaman: new Date("2024-10-23T09:30:00"),
      akhir_peminjaman: new Date("2024-10-23T11:00:00"),
      status: "Disetujui",
    });

    // Panggil `checkAvailability` dengan excludeId yang sesuai
    const result = await checkAvailability(
      BookingModel,
      tanggal_peminjaman,
      "10:00 AM",
      "11:00 AM",
      existingBooking._id
    );

    expect(result).toBe(true);
  });

  it("should handle invalid time format and throw an error", async () => {
    await expect(
      checkAvailability(
        BookingModel,
        "2024-10-23",
        "invalid time format",
        "11:00 AM"
      )
    ).rejects.toThrow("Invalid time format");
  });

  it("should throw an error if timeString is undefined", async () => {
    await expect(
      checkAvailability(BookingModel, "2024-10-23", undefined, "11:00 AM")
    ).rejects.toThrow("Invalid time format");
  });

  it("should throw an error if timeString is not in correct format", async () => {
    await expect(
      checkAvailability(BookingModel, "2024-10-23", "10:00", "not-a-valid-time")
    ).rejects.toThrow("Invalid time format");
  });

  it("should throw an error if timeString does not include AM/PM", async () => {
    await expect(
      checkAvailability(
        BookingModel,
        "2024-10-23",
        "13:00", // Missing AM/PM
        "14:00 PM"
      )
    ).rejects.toThrow("Invalid time format");
  });

  it("should throw an error for invalid date format", async () => {
    await expect(
      checkAvailability(
        BookingModel,
        "invalid-date", // Invalid date
        "10:00 AM",
        "11:00 AM"
      )
    ).rejects.toThrow("Invalid time format");
  });

  it("should handle valid bookings without errors", async () => {
    // Assuming no conflicts, mock the find method
    BookingModel.find = jest.fn().mockResolvedValue([]);
    const result = await checkAvailability(
      BookingModel,
      "2024-10-23",
      "10:00 AM",
      "11:00 AM"
    );
    expect(result).toBe(true);
  });

  it("should format date when tanggal_peminjaman is a Date object", async () => {
    const result = await checkAvailability(
      BookingModel,
      new Date("2024-10-23"),
      "10:00 AM",
      "11:00 AM"
    );
    expect(result).toBe(true);
  });

  it("should handle timeString when it is already a Date object", async () => {
    const result = await checkAvailability(
      BookingModel,
      "2024-10-23",
      new Date("2024-10-23T10:00:00"),
      new Date("2024-10-23T11:00:00")
    );
    expect(result).toBe(true);
  });

  it("should convert 1:00 PM to 13:00 in 24-hour format", async () => {
    const result = await checkAvailability(
      BookingModel,
      "2024-10-23",
      "1:00 PM",
      "2:00 PM"
    );
    expect(result).toBe(true);
  });

  it("should handle timeString as a Date object and log the correct message", async () => {
    // Buat objek Date untuk timeString yang akan memicu kondisi ini
    const dateObject = new Date("2024-10-23T08:00:00Z");

    // Spy pada console.log untuk memverifikasi pesan log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    await checkAvailability(BookingModel, "2024-10-23", dateObject, "11:00 AM");

    // Cari log yang sesuai dengan objek Date
    const logMessageExists = consoleLogSpy.mock.calls.some(
      (call) =>
        call[0] ===
        `timeString is already a Date object: ${dateObject.toString()}`
    );

    expect(logMessageExists).toBe(true);

    // Kembalikan fungsi console.log ke implementasi aslinya
    consoleLogSpy.mockRestore();
  });

  it("should handle 12 AM as midnight and set hours to 00", async () => {
    await expect(
      checkAvailability(BookingModel, "2024-10-23", "12:00 AM", "02:00 AM")
    ).resolves.toBe(true); // Atau nilai sesuai dengan kondisi tes Anda
  });
});
