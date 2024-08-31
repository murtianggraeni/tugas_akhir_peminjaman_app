// // admin controller

// const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
// const { CncSensor, LaserSensor, PrintingSensor } = require('../models/sensorModel');
// const User = require('../models/userModel');

// const getModelByType = (type) => {
//     switch(type) {
//         case 'cnc':
//             return Cnc;
//         case 'laser':
//             return Laser;
//         case 'printing':
//             return Printing;
//         default:
//             throw new Error('Invalid type parameter');
//     }
// };

// const getSensorModelByType = (type) => {
//     switch(type) {
//         case 'cnc':
//             return CncSensor;
//         case 'laser':
//             return LaserSensor;
//         case 'printing':
//             return PrintingSensor;
//         default:
//             throw new Error('Invalid type parameter');
//     }
// };

// const handlePeminjaman = {
//     getPeminjamanAll: async (req, res) => {
//         const { userId } = req.username;
//         const { type } = req.params;

//         console.log(`Received request for type: ${type}`);  // Logging untuk memastikan type benar

//         try {
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });

//             if (!user) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can approve peminjaman.",
//                 });
//             }

//             console.log(`Admin ${userId} is requesting ${type} data`);

//             const Model = getModelByType(type);
//             const peminjamanForm = await Model.find();

//             if (!peminjamanForm || peminjamanForm.length === 0) {
//             return res.status(404).json({ message: 'Data tidak ditemukan' });
//             }
            
//             peminjamanForm.sort((a, b) => {
//                 if (a.status === 'Menunggu' && (b.status === 'Disetujui' || b.status === 'Ditolak')) return -1;
//                 if ((a.status === 'Disetujui' || a.status === 'Ditolak') && b.status === 'Menunggu') return 1;
//                 return 0;
//             });

//             const responseData = peminjamanForm.map(item => ({
//                 id: item._id,
//                 nama_pemohon: item.nama_pemohon,
//                 status: item.status,
//             }));

//             if (!peminjamanForm) {
//                 return res.status(404).json({ message: 'Data tidak ditemukan' });
//             }

//             res.status(200).json({
//                 success: true,
//                 statusCode: res.statusCode,
//                 data: responseData,
//             });

//         } catch (err) {
//             console.error(`Error fetching ${type} data for admin ${userId}:`, err);
//             res.status(500).json({ error: err.message });
//         }
//     },

//     getPeminjamanById: async (req, res) => {
//         const { userId } = req.username;
//         const { peminjamanId, type } = req.params;

//         try {
//             // Cek apakah user memiliki role admin
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });

//             if (!user) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can approve peminjaman.",
//                 });
//             }

//             // Pilih model yang sesuai berdasarkan tipe
//             const Model = getModelByType(type);

//             // Cari peminjaman berdasarkan ID
//             const peminjaman = await Model.findById(peminjamanId);
//             console.log(peminjaman); // Tambahkan log untuk melihat apakah data ditemukan

//             if (!peminjaman) {
//                 return res.status(404).json({ message: 'Data tidak ditemukan' });
//             }

//             // Siapkan data yang akan dikirim sebagai respons
//             const responseData = {
//                 id: peminjaman._id,
//                 email: peminjaman.email,
//                 nama_pemohon: peminjaman.nama_pemohon,
//                 tanggal_peminjaman: peminjaman.tanggal_peminjaman,
//                 awal_peminjaman: peminjaman.awal_peminjaman,
//                 akhir_peminjaman: peminjaman.akhir_peminjaman,
//                 jumlah: peminjaman.jumlah,
//                 program_studi: peminjaman.program_studi,
//                 kategori: peminjaman.kategori,
//                 detail_keperluan: peminjaman.detail_keperluan,
//                 desain_benda: peminjaman.desain_benda,
//                 status: peminjaman.status,
//                 waktu: peminjaman.waktu,
//             };

//             res.status(200).json({
//                 success: true,
//                 statusCode: res.statusCode,
//                 data: responseData,
//             });

//         } catch (err) {
//             console.error(err);
//             res.status(500).json({ error: err.message });
//         }
//     },

//     editDisetujui: async (req, res) => {
//         const { userId } = req.username;
//         const { peminjamanId, type } = req.params;

//         try {
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });

//             if (!user) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can approve peminjaman.",
//                 });
//             }

