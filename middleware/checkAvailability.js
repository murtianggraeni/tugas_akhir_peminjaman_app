const checkAvailability = async (
  Model,
  tanggal_peminjaman,
  awal_peminjaman,
  akhir_peminjaman,
  excludeId = null
) => {
  try {
    console.log("Input to checkAvailability:", {
      tanggal_peminjaman,
      awal_peminjaman,
      akhir_peminjaman,
      excludeId,
    });

    // Fungsi untuk memformat tanggal ke string
    const formatDate = (date) => {
      if (date instanceof Date) {
        return date.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      return date; // Jika sudah string, kembalikan apa adanya
    };

    // Fungsi untuk mengonversi waktu dari string "HH:MM AM/PM" ke `Date`
    const convertTimeStringToDate = (dateString, timeString) => {
      // Jika `timeString` sudah berupa objek Date, kembalikan langsung
      if (timeString instanceof Date) {
        console.log(`timeString is already a Date object: ${timeString}`);
        return timeString;
      }

      // Periksa apakah `timeString` valid atau berupa string
      if (!timeString || typeof timeString !== "string") {
        console.error("Invalid or undefined timeString:", timeString);
        return null;
      }

      // Log untuk proses konversi
      console.log(
        `Converting time string: ${timeString} with date: ${dateString}`
      );

      // Pisahkan `time` dan `modifier` (AM/PM)
      const [time, modifier] = timeString.split(" ");
      if (
        !time ||
        !modifier ||
        !["AM", "PM", "am", "pm"].includes(modifier.toUpperCase())
      ) {
        console.error("Invalid time format:", timeString);
        return null;
      }

      // Pisahkan `hours` dan `minutes`, serta `seconds` jika ada
      let [hours, minutes, seconds] = time.split(":");
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes || "0", 10); // Default ke 0 jika tidak ada menit
      seconds = parseInt(seconds || "0", 10); // Default ke 0 jika tidak ada detik

      // Validasi format jam, menit, dan detik
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error("Invalid time components in:", timeString);
        return null;
      }

      // Konversi ke format 24 jam
      if (modifier.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      } else if (modifier.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      // Gunakan `dateString` untuk tanggal dan tambahkan jam yang telah dikonversi
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return null;
      }

      // Set waktu ke objek `date`
      date.setHours(hours, minutes, seconds, 0);
      console.log(`Converted to date object: ${date}`);
      return date;
    };
    // const convertTimeStringToDate = (dateString, timeString) => {
    //   // Jika timeString sudah berupa Date, kembalikan langsung
    //   if (timeString instanceof Date) {
    //     console.log(`timeString is already a Date object: ${timeString}`);
    //     return timeString;
    //   }

    //   // Then check if it's invalid or not a string
    //   if (!timeString || typeof timeString !== "string") {
    //     console.error("Invalid or undefined timeString:", timeString);
    //     return null;
    //   }

    //   // Jika timeString adalah string, lakukan konversi
    //   console.log(
    //     `Converting time string: ${timeString} with date: ${dateString}`
    //   );
    //   const [time, modifier] = timeString.split(" ");
    //   let [hours, minutes] = time.split(":");

    //   // Validasi untuk format waktu yang benar
    //   if (
    //     !hours ||
    //     isNaN(hours) ||
    //     !minutes ||
    //     isNaN(minutes) ||
    //     !["AM", "PM"].includes(modifier)
    //   ) {
    //     throw new Error("Invalid time format");
    //   }

    //   if (modifier === "PM" && hours !== "12") {
    //     hours = parseInt(hours, 10) + 12;
    //   }
    //   if (modifier === "AM" && hours === "12") {
    //     hours = "00";
    //   }
    //   const date = new Date(dateString); // menggunakan tanggal peminjaman yang sudah ada
    //   date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    //   console.log(`Converted to date object: ${date}`);
    //   return date;
    // };

    // Gunakan tanggal peminjaman untuk mengonversi waktu
    const formattedTanggal = formatDate(tanggal_peminjaman);
    const startDateTime = convertTimeStringToDate(
      tanggal_peminjaman,
      awal_peminjaman
    );

    if (startDateTime === null) throw new Error("Invalid time format");

    const endDateTime = convertTimeStringToDate(
      tanggal_peminjaman,
      akhir_peminjaman
    );

    // Cek jika waktu tidak valid setelah konversi
    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      throw new Error("Invalid time format");
    }

    console.log("Converted Date values for query:", {
      startDateTime,
      endDateTime,
    });

    const conflictingBookings = await Model.find({
      tanggal_peminjaman: formattedTanggal,
      $or: [
        {
          awal_peminjaman: { $lt: endDateTime },
          akhir_peminjaman: { $gt: startDateTime },
        },
        {
          awal_peminjaman: { $gte: startDateTime, $lt: endDateTime },
        },
        {
          akhir_peminjaman: { $gt: startDateTime, $lte: endDateTime },
        },
      ],
      status: { $in: ["Disetujui", "Menunggu"] },
      
      _id: { $ne: excludeId },
    });

    console.log(
      "Conflicting bookings found:",
      conflictingBookings.length,
      conflictingBookings
    );

    return conflictingBookings.length === 0;
  } catch (error) {
    console.error("Error in checkAvailability:", error);
    throw error;
  }
};

module.exports = {
  checkAvailability,
};
