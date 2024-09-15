const checkAvailability = async (Model, tanggal_peminjaman, awal_peminjaman, akhir_peminjaman, excludeId = null) => {
    try {
        console.log('Input to checkAvailability:', {
            tanggal_peminjaman,
            awal_peminjaman,
            akhir_peminjaman,
            excludeId
        });

        // Fungsi untuk memformat tanggal ke string
        const formatDate = (date) => {
            if (date instanceof Date) {
                return date.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            }
            return date; // Jika sudah string, kembalikan apa adanya
        };

        // Fungsi untuk mengonversi waktu dari string "HH:MM AM/PM" ke `Date`
        const convertTimeStringToDate = (dateString, timeString) => {
            // Jika timeString sudah berupa Date, kembalikan langsung
            if (timeString instanceof Date) {
                console.log(`timeString is already a Date object: ${timeString}`);
                return timeString;
            }

            // Jika timeString adalah string, lakukan konversi
            console.log(`Converting time string: ${timeString} with date: ${dateString}`);
            const [time, modifier] = timeString.split(' ');
            let [hours, minutes] = time.split(':');
            if (modifier === 'PM' && hours !== '12') {
                hours = parseInt(hours, 10) + 12;
            }
            if (modifier === 'AM' && hours === '12') {
                hours = '00';
            }
            const date = new Date(dateString);  // menggunakan tanggal peminjaman yang sudah ada
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            console.log(`Converted to date object: ${date}`);
            return date;
        };

        // Gunakan tanggal peminjaman untuk mengonversi waktu
        const formattedTanggal = formatDate(tanggal_peminjaman);
        const startDateTime = convertTimeStringToDate(tanggal_peminjaman, awal_peminjaman);
        const endDateTime = convertTimeStringToDate(tanggal_peminjaman, akhir_peminjaman);

        console.log('Converted Date values for query:', {
            startDateTime,
            endDateTime
        });

        const conflictingBookings = await Model.find({
            tanggal_peminjaman: formattedTanggal,
            $or: [
                { 
                    awal_peminjaman: { $lt: endDateTime },
                    akhir_peminjaman: { $gt: startDateTime }
                },
                {
                    awal_peminjaman: { $gte: startDateTime, $lt: endDateTime }
                },
                {
                    akhir_peminjaman: { $gt: startDateTime, $lte: endDateTime }
                }
            ],
            status: { $in: ['Disetujui', 'Menunggu'] },
            _id: { $ne: excludeId }
        });

        console.log('Conflicting bookings found:', conflictingBookings.length, conflictingBookings);

        return conflictingBookings.length === 0;
    } catch (error) {
        console.error('Error in checkAvailability:', error);
        throw error;
    }
};

module.exports = {
    checkAvailability
};
