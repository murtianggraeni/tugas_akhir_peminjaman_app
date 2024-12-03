// test/peminjamanModel.test.js
const mongoose = require("mongoose");
const { Cnc, Laser, Printing } = require("../models/peminjamanModel");

describe("Peminjaman Model Tests", () => {
  // Setup sebelum semua test
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect("mongodb://127.0.0.1:27017/test_peminjaman", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Cleanup setelah semua test
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  // Setup sebelum setiap test
  beforeEach(async () => {
    await Cnc.deleteMany({});
    await Laser.deleteMany({});
    await Printing.deleteMany({});
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  describe("Schema Getters and Setters", () => {
    // Test untuk tanggal_peminjaman getter (line 24-35)
    describe("tanggal_peminjaman getter", () => {
      it("should format date correctly", () => {
        const cnc = new Cnc({
          tanggal_peminjaman: new Date("2024-02-14"),
        });
        expect(cnc.tanggal_peminjaman).toMatch(
          /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/
        );
      });

      it("should return null for undefined date", () => {
        const cnc = new Cnc({});
        expect(cnc.tanggal_peminjaman).toBeNull();
      });
    });

    // Test untuk awal_peminjaman setter dan getter (lines 36-57)
    describe("awal_peminjaman setter and getter", () => {
      it("should handle Date object input", () => {
        const testDate = new Date("2024-02-14T09:00:00");
        const cnc = new Cnc({
          awal_peminjaman: testDate,
          jumlah: 1,
        });
        expect(typeof cnc.awal_peminjaman).toBe("string");
        expect(cnc.awal_peminjaman).toMatch(/^9:00:00/i);
      });

      it("should handle AM time string input", () => {
        const cnc = new Cnc({
          awal_peminjaman: "9:00 AM",
          jumlah: 1,
        });
        const time = cnc.awal_peminjaman;
        expect(time).toMatch(/^9:00:00 am$/i);
      });

      it("should handle PM time string input", () => {
        const cnc = new Cnc({
          awal_peminjaman: "2:00 PM",
          jumlah: 1,
        });
        const time = cnc.awal_peminjaman;
        expect(time).toMatch(/^2:00:00 pm$/i);
      });

      it("should handle 12 AM correctly", () => {
        const today = new Date();
        const cnc = new Cnc({
          awal_peminjaman: "12:00 AM",
          tanggal_peminjaman: today,
          jumlah: 1,
        });
        const timeStr = cnc.awal_peminjaman;
        expect(timeStr).toMatch(/^12:00:00 am$/i);
      });

      it("should handle 12 PM correctly", () => {
        const today = new Date();
        const cnc = new Cnc({
          awal_peminjaman: "12:00 PM",
          tanggal_peminjaman: today,
          jumlah: 1,
        });
        const timeStr = cnc.awal_peminjaman;
        expect(timeStr).toMatch(/^12:00:00 pm$/i);
      });

      it("should handle null value", () => {
        const cnc = new Cnc({
          jumlah: 1,
          awal_peminjaman: null,
        });
        expect(cnc.awal_peminjaman).toBeNull();
      });

      it("should handle undefined value", () => {
        const cnc = new Cnc({
          jumlah: 1,
          awal_peminjaman: undefined,
        });
        expect(cnc.awal_peminjaman).toBeNull();
      });

      it("should handle invalid type by returning null", () => {
        const cnc = new Cnc({
          jumlah: 1,
          awal_peminjaman: 123, // number instead of string or Date
        });
        expect(cnc.awal_peminjaman).toBeNull();
      });

      it("should convert '12:00 AM' to 00:00 (midnight) in 24-hour format", () => {
        const cnc = new Cnc({
          awal_peminjaman: "12:00 AM",
          jumlah: 1,
        });
        expect(cnc.awal_peminjaman).toMatch(/^0:00:00 am$/i);
      });
    });

    // Test untuk akhir_peminjaman setter dan getter (lines 58-79)
    describe("akhir_peminjaman setter and getter", () => {
      it("should handle Date object input", () => {
        const testDate = new Date("2024-02-14T17:00:00");
        const cnc = new Cnc({
          akhir_peminjaman: testDate,
          jumlah: 1,
        });
        expect(typeof cnc.akhir_peminjaman).toBe("string");
        expect(cnc.akhir_peminjaman).toMatch(/^5:00:00/i);
      });

      it("should handle time string input", () => {
        const cnc = new Cnc({
          akhir_peminjaman: "5:00 PM",
          jumlah: 1,
        });
        const time = cnc.akhir_peminjaman;
        expect(time).toMatch(/^5:00:00 pm$/i);
      });
      it("should handle null value", () => {
        const cnc = new Cnc({
          jumlah: 1,
          akhir_peminjaman: null,
        });
        expect(cnc.akhir_peminjaman).toBeNull();
      });

      it("should handle undefined value", () => {
        const cnc = new Cnc({
          jumlah: 1,
          akhir_peminjaman: undefined,
        });
        expect(cnc.akhir_peminjaman).toBeNull();
      });

      it("should handle invalid type", () => {
        const cnc = new Cnc({
          jumlah: 1,
          akhir_peminjaman: 123, // number instead of string or Date
        });
        expect(cnc.akhir_peminjaman).not.toBeNull(); // should return the value as is
      });
    });

    // Test untuk required fields dan validasi (lines 80-183)
    describe("Schema Validation", () => {
      it("should require jumlah field", async () => {
        const cnc = new Cnc({});
        let error;
        try {
          await cnc.validate();
        } catch (e) {
          error = e;
        }
        expect(error.errors.jumlah).toBeDefined();
      });

      it("should save successfully with all required fields", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Ensure it’s in the future

        const validCnc = new Cnc({
          nama_mesin: "CNC Test",
          jumlah: 1,
          email: "test@example.com",
          nama_pemohon: "Test User",
          tanggal_peminjaman: futureDate,
          awal_peminjaman: "9:00 AM",
          akhir_peminjaman: "10:00 AM",
          program_studi: "Test Program",
          kategori: "Test Category",
          status: "Menunggu",
        });

        const savedCnc = await validCnc.save();
        expect(savedCnc._id).toBeDefined();
        expect(savedCnc.status).toBe("Menunggu");
      });
    });
  });

  describe("Basic Schema Validation", () => {
    it("should validate required fields", async () => {
      const cnc = new Cnc({});
      let error;

      try {
        await cnc.validate();
      } catch (e) {
        error = e;
      }

      expect(error.errors.jumlah).toBeDefined();
    });

    it("should accept valid data", async () => {
      const validData = {
        nama_mesin: "CNC-001",
        alamat_esp: "http://192.168.1.1",
        email: "test@example.com",
        nama_pemohon: "John Doe",
        jumlah: 1,
        jurusan: "Teknik Mesin",
        program_studi: "D3",
        kategori: "Mahasiswa",
        detail_keperluan: "Project Akhir",
        desain_benda: "Part-A",
        status: "Menunggu",
      };

      const cnc = new Cnc(validData);
      const saved = await cnc.save();
      expect(saved._id).toBeDefined();
      expect(saved.nama_mesin).toBe(validData.nama_mesin);
    });
  });

  describe("Date and Time Handling", () => {
    describe("tanggal_peminjaman", () => {
      it("should format date correctly", () => {
        const date = new Date("2024-02-14");
        const cnc = new Cnc({
          tanggal_peminjaman: date,
          jumlah: 1,
        });

        expect(cnc.tanggal_peminjaman).toBe("Wed, 14 Feb 2024");
      });

      it("should handle null date", () => {
        const cnc = new Cnc({ jumlah: 1 });
        expect(cnc.tanggal_peminjaman).toBeNull();
      });

      it("should handle invalid date", () => {
        const cnc = new Cnc({
          tanggal_peminjaman: "invalid date",
          jumlah: 1,
        });
        expect(cnc.tanggal_peminjaman).toBeNull();
      });
    });

    describe("awal_peminjaman", () => {
      const testCases = [
        { input: "9:00 AM", expected: "9:00:00 am" },
        { input: "2:30 PM", expected: "2:30:00 pm" },
        { input: "12:00 AM", expected: "12:00:00 am" },
        { input: "12:00 PM", expected: "12:00:00 pm" },
        { input: "11:59 PM", expected: "11:59:00 pm" },
      ];

      testCases.forEach(({ input, expected }) => {
        it(`should handle ${input} correctly`, () => {
          const cnc = new Cnc({
            awal_peminjaman: input,
            jumlah: 1,
          });
          expect(cnc.awal_peminjaman.toLowerCase()).toBe(expected);
        });
      });

      it("should handle Date object input", () => {
        const date = new Date();
        date.setHours(14, 30, 0);
        const cnc = new Cnc({
          awal_peminjaman: date,
          jumlah: 1,
        });
        expect(cnc.awal_peminjaman.toLowerCase()).toMatch(/^2:30:00 pm$/);
      });

      it("should handle null value", () => {
        const cnc = new Cnc({ jumlah: 1 });
        expect(cnc.awal_peminjaman).toBeNull();
      });
    });

    describe("akhir_peminjaman", () => {
      const testCases = [
        { input: "10:00 AM", expected: "10:00:00 am" },
        { input: "3:30 PM", expected: "3:30:00 pm" },
        { input: "12:00 AM", expected: "12:00:00 am" },
        { input: "12:00 PM", expected: "12:00:00 pm" },
      ];

      testCases.forEach(({ input, expected }) => {
        it(`should handle ${input} correctly`, () => {
          const cnc = new Cnc({
            akhir_peminjaman: input,
            jumlah: 1,
          });
          expect(cnc.akhir_peminjaman.toLowerCase()).toBe(expected);
        });
      });

      it("should handle Date object input", () => {
        const date = new Date();
        date.setHours(15, 30, 0);
        const cnc = new Cnc({
          akhir_peminjaman: date,
          jumlah: 1,
        });
        expect(cnc.akhir_peminjaman.toLowerCase()).toMatch(/^3:30:00 pm$/);
      });
    });
  });

  describe("Status and Validation Rules", () => {
    describe("Auto Rejection Rules", () => {
      it("should reject when start time has passed", async () => {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 2);

        const cnc = new Cnc({
          nama_mesin: "CNC-001",
          jumlah: 1,
          tanggal_peminjaman: pastDate,
          awal_peminjaman: pastDate.toLocaleTimeString("en-GB", {
            hour12: true,
            timeZone: "Asia/Jakarta",
          }),
          status: "Menunggu",
        });

        await cnc.save();
        expect(cnc.status).toBe("Ditolak");
        expect(cnc.alasan).toMatch(/melebihi batas awal peminjaman/);
      });

      it("should not reject future peminjaman", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const cnc = new Cnc({
          nama_mesin: "CNC-001",
          jumlah: 1,
          tanggal_peminjaman: futureDate,
          awal_peminjaman: "9:00 AM",
          status: "Menunggu",
        });

        await cnc.save();
        expect(cnc.status).toBe("Menunggu");
        expect(cnc.alasan).toBeUndefined();
      });
    });

    describe("Status Update Rules", () => {
      it("should handle status transition from Menunggu to Diproses", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const cnc = await Cnc.create({
          nama_mesin: "CNC-001",
          jumlah: 1,
          tanggal_peminjaman: futureDate,
          awal_peminjaman: "9:00 AM",
          status: "Menunggu",
        });

        const updated = await Cnc.findByIdAndUpdate(
          cnc._id,
          { status: "Diproses" },
          { new: true, runValidators: true }
        );

        expect(updated.status).toBe("Diproses");
      });

      it("should handle status transition to Ditolak with alasan", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const cnc = await Cnc.create({
          nama_mesin: "CNC-001",
          jumlah: 1,
          status: "Menunggu",
          tanggal_peminjaman: futureDate,
          awal_peminjaman: "9:00 AM", // Tambahkan waktu awal_peminjaman
        });

        const updated = await Cnc.findByIdAndUpdate(
          cnc._id,
          {
            status: "Ditolak",
            alasan: "Mesin dalam perbaikan",
          },
          { new: true }
        );

        expect(updated.status).toBe("Ditolak");
        expect(updated.alasan).toBe("Mesin dalam perbaikan");
      });
    });
  });

  describe("Extended Features", () => {
    describe("Extension Count Handling", () => {
      it("should initialize extended_count as 0", async () => {
        const cnc = new Cnc({ jumlah: 1 });
        expect(cnc.extended_count).toBe(0);
      });

      it("should increment extended_count", async () => {
        const cnc = await Cnc.create({ jumlah: 1 });
        cnc.extended_count += 1;
        await cnc.save();
        expect(cnc.extended_count).toBe(1);
      });
    });

    describe("isStarted Flag", () => {
      it("should initialize isStarted as false", async () => {
        const cnc = new Cnc({ jumlah: 1 });
        expect(cnc.isStarted).toBe(false);
      });

      it("should allow updating isStarted flag", async () => {
        const cnc = await Cnc.create({ jumlah: 1 });
        cnc.isStarted = true;
        await cnc.save();
        expect(cnc.isStarted).toBe(true);
      });
    });

    describe("User Reference", () => {
      it("should accept valid ObjectId for user reference", async () => {
        const userId = new mongoose.Types.ObjectId();
        const cnc = new Cnc({
          jumlah: 1,
          user: userId,
        });
        await expect(cnc.save()).resolves.toBeDefined();
        expect(cnc.user).toEqual(userId);
      });
    });
  });

  // Test untuk findOneAndUpdate hook (lines 247-259)
  describe("FindOneAndUpdate Pre-Hook", () => {
    // Mock untuk Mongoose Query prototype
    let originalSet;
    let mockSet;

    beforeEach(() => {
      // Setup mock untuk Query.prototype.set
      originalSet = mongoose.Query.prototype.set;
      mockSet = jest.fn(function () {
        return this;
      });
      mongoose.Query.prototype.set = mockSet;
    });

    afterEach(() => {
      // Restore original set method
      mongoose.Query.prototype.set = originalSet;
    });

    describe("Initial Document Checks", () => {
      it("should get correct document using this.model.findOne(this.getQuery())", async () => {
        // Buat dokumen dengan status Menunggu
        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: new Date(),
          awal_peminjaman: "14:00",
          status: "Menunggu",
        });

        // Mock untuk model.findOne
        const findOneSpy = jest.spyOn(Cnc, "findOne");

        // Lakukan update
        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { detail_keperluan: "Test" }
        );

        // Verifikasi bahwa findOne dipanggil dengan query yang benar
        expect(findOneSpy).toHaveBeenCalledWith({ _id: doc._id });
        findOneSpy.mockRestore();
      });
    });

    describe("Hours and Minutes Check in findOneAndUpdate Hook", () => {
      it("should skip status update if `awal_peminjaman` is missing minutes", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: futureDate,
          awal_peminjaman: "14:", // Missing minutes
          status: "Menunggu",
        });

        const setSpy = jest.spyOn(mongoose.Query.prototype, "set");
        const logSpy = jest.spyOn(console, "log").mockImplementation();

        // Attempt to update, which should skip due to missing minutes
        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { status: "Diproses" }
        ).exec();

        expect(setSpy).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("Skipping status update for document ID")
        );

        setSpy.mockRestore();
        logSpy.mockRestore();
      });

      it("should skip status update if `awal_peminjaman` is missing hours", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: futureDate,
          awal_peminjaman: ":30", // Missing hours
          status: "Menunggu",
        });

        const setSpy = jest.spyOn(mongoose.Query.prototype, "set");
        const logSpy = jest.spyOn(console, "log").mockImplementation();

        // Attempt to update, which should skip due to missing hours
        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { status: "Diproses" }
        ).exec();

        expect(setSpy).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("Skipping status update for document ID")
        );

        setSpy.mockRestore();
        logSpy.mockRestore();
      });
    });

    // describe("Time Check Conditions", () => {
    //   describe("Time Setting Tests", () => {
    //     it("should handle 12 AM conversion to 0 hours", () => {
    //       const cnc = new Cnc({
    //         jumlah: 1,
    //         awal_peminjaman: "12:00 AM",
    //       });

    //       const time = new Date(cnc.awal_peminjaman);
    //       expect(time.getHours()).toBe(0);
    //     });

    //     it("should handle invalid type by returning null", () => {
    //       const cnc = new Cnc({
    //         jumlah: 1,
    //         awal_peminjaman: 123,
    //       });
    //       expect(cnc.awal_peminjaman).toBeNull(); // Sesuaikan dengan behavior yang diinginkan
    //     });

    //     it("should save with Menunggu status for future date", async () => {
    //       const futureDate = new Date();
    //       futureDate.setDate(futureDate.getDate() + 1);

    //       const validCnc = new Cnc({
    //         nama_mesin: "CNC Test",
    //         jumlah: 1,
    //         email: "test@example.com",
    //         nama_pemohon: "Test User",
    //         tanggal_peminjaman: futureDate,
    //         awal_peminjaman: "10:00 AM", // Pastikan waktu di masa depan
    //         akhir_peminjaman: "11:00 AM",
    //         program_studi: "Test Program",
    //         kategori: "Test Category",
    //         status: "Menunggu",
    //       });

    //       const savedCnc = await validCnc.save();
    //       expect(savedCnc.status).toBe("Menunggu");
    //     });
    //   });
    // });

    describe("Update and Logging", () => {
      let consoleLogSpy;

      beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      });

      afterEach(() => {
        consoleLogSpy.mockRestore();
      });

      it("should set status and log in single operation", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Date in the past
        pastDate.setHours(8, 0); // Set specific time in the past for `awal_peminjaman`

        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: pastDate,
          awal_peminjaman: "8:00 AM", // Ensure time is formatted correctly and in the past
          status: "Menunggu",
        });

        const operations = [];

        // Spy on mongoose Query.prototype.set
        const setSpy = jest
          .spyOn(mongoose.Query.prototype, "set")
          .mockImplementation(function (updates) {
            if (updates && updates.status === "Ditolak") {
              operations.push("set");
            }
            return this;
          });

        // Spy on console.log
        const logSpy = jest
          .spyOn(console, "log")
          .mockImplementation((message) => {
            if (message.includes("ditolak otomatis saat update")) {
              operations.push("log");
            }
          });

        // Trigger the update
        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { status: "Diproses" }
        ).exec();

        // Add a delay to ensure async operations complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check that the operations occurred in order
        expect(operations).toEqual(["set", "log"]);

        // Cleanup
        setSpy.mockRestore();
        logSpy.mockRestore();
      });

      it("should maintain atomic operation between set and log", async () => {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 2);

        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: pastDate,
          awal_peminjaman: `${pastDate
            .getHours()
            .toString()
            .padStart(2, "0")}:${pastDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
          status: "Menunggu",
        });

        const operations = [];
        let setExecutionTime, logExecutionTime;

        // Spy on set method
        const setSpy = jest
          .spyOn(mongoose.Query.prototype, "set")
          .mockImplementation(function (updates) {
            if (updates && updates.status === "Ditolak") {
              setExecutionTime = Date.now();
              operations.push("set");
            }
            return this;
          });

        // Spy on console.log
        const logSpy = jest
          .spyOn(console, "log")
          .mockImplementation((message) => {
            if (message.includes("ditolak otomatis saat update")) {
              logExecutionTime = Date.now();
              operations.push("log");
            }
          });

        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { status: "Diproses" }
        ).exec();

        // Add small delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify operations
        expect(operations).toEqual(["set", "log"]);
        expect(logExecutionTime).toBeGreaterThanOrEqual(setExecutionTime);

        // Cleanup
        setSpy.mockRestore();
        logSpy.mockRestore();
      });

      it("should execute operations in correct sequence", async () => {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 2);

        const doc = await Cnc.create({
          nama_mesin: "CNC Test",
          jumlah: 1,
          tanggal_peminjaman: pastDate,
          awal_peminjaman: `${pastDate
            .getHours()
            .toString()
            .padStart(2, "0")}:${pastDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
          status: "Menunggu",
        });

        const operations = [];
        let setPromiseResolved = false;

        // Mock set operation with Promise
        const setSpy = jest
          .spyOn(mongoose.Query.prototype, "set")
          .mockImplementation(function (updates) {
            return new Promise((resolve) => {
              if (updates && updates.status === "Ditolak") {
                operations.push("set");
                setPromiseResolved = true;
              }
              resolve(this);
            });
          });

        // Mock log operation
        const logSpy = jest
          .spyOn(console, "log")
          .mockImplementation((message) => {
            if (message.includes("ditolak otomatis saat update")) {
              expect(setPromiseResolved).toBe(true); // Verify set was called first
              operations.push("log");
            }
          });

        await Cnc.findOneAndUpdate(
          { _id: doc._id },
          { status: "Diproses" }
        ).exec();

        // Add delay for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(operations).toEqual(["set", "log"]);
        expect(operations.length).toBe(2);

        // Cleanup
        setSpy.mockRestore();
        logSpy.mockRestore();
      });
    });
  });

  describe("FindOneAndUpdate Conditions", () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    // Test untuk kondisi docToUpdate && awal_peminjaman && tanggal_peminjaman
    it("should skip update when docToUpdate is null", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const mockSet = jest.spyOn(mongoose.Query.prototype, "set");

      await Cnc.findOneAndUpdate(
        { _id: nonExistentId },
        { status: "Diproses" }
      );

      expect(mockSet).not.toHaveBeenCalled();
      mockSet.mockRestore();
    });
  });
});