//             const Model = getModelByType(type);
//             const formEdit = await Model.findById(peminjamanId);

//             if (!formEdit) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "not found.",
//                 });
//             }

//             if (formEdit.status === "Ditolak") {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Peminjaman has already been rejected and cannot be approved.",
//                 });
//             }

//             formEdit.status = "Disetujui";
//             await formEdit.save();

//             res.status(200).json({
//                 success: true,
//                 message: "Peminjaman status updated to Disetujui.",
//                 data: formEdit,
//             });
//         } catch (error) {
//             console.error('Error updating peminjaman status:', error);
//             res.status(500).json({
//                 success: false,
//                 message: "Error updating peminjaman status.",
//             });
//         }
//     },

//     editDitolak: async (req, res) => {
//         const { userId } = req.username;
//         const { peminjamanId, type } = req.params;
//         const { alasan } = req.body; 

//         try {
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });

//             if (!user) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can reject peminjaman.",
//                 });
//             }

//             const Model = getModelByType(type);
//             const formEdit = await Model.findById(peminjamanId);

//             if (!formEdit) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Peminjaman not found.",
//                 });
//             }

//             if (formEdit.status === "Disetujui") {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Peminjaman has already been approved and cannot be rejected.",
//                 });
//             }

//             if (formEdit.status === "Ditolak") {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Peminjaman has already been rejected and cannot be approved.",
//                 });
//             }

//             if (!alasan) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Reason for rejection is required.",
//                 });
//             }

//             formEdit.status = "Ditolak";
//             formEdit.alasan = alasan;
//             await formEdit.save();

//             res.status(200).json({
//                 success: true,
//                 message: "Peminjaman status updated to Ditolak.",
//                 data: formEdit,
//             });
//         } catch (error) {
//             console.error('Error updating peminjaman status:', error);
//             res.status(500).json({
//                 success: false,
//                 message: "Error updating peminjaman status.",
//             });
//         }
//     },

//     deletePeminjamanById: async (req, res) => {
//         const { userId } = req.username;
//         const { peminjamanId, type } = req.params;
    
//         try {
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });
    
//             if (!user) {
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can delete peminjaman.",
//                 });
//             }
    
//             const Model = getModelByType(type);
//             const peminjaman = await Model.findByIdAndDelete(peminjamanId);
    
//             if (!peminjaman) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Peminjaman not found.",
//                 });
//             }
    
//             res.status(200).json({
//                 success: true,
//                 message: "Peminjaman deleted successfully.",
//             });
    
//         } catch (err) {
//             console.error(`Error deleting peminjaman for admin ${userId}:`, err);
//             res.status(500).json({ error: err.message });
//         }
//     },

//     getMonitoringData: async (req, res) => {
//         const { userId } = req.username;
//         const { type } = req.params;
//         const Model = getModelByType(type);
//         const today = new Date();
//         today.setHours(0, 0, 0, 0); // Set to midnight for consistent day comparison

//         console.log(`Request received for monitoring data: ${type} by user: ${userId}`);

//         try {
//             const user = await User.findOne({
//                 _id: userId,
//                 role: "admin",
//             });

//             if (!user) {
//                 console.log('Unauthorized access attempt detected.');
//                 return res.status(403).json({
//                     success: false,
//                     message: "Unauthorized. Only admin can access monitoring data.",
//                 });
//             }

//             // Ambil semua peminjaman yang disetujui untuk perhitungan total
//             const allApprovedPeminjaman = await Model.find({ status: 'Disetujui' });

//             // Tentukan awal dan akhir hari ini untuk filter
//             const startOfDay = new Date(today);
//             const endOfDay = new Date(today);
//             endOfDay.setHours(23, 59, 59, 999);  // Set to end of the day

//             console.log(`Start of Day: ${startOfDay}`);
//             console.log(`End of Day: ${endOfDay}`);

//             // Ambil peminjaman yang disetujui yang berhubungan dengan hari ini untuk perhitungan harian
//             const todayPeminjaman = await Model.find({
//                 status: 'Disetujui',
//                 $or: [
//                     { awal_peminjaman: { $lte: new Date() }, akhir_peminjaman: { $gte: startOfDay } },
//                     { akhir_peminjaman: { $gte: startOfDay, $lte: endOfDay } },
//                 ]
//             });

