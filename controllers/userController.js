// userController.js
const axios = require('axios'); // Untuk mengirim request ke ESP32
const { google } = require('googleapis');
const { Readable } = require('stream');
const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const SCOPE = ['https://www.googleapis.com/auth/drive'];

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const oauth2Client = new google.auth.JWT(
    process.env.client_email, 
    null,
    process.env.private_key.replace(/\\n/g, '\n'),
    SCOPE
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

const uploadFileToDrive = async (fileBuffer, fileName) => {
    try {
        const fileStream = bufferToStream(fileBuffer);  // Konversi buffer ke stream

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'application/octet-stream',
                parents: ['1qIuyp30TAd2ALalYosfn9qv2DBcK9fiZ'] 
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fileStream,  // Gunakan stream di sini
            },
        });

        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const file = await drive.files.get({
            fileId: response.data.id,
            fields: 'webViewLink',
        });

        return file.data.webViewLink;
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
};

const getModelAndMesinName = (type) => {
    switch(type) {
        case 'cnc':
            return { Model: Cnc, mesinName: 'Cnc Milling' };
        case 'laser':
            return { Model: Laser, mesinName: 'Laser Cutting' };
        case 'printing':
            return { Model: Printing, mesinName: '3D Printing' };
        default:
            throw new Error('Invalid type parameter');
    }
}

const peminjamanHandler = async (req, res) => {
    const { type } = req.params;
    const { Model, mesinName } = getModelAndMesinName(type);
    
    const { email, nama_pemohon, tanggal_peminjaman, awal_peminjaman, akhir_peminjaman, jumlah, jurusan, detail_keperluan, program_studi, kategori } = req.body;
    const { userId, userName } = req.username;
    
    // Validasi jika diperlukan
    if ((kategori === 'Praktek' || kategori === 'Proyek Mata Kuliah') && (!detail_keperluan || detail_keperluan.trim().length === 0)) {
        return res.status(400).json({
            success: false,
            statusCode: res.statusCode,
            message: "Detail keperluan wajib diisi"
        });
    }

    let convertedAwalPeminjaman;
    let convertedAkhirPeminjaman;

    // Convert awal_peminjaman and akhir_peminjaman to Date objects
    if (awal_peminjaman) {
        convertedAwalPeminjaman = convertTimeStringToDate(awal_peminjaman);
    }
    if (akhir_peminjaman) {
        convertedAkhirPeminjaman = convertTimeStringToDate(akhir_peminjaman);
    }

    // Tentukan alamat_esp berdasarkan nama_mesin
    let alamat_esp;
    switch (mesinName.toLowerCase()) {
        case 'cnc milling':
            alamat_esp = "https://kh8ppwzx-3000.asse.devtunnels.ms/sensor/cnc/buttonPeminjaman";
            break;
        case 'laser cutting':
            alamat_esp = "https://kh8ppwzx-3000.asse.devtunnels.ms/sensor/laser/buttonPeminjaman";
            break;
        case '3d printing':
            alamat_esp = "https://kh8ppwzx-3000.asse.devtunnels.ms/sensor/printing/buttonPeminjaman";
            break;
        default:
            return res.status(400).json({ message: 'Invalid machine name' });
    }

    // if (!email || !nama_pemohon || !tanggal_peminjaman || !awal_peminjaman || !akhir_peminjaman || !jumlah || !program_studi || !kategori || !req.file) {
    //     return res.status(400).json({
    //         success: false,
    //         statusCode: res.statusCode,
    //         message: "Please complete input data"
    //     });
    // }


    try {
        // const fileLink = await uploadFileToDrive(req.file.buffer, req.file.originalname);
        const peminjamanEntry = await Model.create({
            nama_mesin: mesinName,
            alamat_esp,  // Menyimpan alamat_esp yang telah ditentukan
            email,
            nama_pemohon,
            // tanggal_peminjaman: new Date(tanggal_peminjaman), // Pastikan ini dalam format ISO 8601 atau Date object
            // awal_peminjaman: convertedAwalPeminjaman,
            // akhir_peminjaman: convertedAkhirPeminjaman,
            tanggal_peminjaman,
            awal_peminjaman,
            akhir_peminjaman,
            jumlah,
            jurusan,
            detail_keperluan,
            program_studi,
            kategori,
            // desain_benda: fileLink,
            status: 'Menunggu',
            user: userId
        });

        res.status(201).json({
            success: true,
            statusCode: res.statusCode,
            message: "Uploaded!",
            data: {
                nama_mesin: peminjamanEntry.nama_mesin,
                alamat_esp,  // Sertakan alamat_esp dalam respons jika diperlukan
                email,
                nama_pemohon,
                tanggal_peminjaman: peminjamanEntry.tanggal_peminjaman,
                awal_peminjaman: peminjamanEntry.awal_peminjaman,
                akhir_peminjaman: peminjamanEntry.akhir_peminjaman,
                // tanggal_peminjaman,
                // awal_peminjaman,
                // akhir_peminjaman,
                jumlah,
                jurusan,
                detail_keperluan,
                program_studi,
                kategori,
                // desain_benda: fileLink,
                status: peminjamanEntry.status,
                waktu: peminjamanEntry.waktu,
                user: userName
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Error uploading data"
        });
    }
};

// Helper function to convert time string to a Date object
function convertTimeStringToDate(timeString) {
    if (!timeString) return null;
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
    }
    if (modifier === 'AM' && hours === '12') {
        hours = '00';
    }
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
};



