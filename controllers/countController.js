// countController
const Count = require('../models/countModel');
const {Cnc, Laser, Printing} = require('../models/peminjamanModel');

const getCounts = async (req, res) => {
    try {
        // Hitung dokumen untuk setiap status dan setiap tipe mesin
        const disetujuiCnc = await Cnc.countDocuments({status: 'Disetujui'});
        const ditolakCnc = await Cnc.countDocuments({status: 'Ditolak'});
        const menungguCnc = await Cnc.countDocuments({status: 'Menunggu'});

        const disetujuiLaser = await Laser.countDocuments({status: 'Disetujui'});
        const ditolakLaser = await Laser.countDocuments({status: 'Ditolak'});
        const menungguLaser = await Laser.countDocuments({status: 'Menunggu'});

        const disetujuiPrinting = await Printing.countDocuments({status: 'Disetujui'});
        const ditolakPrinting = await Printing.countDocuments({status: 'Ditolak'});
        const menungguPrinting = await Printing.countDocuments({status: 'Menunggu'});

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