//             console.log(`All approved peminjaman found: ${allApprovedPeminjaman.length}`);
//             console.log(`Today peminjaman found: ${todayPeminjaman.length}`);

//             let totalDurationToday = 0;
//             let totalDurationAll = 0;
//             let userCountToday = 0;
//             let userCountAll = 0;
//             const userDetails = [];

//             // Hitung total durasi dan user count untuk semua peminjaman yang disetujui
//             allApprovedPeminjaman.forEach(peminjaman => {
//                 console.log(`Peminjaman ID: ${peminjaman._id}`);
//                 console.log(`Raw awal_peminjaman: ${peminjaman.awal_peminjaman}`);
//                 console.log(`Raw akhir_peminjaman: ${peminjaman.akhir_peminjaman}`);

//                 let rawAwal = peminjaman.awal_peminjaman;
//                 let rawAkhir = peminjaman.akhir_peminjaman;

//                 // Kombinasikan dengan tanggal hari ini
//                 const fullAwal = new Date(`${today.toDateString()} ${rawAwal}`);
//                 const fullAkhir = new Date(`${today.toDateString()} ${rawAkhir}`);

//                 console.log(`Parsed awal_peminjaman: ${fullAwal}`);
//                 console.log(`Parsed akhir_peminjaman: ${fullAkhir}`);
//                 console.log(`Today's Date: ${today}`);
//                 console.log(`Now: ${new Date()}`);

//                 if (isNaN(fullAwal.getTime()) || isNaN(fullAkhir.getTime())) {
//                     console.error(`Cannot parse dates: awal_peminjaman: ${fullAwal}, akhir_peminjaman: ${fullAkhir}`);
//                     return;
//                 }

//                 let startTime = fullAwal;
//                 let endTime;

//                 // Tentukan endTime berdasarkan situasi
//                 if (startTime > new Date()) {
//                     // Jika startTime di masa depan, kita gunakan fullAkhir sebagai endTime
//                     endTime = fullAkhir;
//                 } else {
//                     // Jika startTime sudah terjadi, gunakan waktu sekarang sebagai end time
//                     endTime = new Date();
//                 }

//                 console.log(`Start Time: ${startTime}`);
//                 console.log(`End Time: ${endTime}`);

//                 const duration = (endTime - startTime) / (1000 * 60 * 60); // dalam jam

//                 console.log(`Calculated duration: ${duration} hours`);

//                 if (!isNaN(duration) && duration > 0) {
//                     totalDurationAll += duration; // Tambahkan durasi ke total seluruh waktu
//                     userCountAll++; // Tambahkan pengguna ke total seluruh waktu

//                     userDetails.push({
//                         nama: peminjaman.nama_pemohon,
//                         kategori: peminjaman.kategori,
//                         detail_keperluan: peminjaman.detail_keperluan,
//                         durasi: `${Math.floor(duration)}j ${Math.floor((duration % 1) * 60)}m`
//                     });

//                     console.log(`Peminjaman processed: ${peminjaman.nama_pemohon}, Duration: ${duration}`);
                    
//                 } else {
//                     console.log('Skipping peminjaman due to invalid duration.');
//                 }
//             });

//             // Hitung durasi dan user count untuk peminjaman yang berhubungan dengan hari ini
//             todayPeminjaman.forEach(peminjaman => {
//                 let rawAwal = peminjaman.awal_peminjaman;
//                 let rawAkhir = peminjaman.akhir_peminjaman;

//                 console.log(`Peminjaman ID: ${peminjaman._id}`);
//                 console.log(`Raw awal_peminjaman: ${peminjaman.awal_peminjaman}`);
//                 console.log(`Raw akhir_peminjaman: ${peminjaman.akhir_peminjaman}`);

//                 const fullAwal = new Date(`${today.toDateString()} ${rawAwal}`);
//                 const fullAkhir = new Date(`${today.toDateString()} ${rawAkhir}`);

//                 console.log(`Parsed awal_peminjaman: ${fullAwal}`);
//                 console.log(`Parsed akhir_peminjaman: ${fullAkhir}`);
//                 console.log(`Today's Date: ${today}`);
//                 console.log(`Now: ${new Date()}`);

//                 if (isNaN(fullAwal.getTime()) || isNaN(fullAkhir.getTime())) {
//                     console.error(`Cannot parse dates: awal_peminjaman: ${fullAwal}, akhir_peminjaman: ${fullAkhir}`);
//                     return;
//                 }

