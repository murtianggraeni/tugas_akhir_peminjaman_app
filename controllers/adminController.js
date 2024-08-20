const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const User = require('../models/userModel');

const getModelByType = (type) => {
    switch(type) {
        case 'cnc':
            return Cnc;
        case 'laser':
            return Laser;
        case 'printing':
            return Printing;
        default:
            throw new Error('Invalid type parameter');
    }
};

const handlePeminjaman = {
    getPeminjamanAll: async (req, res) => {
        const { userId } = req.username;
        const { type } = req.params;

        try {
            const user = await User.findOne({
                _id: userId,
                role: "admin",
            });

            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. Only admin can approve peminjaman.",
                });
            }

            const Model = getModelByType(type);
            const peminjamanForm = await Model.find();
            
            peminjamanForm.sort((a, b) => {
                if (a.status === 'Menunggu' && (b.status === 'Disetujui' || b.status === 'Ditolak')) return -1;
                if ((a.status === 'Disetujui' || a.status === 'Ditolak') && b.status === 'Menunggu') return 1;
                return 0;
            });

            const responseData = peminjamanForm.map(item => ({
                id: item._id,
                nama_pemohon: item.nama_pemohon,
                status: item.status,
            }));

            if (!peminjamanForm) {
                return res.status(404).json({ message: 'Data tidak ditemukan' });
            }

            res.status(200).json({
                success: true,
                statusCode: res.statusCode,
                data: responseData,
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getPeminjamanById: async (req, res) => {
        const { userId } = req.username;
        const { peminjamanId, type } = req.params;

        try {
            // Cek apakah user memiliki role admin
            const user = await User.findOne({
                _id: userId,
                role: "admin",
            });

            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. Only admin can approve peminjaman.",
                });
            }

            // Pilih model yang sesuai berdasarkan tipe
            const Model = getModelByType(type);

            // Cari peminjaman berdasarkan ID
            const peminjaman = await Model.findById(peminjamanId);
            console.log(peminjaman); // Tambahkan log untuk melihat apakah data ditemukan

            if (!peminjaman) {
                return res.status(404).json({ message: 'Data tidak ditemukan' });
            }

            // Siapkan data yang akan dikirim sebagai respons
            const responseData = {
                id: peminjaman._id,
                email: peminjaman.email,
                nama_pemohon: peminjaman.nama_pemohon,
                tanggal_peminjaman: peminjaman.tanggal_peminjaman,
                awal_peminjaman: peminjaman.awal_peminjaman,
                akhir_peminjaman: peminjaman.akhir_peminjaman,
                jumlah: peminjaman.jumlah,
                program_studi: peminjaman.program_studi,
                kategori: peminjaman.kategori,
                detail_keperluan: peminjaman.detail_keperluan,
                desain_benda: peminjaman.desain_benda,
                status: peminjaman.status,
                waktu: peminjaman.waktu,
            };

            res.status(200).json({
                success: true,
                statusCode: res.statusCode,
                data: responseData,
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    editDisetujui: async (req, res) => {
        const { userId } = req.username;
        const { peminjamanId, type } = req.params;

        try {
            const user = await User.findOne({
                _id: userId,
                role: "admin",
            });

            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. Only admin can approve peminjaman.",
                });
            }

            const Model = getModelByType(type);
            const formEdit = await Model.findById(peminjamanId);

            if (!formEdit) {
                return res.status(404).json({
                    success: false,
                    message: "not found.",
                });
            }

            if (formEdit.status === "Ditolak") {
                return res.status(400).json({
                    success: false,
                    message: "Peminjaman has already been rejected and cannot be approved.",
                });
            }

            formEdit.status = "Disetujui";
            await formEdit.save();

            res.status(200).json({
                success: true,
                message: "Peminjaman status updated to Disetujui.",
                data: formEdit,
            });
        } catch (error) {
            console.error('Error updating peminjaman status:', error);
            res.status(500).json({
                success: false,
                message: "Error updating peminjaman status.",
            });
        }
    },

    editDitolak: async (req, res) => {
        const { userId } = req.username;
        const { peminjamanId, type } = req.params;
        const { alasan } = req.body; 

        try {
            const user = await User.findOne({
                _id: userId,
                role: "admin",
            });

            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. Only admin can reject peminjaman.",
                });
            }

            const Model = getModelByType(type);
            const formEdit = await Model.findById(peminjamanId);

            if (!formEdit) {
                return res.status(404).json({
                    success: false,
                    message: "Peminjaman not found.",
                });
            }

            if (formEdit.status === "Disetujui") {
                return res.status(400).json({
                    success: false,
                    message: "Peminjaman has already been approved and cannot be rejected.",
                });
            }

            if (formEdit.status === "Ditolak") {
                return res.status(400).json({
                    success: false,
                    message: "Peminjaman has already been rejected and cannot be approved.",
                });
            }

            if (!alasan) {
                return res.status(400).json({
                    success: false,
                    message: "Reason for rejection is required.",
                });
            }

            formEdit.status = "Ditolak";
            formEdit.alasan = alasan;
            await formEdit.save();

            res.status(200).json({
                success: true,
                message: "Peminjaman status updated to Ditolak.",
                data: formEdit,
            });
        } catch (error) {
            console.error('Error updating peminjaman status:', error);
            res.status(500).json({
                success: false,
                message: "Error updating peminjaman status.",
            });
        }
    }
};

module.exports = handlePeminjaman;
