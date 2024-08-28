// // cronJobs.js
// const nodeCron = require('node-cron');
// const { updateCountData } = require('../controllers/countController');  // Sesuaikan path jika perlu
// const { Cnc, Laser, Printing } = require('../models/peminjamanModel');

// // Fungsi untuk memperbarui status peminjaman
// const autoRejectPeminjaman = async () => {
//     const now = new Date();

//     try {
//         // Ambil semua peminjaman yang statusnya "Menunggu"
//         const models = [Cnc, Laser, Printing];
//         let totalDitolak = 0;

//         for (const Model of models) {
//             const peminjamanMenunggu = await Model.find({ status: 'Menunggu' });

//             for (const peminjaman of peminjamanMenunggu) {
//                 const { awal_peminjaman, tanggal_peminjaman } = peminjaman;

//                 // Jika waktu saat ini sudah melewati waktu awal_peminjaman dan tanggal_peminjaman, tolak otomatis
//                 if (now >= new Date(awal_peminjaman) && now >= new Date(tanggal_peminjaman)) {
//                     peminjaman.status = 'Ditolak';
//                     await peminjaman.save();
//                     totalDitolak++;
//                     console.log(`Peminjaman dengan ID ${peminjaman._id} otomatis ditolak.`);
//                 }
//             }
//         }

//         if (totalDitolak > 0) {
//             // Update count data setelah penolakan otomatis
//             await updateCountData();
//         }

//     } catch (error) {
//         console.error('Error updating peminjaman status:', error);
//     }
// };

// // Jalankan cron job setiap menit untuk memeriksa peminjaman
// nodeCron.schedule('* * * * *', autoRejectPeminjaman);