//                 let startTime = fullAwal;
//                 let endTime;

//                 // Tentukan endTime berdasarkan situasi
//                 if (startTime > new Date()) {
//                     // Jika startTime di masa depan, kita gunakan fullAkhir sebagai endTime
//                     endTime = fullAkhir;
//                 } else {
//                     // Jika startTime sudah terjadi, gunakan waktu sekarang sebagai end time
//                     endTime = new Date();
//                 }

//                 console.log(`Start Time: ${startTime}`);
//                 console.log(`End Time: ${endTime}`);

//                 const duration = (endTime - startTime) / (1000 * 60 * 60); // dalam jam

//                 console.log(`Calculated duration: ${duration} hours`);

//                 if (!isNaN(duration) && duration > 0) {
//                     totalDurationToday += duration; // Tambahkan durasi ke total hari ini
//                     userCountToday++; // Tambahkan pengguna ke total hari ini

//                     // userDetails.push({
//                     //     nama: peminjaman.nama_pemohon,
//                     //     kategori: peminjaman.kategori,
//                     //     detail_keperluan: peminjaman.detail_keperluan,
//                     //     durasi: `${Math.floor(duration)}j ${Math.floor((duration % 1) * 60)}m`
//                     // });

//                     console.log(`Peminjaman processed: ${peminjaman.nama_pemohon}, Duration: ${duration}`);
//                 } else {
//                     console.log('Skipping peminjaman due to invalid duration.');
//                 }
//             });

//             console.log(`Total Duration Today: ${totalDurationToday} hours`);
//             console.log(`Total Duration All: ${totalDurationAll} hours`);
//             console.log(`User Count Today: ${userCountToday}`);
//             console.log(`User Count All: ${userCountAll}`);

//             res.status(200).json({
//                 success: true,
//                 data: {
//                     totalDurationToday: `${Math.floor(totalDurationToday)}j ${Math.floor((totalDurationToday % 1) * 60)}m`,
//                     totalDurationAll: `${Math.floor(totalDurationAll)}j ${Math.floor((totalDurationAll % 1) * 60)}m`,
//                     userCountToday,
//                     userCountAll,
//                     userDetails
//                 }
//             });

//         } catch (error) {
//             console.error('Error getting monitoring data:', error);
//             res.status(500).json({
//                 success: false,
//                 message: "Error getting monitoring data.",
//             });
//         }
//     },
    
// };

// module.exports = handlePeminjaman;

// admin controller

// admin controller

const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const { CncSensor, LaserSensor, PrintingSensor } = require('../models/sensorModel');
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

const getSensorModelByType = (type) => {
    switch(type) {
        case 'cnc':
            return CncSensor;
        case 'laser':
            return LaserSensor;
        case 'printing':
            return PrintingSensor;
        default:
            throw new Error('Invalid type parameter');
    }
};

