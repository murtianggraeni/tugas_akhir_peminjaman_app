// // countController.js
// const Count = require('../models/countModel');
// const { Cnc, Laser, Printing } = require('../models/peminjamanModel');

// // Fungsi untuk memperbarui data count setelah penolakan otomatis
// const updateCountData = async () => {
//     try {
//         // Hitung ulang dokumen untuk setiap status dan setiap tipe mesin
//         const disetujuiCnc = await Cnc.countDocuments({ status: 'Disetujui' });
//         const ditolakCnc = await Cnc.countDocuments({ status: 'Ditolak' });
//         const menungguCnc = await Cnc.countDocuments({ status: 'Menunggu' });

//         const disetujuiLaser = await Laser.countDocuments({ status: 'Disetujui' });
//         const ditolakLaser = await Laser.countDocuments({ status: 'Ditolak' });
//         const menungguLaser = await Laser.countDocuments({ status: 'Menunggu' });

//         const disetujuiPrinting = await Printing.countDocuments({ status: 'Disetujui' });
//         const ditolakPrinting = await Printing.countDocuments({ status: 'Ditolak' });
//         const menungguPrinting = await Printing.countDocuments({ status: 'Menunggu' });

//         const countData = {
//             disetujui_cnc: disetujuiCnc,
//             ditolak_cnc: ditolakCnc,
//             menunggu_cnc: menungguCnc,
//             disetujui_laser: disetujuiLaser,
//             ditolak_laser: ditolakLaser,
//             menunggu_laser: menungguLaser,
//             disetujui_printing: disetujuiPrinting,
//             ditolak_printing: ditolakPrinting,
//             menunggu_printing: menungguPrinting,
//             waktu: new Date(),
//         };

//         // Perbarui dokumen Count atau buat baru jika belum ada
//         await Count.findOneAndUpdate({}, countData, { new: true, upsert: true });

//         console.log('Count data successfully updated.');
//     } catch (error) {
//         console.error('Error updating count data:', error);
//     }
// };

// // Fungsi untuk mendapatkan data count melalui API
// const getCounts = async (req, res) => {
//     try {
//         const updatedCount = await Count.findOne(); // Mengambil data count terbaru

//         res.status(200).json({
//             success: true,
//             status: res.statusCode,
//             message: 'Counts retrieved successfully',
//             data: updatedCount,
//         });
//     } catch (error) {
//         console.error('Error getting counts:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error getting counts',
//         });
//     }
// };

// module.exports = { getCounts, updateCountData };


// const Count = require('../models/countModel');
// const {Cnc, Laser, Printing} = require('../models/peminjamanModel');
// const { updateExpiredPeminjaman } = require('../controllers/userController');

// const getCounts = async (req, res) => {
//     try {
//          // Periksa dan perbarui status sebelum menghitung
//         // Hitung dokumen untuk setiap status dan setiap tipe mesin
//         const disetujuiCnc = await Cnc.countDocuments({status: 'Disetujui'});
//         const ditolakCnc = await Cnc.countDocuments({status: 'Ditolak'});
//         const menungguCnc = await Cnc.countDocuments({status: 'Menunggu'});

//         const disetujuiLaser = await Laser.countDocuments({status: 'Disetujui'});
//         const ditolakLaser = await Laser.countDocuments({status: 'Ditolak'});
//         const menungguLaser = await Laser.countDocuments({status: 'Menunggu'});

//         const disetujuiPrinting = await Printing.countDocuments({status: 'Disetujui'});
//         const ditolakPrinting = await Printing.countDocuments({status: 'Ditolak'});
//         const menungguPrinting = await Printing.countDocuments({status: 'Menunggu'});

//         const countData = {
//             disetujui_cnc: disetujuiCnc,
//             ditolak_cnc: ditolakCnc,
//             menunggu_cnc: menungguCnc,
//             disetujui_laser: disetujuiLaser,
//             ditolak_laser: ditolakLaser,
//             menunggu_laser: menungguLaser,
//             disetujui_printing: disetujuiPrinting,
//             ditolak_printing: ditolakPrinting,
//             menunggu_printing: menungguPrinting,
//             waktu: new Date(),
//         };

//         // Find the first document and update it, or create it if it doesn't exist
//         const updatedCount = await Count.findOneAndUpdate(
//             {},
//             countData,
//             { new: true, upsert: true }
//         );

//         res.status(200).json({
//             success: true,
//             status: res.statusCode,
//             message: 'Counts retrieved and updated successfully',
//             data: updatedCount,
//         });
//     } catch (error) {
//         console.error('Error getting counts:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error getting counts',
//         });
//     }
// };

// module.exports = { getCounts };

const Count = require('../models/countModel');
const {Cnc, Laser, Printing} = require('../models/peminjamanModel');
const { updateExpiredPeminjaman } = require('../controllers/userController');

const getCounts = async (req, res) => {
    try {
        console.log('Memulai proses penghitungan...');
        
        await updateExpiredPeminjaman();
        console.log('Pembaruan status peminjaman selesai.');

        // Hitung dokumen untuk setiap status dan setiap tipe mesin
        const [
            disetujuiCnc, ditolakCnc, menungguCnc,
            disetujuiLaser, ditolakLaser, menungguLaser,
            disetujuiPrinting, ditolakPrinting, menungguPrinting
        ] = await Promise.all([
            Cnc.countDocuments({status: 'Disetujui'}),
            Cnc.countDocuments({status: 'Ditolak'}),
            Cnc.countDocuments({status: 'Menunggu'}),
            Laser.countDocuments({status: 'Disetujui'}),
            Laser.countDocuments({status: 'Ditolak'}),
            Laser.countDocuments({status: 'Menunggu'}),
            Printing.countDocuments({status: 'Disetujui'}),
            Printing.countDocuments({status: 'Ditolak'}),
            Printing.countDocuments({status: 'Menunggu'})
        ]);

        console.log('Penghitungan selesai.');

        const countData = {
            disetujui_cnc: disetujuiCnc,
            ditolak_cnc: ditolakCnc,
            menunggu_cnc: menungguCnc,
            disetujui_laser: disetujuiLaser,
            ditolak_laser: ditolakLaser,
            menunggu_laser: menungguLaser,
            disetujui_printing: disetujuiPrinting,
            ditolak_printing: ditolakPrinting,
            menunggu_printing: menungguPrinting,
            waktu: new Date(),
        };

        // Find the first document and update it, or create it if it doesn't exist
        const updatedCount = await Count.findOneAndUpdate(
            {},
            countData,
            { new: true, upsert: true }
        );

        console.log('Data count berhasil diperbarui.');

        res.status(200).json({
            success: true,
            status: res.statusCode,
            message: 'Counts retrieved and updated successfully',
            data: updatedCount,
        });
    } catch (error) {
        console.error('Error getting counts:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting counts',
        });
    }
};

module.exports = { getCounts };