const getPeminjamanAllHandler = async (req, res) => {
    const { userId } = req.username; // Asumsi userId diambil dari req.username
    try {
         // Periksa dan perbarui status sebelum mengambil data
        // Ambil data dari ketiga model berdasarkan userId
        const cncPeminjaman = await Cnc.find({ user: userId });
        const laserPeminjaman = await Laser.find({ user: userId });
        const printingPeminjaman = await Printing.find({ user: userId });

        // Gabungkan semua data peminjaman dalam satu array
        let peminjamanForm = [
            ...cncPeminjaman,
            ...laserPeminjaman,
            ...printingPeminjaman
        ];

        // Jika tidak ada data peminjaman ditemukan
        if (!peminjamanForm || peminjamanForm.length === 0) {
            return res.status(404).json({ message: 'Data tidak ditemukan' });
        }

        // Urutkan data peminjaman berdasarkan status
        peminjamanForm.sort((a, b) => {
            if (a.status === 'Menunggu' && (b.status === 'Disetujui' || b.status === 'Ditolak')) return -1;
            if ((a.status === 'Disetujui' || a.status === 'Ditolak') && b.status === 'Menunggu') return 1;
            return 0;
        });

        // Buat data respons
        const responseData = peminjamanForm.map(item => ({
            id: item._id,
            nama_pemohon: item.nama_pemohon,
            nama_mesin: item.nama_mesin,
            alamat_esp: item.alamat_esp,
            tanggal_peminjaman: item.tanggal_peminjaman, // Pastikan dikirim sebagai ISO 8601
            awal_peminjaman: item.awal_peminjaman, // Pastikan dikirim sebagai ISO 8601
            akhir_peminjaman: item.akhir_peminjaman, // Pastikan dikirim sebagai ISO 8601
            status: item.status,
            waktu: item.waktu,
        }));

        // Kirim respons
        res.status(200).json({
            success: true,
            statusCode: res.statusCode,
            data: responseData,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const getPeminjamanByIdHandler = async (req, res) => {
    const { peminjamanId } = req.params;
    const { userId } = req.username;
    try {
        // Cari data di ketiga model
        let peminjaman = await Cnc.findOne({ _id: peminjamanId, user: userId }).populate('user', 'username email');
        if (!peminjaman) {
            peminjaman = await Laser.findOne({ _id: peminjamanId, user: userId }).populate('user', 'username email');
        }
        if (!peminjaman) {
            peminjaman = await Printing.findOne({ _id: peminjamanId, user: userId }).populate('user', 'username email');
        }

        // Jika tidak ditemukan
        if (!peminjaman) {
            return res.status(404).json({ message: 'Data tidak ditemukan' });
        }

        // Buat data respons
        const responseData = {
            id: peminjaman._id,
            nama_mesin: peminjaman.nama_mesin,
            alamat_esp: peminjaman.alamat_esp,
            email: peminjaman.user.email, // pastikan `user` telah dipopulasi
            nama_pemohon: peminjaman.nama_pemohon,
            tanggal_peminjaman: peminjaman.tanggal_peminjaman,
            awal_peminjaman: peminjaman.awal_peminjaman,
            akhir_peminjaman: peminjaman.akhir_peminjaman,
            jumlah: peminjaman.jumlah,
            jurusan: peminjaman.jurusan,
            program_studi: peminjaman.program_studi,
            kategori: peminjaman.kategori,
            detail_keperluan: peminjaman.detail_keperluan,
            desain_benda: peminjaman.desain_benda,
            status: peminjaman.status,
            waktu: peminjaman.waktu,
        };

        // Kirim respons
        res.status(200).json({
            success: true,
            statusCode: res.statusCode,
            data: responseData,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const extendPeminjamanHandler = async (req, res) => {
    const { peminjamanId } = req.params;
    const { newEndTime } = req.body;
    const { userId } = req.username;

    try {
        let peminjaman = await Cnc.findOne({ _id: peminjamanId, user: userId });
        if (!peminjaman) {
            peminjaman = await Laser.findOne({ _id: peminjamanId, user: userId });
        }
        if (!peminjaman) {
            peminjaman = await Printing.findOne({ _id: peminjamanId, user: userId });
        }

        if (!peminjaman) {
            return res.status(404).json({ message: 'Data tidak ditemukan' });
        }

        const now = new Date();
        if (now > peminjaman.akhir_peminjaman) {
            return res.status(400).json({ message: 'Peminjaman sudah berakhir' });
        }

        if (peminjaman.extended_count >= 2) {
            return res.status(400).json({ message: 'Batas perpanjangan sudah tercapai' });
        }

        peminjaman.akhir_peminjaman = new Date(newEndTime);
        peminjaman.extended_count += 1;
        await peminjaman.save();

        // Kirim update ke ESP32
        try {
            await axios.post(peminjaman.alamat_esp, {
                button: true,
                newEndTime: peminjaman.akhir_peminjaman.toISOString()
            });
        } catch (error) {
            console.error('Error sending update to ESP32:', error);
        }

        res.status(200).json({
            success: true,
            message: 'Waktu peminjaman berhasil diperpanjang',
            data: peminjaman
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperpanjang waktu peminjaman'
        });
    }
};

const updateExpiredPeminjaman = async () => {
    const now = new Date();
    const models = [Cnc, Laser, Printing];
    let totalUpdated = 0;

    for (const Model of models) {
        const result = await Model.updateMany(
            { 
                status: { $in: ['Menunggu', 'Diproses'] },
                awal_peminjaman: { $lt: now }
            },
            { 
                $set: { 
                    status: 'Ditolak',
                    alasan: 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.'
                }
            }
        );
        totalUpdated += result.nModified;
    }

    console.log(`${totalUpdated} peminjaman diperbarui pada ${now}`);
};

// Jalankan fungsi ini secara berkala, misalnya setiap 5 menit
const updateInterval = 5 * 60 * 1000; // 5 menit dalam milidetik
setInterval(updateExpiredPeminjaman, updateInterval);

module.exports = {
    upload,
    peminjamanHandler,
    getPeminjamanAllHandler,
    getPeminjamanByIdHandler,
    extendPeminjamanHandler,
    updateExpiredPeminjaman
};