const handlePeminjaman = {
    getPeminjamanAll: async (req, res) => {
        const { userId } = req.username;
        const { type } = req.params;

        console.log(`Received request for type: ${type}`);  // Logging untuk memastikan type benar

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

            console.log(`Admin ${userId} is requesting ${type} data`);

            const Model = getModelByType(type);
            const peminjamanForm = await Model.find();

            if (!peminjamanForm || peminjamanForm.length === 0) {
                return res.status(404).json({ message: 'Data tidak ditemukan' });
            }
            
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

            res.status(200).json({
                success: true,
                statusCode: res.statusCode,
                data: responseData,
            });

        } catch (err) {
            console.error(`Error fetching ${type} data for admin ${userId}:`, err);
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
    },

    deletePeminjamanById: async (req, res) => {
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
                    message: "Unauthorized. Only admin can delete peminjaman.",
                });
            }
    
            const Model = getModelByType(type);
            const peminjaman = await Model.findByIdAndDelete(peminjamanId);
    
            if (!peminjaman) {
                return res.status(404).json({
                    success: false,
                    message: "Peminjaman not found.",
                });
            }
    
            res.status(200).json({
                success: true,
                message: "Peminjaman deleted successfully.",
            });
    
        } catch (err) {
            console.error(`Error deleting peminjaman for admin ${userId}:`, err);
            res.status(500).json({ error: err.message });
        }
    },

    getMonitoringData: async (req, res) => {
        const { userId } = req.username;
        const { type } = req.params;
        const Model = getModelByType(type);
        const SensorModel = getSensorModelByType(type);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight for consistent day comparison
    
        console.log(`Request received for monitoring data: ${type} by user: ${userId}`);
    
        try {
            const user = await User.findOne({
                _id: userId,
                role: "admin",
            });
    
            if (!user) {
                console.log('Unauthorized access attempt detected.');
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. Only admin can access monitoring data.",
                });
            }
    
            // Ambil semua peminjaman yang disetujui untuk perhitungan total
            const allApprovedPeminjaman = await Model.find({ status: 'Disetujui' });
    
            // Tentukan awal dan akhir hari ini untuk filter
            const startOfDay = new Date(today);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);  // Set to end of the day
    
            console.log(`Start of Day: ${startOfDay}`);
            console.log(`End of Day: ${endOfDay}`);
    
            let totalDurationToday = 0;
            let totalDurationAll = 0;
            let userCountToday = 0;
            let userCountAll = 0;
            const userDetails = [];
    
            // Ambil data sensor untuk melihat apakah tombol "Mulai Peminjaman" ditekan pada hari ini
            const sensorDataToday = await SensorModel.findOne({ waktu: { $gte: startOfDay, $lte: endOfDay }, button: true });
            const isButtonPressedToday = !!sensorDataToday;
    
            // Loop over all approved peminjaman
            for (const peminjaman of allApprovedPeminjaman) {
                console.log(`Peminjaman ID: ${peminjaman._id}`);
    
                const rawAwal = peminjaman.awal_peminjaman;
                const rawAkhir = peminjaman.akhir_peminjaman;
    
                const startTime = new Date(`${startOfDay.toDateString()} ${rawAwal}`);
                const endTime = new Date(`${startOfDay.toDateString()} ${rawAkhir}`);
    
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.error(`Cannot parse dates: awal_peminjaman: ${startTime}, akhir_peminjaman: ${endTime}`);
                    continue;
                }
    
                let duration;
    
                // Jika peminjaman berakhir sebelum saat ini, gunakan waktu akhir_peminjaman sebagai endTime
                if (endTime < new Date()) {
                    duration = (endTime - startTime) / (1000 * 60 * 60); // dalam jam
                } else {
                    // Jika peminjaman masih berjalan, gunakan waktu saat ini untuk menghitung durasi yang sudah terjadi
                    duration = (new Date() - startTime) / (1000 * 60 * 60); // dalam jam
                }
    
                console.log(`Calculated duration: ${duration} hours`);
    
                if (!isNaN(duration) && duration > 0) {
                    totalDurationAll += duration; // Tambahkan durasi ke total seluruh waktu
                    userCountAll++; // Tambahkan pengguna ke total seluruh waktu
    
                    userDetails.push({
                        nama: peminjaman.nama_pemohon,
                        kategori: peminjaman.kategori,
                        detail_keperluan: peminjaman.detail_keperluan,
                        durasi: `${Math.floor(duration)}j ${Math.floor((duration % 1) * 60)}m`
                    });
    
                    // Periksa apakah peminjaman terjadi hari ini dan tombol ditekan hari ini
                    if (
                        isButtonPressedToday &&
                        sensorDataToday.waktu <= startTime && // Memastikan bahwa tombol ditekan sebelum atau bersamaan dengan startTime
                        endTime <= endOfDay // Pastikan endTime terjadi dalam hari ini
                    ) {
                        totalDurationToday += duration;
                        userCountToday++;
                    }
    
                    console.log(`Peminjaman processed: ${peminjaman.nama_pemohon}, Duration: ${duration}`);
                } else {
                    console.log('Skipping peminjaman due to invalid duration.');
                }
            }
    
            console.log(`Total Duration Today: ${totalDurationToday} hours`);
            console.log(`Total Duration All: ${totalDurationAll} hours`);
            console.log(`User Count Today: ${userCountToday}`);
            console.log(`User Count All: ${userCountAll}`);
    
            res.status(200).json({
                success: true,
                data: {
                    totalDurationToday: `${Math.floor(totalDurationToday)}j ${Math.floor((totalDurationToday % 1) * 60)}m`,
                    totalDurationAll: `${Math.floor(totalDurationAll)}j ${Math.floor((totalDurationAll % 1) * 60)}m`,
                    userCountToday,
                    userCountAll,
                    userDetails
                }
            });
    
        } catch (error) {
            console.error('Error getting monitoring data:', error);
            res.status(500).json({
                success: false,
                message: "Error getting monitoring data.",
            });
        }
    },
    
    
    
    
    

    // getMonitoringData: async (req, res) => {
    //     const { userId } = req.username;
    //     const { type } = req.params;
    //     const Model = getModelByType(type);
    //     const today = new Date();
    //     today.setHours(0, 0, 0, 0); // Set to midnight for consistent day comparison

    //     console.log(`Request received for monitoring data: ${type} by user: ${userId}`);

    //     try {
    //         const user = await User.findOne({
    //             _id: userId,
    //             role: "admin",
    //         });

    //         if (!user) {
    //             console.log('Unauthorized access attempt detected.');
    //             return res.status(403).json({
    //                 success: false,
    //                 message: "Unauthorized. Only admin can access monitoring data.",
    //             });
    //         }

    //         // Ambil semua peminjaman yang disetujui untuk perhitungan total
    //         const allApprovedPeminjaman = await Model.find({ status: 'Disetujui' });

    //         // Tentukan awal dan akhir hari ini untuk filter
    //         const startOfDay = new Date(today);
    //         const endOfDay = new Date(today);
    //         endOfDay.setHours(23, 59, 59, 999);  // Set to end of the day

    //         console.log(`Start of Day: ${startOfDay}`);
    //         console.log(`End of Day: ${endOfDay}`);

    //         // Ambil peminjaman yang disetujui yang berhubungan dengan hari ini untuk perhitungan harian
    //         const todayPeminjaman = await Model.find({
    //             status: 'Disetujui',
    //             $or: [
    //                 { awal_peminjaman: { $lte: new Date() }, akhir_peminjaman: { $gte: startOfDay } },
    //                 { akhir_peminjaman: { $gte: startOfDay, $lte: endOfDay } },
    //             ]
    //         });

    //         console.log(`All approved peminjaman found: ${allApprovedPeminjaman.length}`);
    //         console.log(`Today peminjaman found: ${todayPeminjaman.length}`);

    //         let totalDurationToday = 0;
    //         let totalDurationAll = 0;
    //         let userCountToday = 0;
    //         let userCountAll = 0;
    //         const userDetails = [];

    //         // Hitung total durasi dan user count untuk semua peminjaman yang disetujui
    //         allApprovedPeminjaman.forEach(peminjaman => {
    //             console.log(`Peminjaman ID: ${peminjaman._id}`);
    //             console.log(`Raw awal_peminjaman: ${peminjaman.awal_peminjaman}`);
    //             console.log(`Raw akhir_peminjaman: ${peminjaman.akhir_peminjaman}`);

    //             let rawAwal = peminjaman.awal_peminjaman;
    //             let rawAkhir = peminjaman.akhir_peminjaman;

    //             // Kombinasikan dengan tanggal hari ini
    //             const fullAwal = new Date(`${today.toDateString()} ${rawAwal}`);
    //             const fullAkhir = new Date(`${today.toDateString()} ${rawAkhir}`);

    //             console.log(`Parsed awal_peminjaman: ${fullAwal}`);
    //             console.log(`Parsed akhir_peminjaman: ${fullAkhir}`);
    //             console.log(`Today's Date: ${today}`);
    //             console.log(`Now: ${new Date()}`);

    //             if (isNaN(fullAwal.getTime()) || isNaN(fullAkhir.getTime())) {
    //                 console.error(`Cannot parse dates: awal_peminjaman: ${fullAwal}, akhir_peminjaman: ${fullAkhir}`);
    //                 return;
    //             }

    //             let startTime = fullAwal;
    //             let endTime;

    //             // Tentukan endTime berdasarkan situasi
    //             if (startTime > new Date()) {
    //                 // Jika startTime di masa depan, kita gunakan fullAkhir sebagai endTime
    //                 endTime = fullAkhir;
    //             } else {
    //                 // Jika startTime sudah terjadi, gunakan waktu sekarang sebagai end time
    //                 endTime = new Date();
    //             }

    //             console.log(`Start Time: ${startTime}`);
    //             console.log(`End Time: ${endTime}`);

    //             const duration = (endTime - startTime) / (1000 * 60 * 60); // dalam jam

    //             console.log(`Calculated duration: ${duration} hours`);

    //             if (!isNaN(duration) && duration > 0) {
    //                 totalDurationAll += duration; // Tambahkan durasi ke total seluruh waktu
    //                 userCountAll++; // Tambahkan pengguna ke total seluruh waktu

    //                 userDetails.push({
    //                     nama: peminjaman.nama_pemohon,
    //                     kategori: peminjaman.kategori,
    //                     detail_keperluan: peminjaman.detail_keperluan,
    //                     durasi: `${Math.floor(duration)}j ${Math.floor((duration % 1) * 60)}m`
    //                 });

    //                 console.log(`Peminjaman processed: ${peminjaman.nama_pemohon}, Duration: ${duration}`);
                    
    //             } else {
    //                 console.log('Skipping peminjaman due to invalid duration.');
    //             }
    //         });

    //         // Hitung durasi dan user count untuk peminjaman yang berhubungan dengan hari ini
    //         todayPeminjaman.forEach(peminjaman => {
    //             let rawAwal = peminjaman.awal_peminjaman;
    //             let rawAkhir = peminjaman.akhir_peminjaman;

    //             console.log(`Peminjaman ID: ${peminjaman._id}`);
    //             console.log(`Raw awal_peminjaman: ${peminjaman.awal_peminjaman}`);
    //             console.log(`Raw akhir_peminjaman: ${peminjaman.akhir_peminjaman}`);

    //             const fullAwal = new Date(`${today.toDateString()} ${rawAwal}`);
    //             const fullAkhir = new Date(`${today.toDateString()} ${rawAkhir}`);

    //             console.log(`Parsed awal_peminjaman: ${fullAwal}`);
    //             console.log(`Parsed akhir_peminjaman: ${fullAkhir}`);
    //             console.log(`Today's Date: ${today}`);
    //             console.log(`Now: ${new Date()}`);

    //             if (isNaN(fullAwal.getTime()) || isNaN(fullAkhir.getTime())) {
    //                 console.error(`Cannot parse dates: awal_peminjaman: ${fullAwal}, akhir_peminjaman: ${fullAkhir}`);
    //                 return;
    //             }

    //             let startTime = fullAwal;
    //             let endTime;

    //             // Tentukan endTime berdasarkan situasi
    //             if (startTime > new Date()) {
    //                 // Jika startTime di masa depan, kita gunakan fullAkhir sebagai endTime
    //                 endTime = fullAkhir;
    //             } else {
    //                 // Jika startTime sudah terjadi, gunakan waktu sekarang sebagai end time
    //                 endTime = new Date();
    //             }

    //             console.log(`Start Time: ${startTime}`);
    //             console.log(`End Time: ${endTime}`);

    //             const duration = (endTime - startTime) / (1000 * 60 * 60); // dalam jam

    //             console.log(`Calculated duration: ${duration} hours`);

    //             if (!isNaN(duration) && duration > 0) {
    //                 totalDurationToday += duration; // Tambahkan durasi ke total hari ini
    //                 userCountToday++; // Tambahkan pengguna ke total hari ini

    //                 console.log(`Peminjaman processed: ${peminjaman.nama_pemohon}, Duration: ${duration}`);
    //             } else {
    //                 console.log('Skipping peminjaman due to invalid duration.');
    //             }
    //         });

    //         console.log(`Total Duration Today: ${totalDurationToday} hours`);
    //         console.log(`Total Duration All: ${totalDurationAll} hours`);
    //         console.log(`User Count Today: ${userCountToday}`);
    //         console.log(`User Count All: ${userCountAll}`);

    //         res.status(200).json({
    //             success: true,
    //             data: {
    //                 totalDurationToday: `${Math.floor(totalDurationToday)}j ${Math.floor((totalDurationToday % 1) * 60)}m`,
    //                 totalDurationAll: `${Math.floor(totalDurationAll)}j ${Math.floor((totalDurationAll % 1) * 60)}m`,
    //                 userCountToday,
    //                 userCountAll,
    //                 userDetails
    //             }
    //         });

    //     } catch (error) {
    //         console.error('Error getting monitoring data:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: "Error getting monitoring data.",
    //         });
    //     }
    // },
};

module.exports = handlePeminjaman;

