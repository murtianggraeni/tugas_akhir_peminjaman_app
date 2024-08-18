// user controller
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

    if ((kategori === 'Praktek' || kategori === 'Proyek Mata Kuliah') && (!detail_keperluan || detail_keperluan.trim().length === 0)) {
        return res.status(400).json({
            success: false,
            statusCode: res.statusCode,
            message: "Detail keperluan wajib diisi"
        });
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
            email,
            nama_pemohon,
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
                email,
                nama_pemohon,
                tanggal_peminjaman,
                awal_peminjaman,
                akhir_peminjaman,
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

const getPeminjamanAllHandler = async (req, res) => {
    const { userId } = req.username; // Asumsi userId diambil dari req.username
    try {
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
            tanggal_peminjaman: item.tanggal_peminjaman,
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
module.exports = {
    upload,
    peminjamanHandler,
    getPeminjamanAllHandler,
    getPeminjamanByIdHandler
};
