// userController.js
const { checkAvailability } = require('../middleware/checkAvailability');
const axios = require('axios'); // Untuk mengirim request ke ESP32
const { google } = require('googleapis');
const { Readable } = require('stream');
const { Cnc, Laser, Printing } = require('../models/peminjamanModel');
const SCOPE = ['https://www.googleapis.com/auth/drive'];

const multer = require('multer');

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// const oauth2Client = new google.auth.JWT(
//     process.env.client_email, 
//     null,
//     process.env.private_key.replace(/\\n/g, '\n'),
//     SCOPE
// );

// Set up Google Drive API
const oauth2Client = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive.file']
  );

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    // Check MIME type and extension
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      ['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and DOCX are allowed.'));
    }
  }
});


// function bufferToStream(buffer) {
//     const stream = new Readable();
//     stream.push(buffer);
//     stream.push(null);
//     return stream;
// }

// const uploadFileToDrive = async (fileBuffer, fileName) => {
//     try {
//         const fileStream = bufferToStream(fileBuffer);  // Konversi buffer ke stream

//         const response = await drive.files.create({
//             requestBody: {
//                 name: fileName,
//                 mimeType: 'application/octet-stream',
//                 parents: ['1qIuyp30TAd2ALalYosfn9qv2DBcK9fiZ'] 
//             },
//             media: {
//                 mimeType: 'application/octet-stream',
//                 body: fileStream,  // Gunakan stream di sini
//             },
//         });

//         await drive.permissions.create({
//             fileId: response.data.id,
//             requestBody: {
//                 role: 'reader',
//                 type: 'anyone',
//             },
//         });

//         const file = await drive.files.get({
//             fileId: response.data.id,
//             fields: 'webViewLink',
//         });

//         return file.data.webViewLink;
//     } catch (error) {
//         console.error('Error uploading file to Google Drive:', error);
//         throw error;
//     }
// };

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

const uploadFileToDrive = async (fileBuffer, fileName, mimeType) => {
    try {
        const fileStream = bufferToStream(fileBuffer);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: mimeType,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: mimeType,
                body: fileStream,
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
    
    const { email, nama_pemohon, tanggal_peminjaman, awal_peminjaman, akhir_peminjaman, jumlah, jurusan, detail_keperluan, program_studi, kategori, desain_benda } = req.body;
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
        console.log('Checking availability for the selected time slot...');

        const isAvailable = await checkAvailability(
            Model, 
            tanggal_peminjaman,
            convertedAwalPeminjaman,
            convertedAkhirPeminjaman
        );
        
        if (!isAvailable) {
            console.log('Selected time slot is not available.');
            return res.status(409).json({
                success: false,
                message: "Waktu yang dipilih tidak tersedia. Silakan pilih waktu lain."
            });
        }

        console.log('Time slot is available, proceeding with saving peminjaman...');


        const fileLink = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);

        console.log('File uploaded successfully, saving peminjaman...');

        // const fileLink = await uploadFileToDrive(req.file.buffer, req.file.originalname);
        const peminjamanEntry = await Model.create({
            nama_mesin: mesinName,
            alamat_esp,  // Menyimpan alamat_esp yang telah ditentukan
            email,
            nama_pemohon,
            tanggal_peminjaman,
            awal_peminjaman: convertedAwalPeminjaman,
            akhir_peminjaman: convertedAkhirPeminjaman,
            // tanggal_peminjaman,
            // awal_peminjaman,
            // akhir_peminjaman,
            jumlah,
            jurusan,
            detail_keperluan,
            program_studi,
            kategori,
            desain_benda: fileLink, // Simpan link file yang diunggah
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
                desain_benda: fileLink,
                status: peminjamanEntry.status,
                waktu: peminjamanEntry.waktu,
                user: userName
            }
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Ukuran file melebihi batas maksimum (2MB)'
            });
        }
        res.status(500).json({
            success: false,
            message: "Error saat membuat peminjaman atau mengunggah file",
            error: err.message
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

// const updateExpiredPeminjaman = async () => {
//     const now = new Date();
//     const models = [Cnc, Laser, Printing];
//     let totalUpdated = 0;

//     for (const Model of models) {
//         const result = await Model.updateMany(
//             { 
//                 status: { $in: ['Menunggu', 'Diproses'] },
//                 $expr: {
//                     $lt: [
//                         { $add: [
//                             '$tanggal_peminjaman',
//                             { $multiply: [
//                                 { $hour: '$awal_peminjaman' },
//                                 60 * 60 * 1000
//                             ]},
//                             { $multiply: [
//                                 { $minute: '$awal_peminjaman' },
//                                 60 * 1000
//                             ]}
//                         ]},
//                         now
//                     ]
//                 }
//             },
//             { 
//                 $set: { 
//                     status: 'Ditolak',
//                     alasan: 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.'
//                 }
//             }
//         );
//         totalUpdated += result.modifiedCount;
//     }

//     console.log(`${totalUpdated} peminjaman diperbarui pada ${now}`);
// };

// const updateExpiredPeminjaman = async () => {
//     const models = [Cnc, Laser, Printing];
    
//     for (const Model of models) {
//         const expiredPeminjaman = await Model.find({
//             status: { $in: ['Menunggu', 'Diproses'] }
//         });

//         for (const peminjaman of expiredPeminjaman) {
//             try {
//                 await peminjaman.save();
//             } catch (error) {
//                 console.error(`Error updating peminjaman ${peminjaman._id}:`, error);
//             }
//         }
//     }
// };

// Fungsi untuk memeriksa dan memperbarui status peminjaman
const updateExpiredPeminjaman = async () => {
    try {
        const models = [Cnc, Laser, Printing];
        const now = new Date();
        let totalUpdated = 0;
        
        for (const Model of models) {
            const expiredPeminjaman = await Model.find({
                status: { $in: ['Menunggu', 'Diproses'] },
                tanggal_peminjaman: { $lte: now },
                awal_peminjaman: { $lte: now }
            });

            for (const peminjaman of expiredPeminjaman) {
                peminjaman.status = 'Ditolak';
                peminjaman.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
                await peminjaman.save();
                totalUpdated++;
            }
        }
        
        console.log(`${totalUpdated} peminjaman diperbarui karena kedaluwarsa.`);
        return totalUpdated > 0; // Return true if any peminjaman was updated
    } catch (error) {
        console.error('Error dalam updateExpiredPeminjaman:', error);
        return false;
    }
};

// const updateExpiredPeminjaman = async () => {
//     try {
//         const models = [Cnc, Laser, Printing];
//         const now = new Date();
        
//         for (const Model of models) {
//             const expiredPeminjaman = await Model.find({
//                 status: { $in: ['Menunggu', 'Diproses'] },
//                 tanggal_peminjaman: { $lte: now },
//                 awal_peminjaman: { $lte: now }
//             });

//             for (const peminjaman of expiredPeminjaman) {
//                 peminjaman.status = 'Ditolak';
//                 peminjaman.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
//                 await peminjaman.save();
//                 console.log(`Peminjaman ${peminjaman._id} ditolak otomatis.`);
//             }
//         }
        
//         // Update counts after updating peminjaman
//         await getCounts(null, {
//             status: () => {},
//             json: (data) => {
//                 console.log('Counts updated:', data);
//             }
//         });
        
//         console.log('Pembaruan peminjaman kadaluarsa dan counts selesai');
//     } catch (error) {
//         console.error('Error dalam updateExpiredPeminjaman:', error);
//     }
// };



// const updateExpiredPeminjaman = async () => {
//     const models = [Cnc, Laser, Printing];
//     const now = new Date();
    
//     for (const Model of models) {
//         const expiredPeminjaman = await Model.find({
//             status: { $in: ['Menunggu', 'Diproses'] },
//             tanggal_peminjaman: { $lte: now },
//             awal_peminjaman: { $lte: now }
//         });

//         for (const peminjaman of expiredPeminjaman) {
//             peminjaman.status = 'Ditolak';
//             peminjaman.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
//             await peminjaman.save();
//             console.log(`Peminjaman ${peminjaman._id} ditolak otomatis.`);
//         }
//     }
// };


// const updateExpiredPeminjaman = async () => {
//     const models = [Cnc, Laser, Printing];
//     const now = new Date();
//     console.log('Current server time:', now.toISOString());
    
//     for (const Model of models) {
//         const allPeminjaman = await Model.find({});
//         console.log(`Found ${allPeminjaman.length} total peminjaman for ${Model.modelName}`);

//         for (const peminjaman of allPeminjaman) {
//             const tanggalPeminjaman = new Date(peminjaman.tanggal_peminjaman);
//             let awalPeminjaman;
            
//             if (typeof peminjaman.awal_peminjaman === 'string') {
//                 const [hours, minutes] = peminjaman.awal_peminjaman.split(':');
//                 awalPeminjaman = new Date(tanggalPeminjaman);
//                 awalPeminjaman.setHours(parseInt(hours), parseInt(minutes), 0, 0);
//             } else if (peminjaman.awal_peminjaman instanceof Date) {
//                 awalPeminjaman = new Date(tanggalPeminjaman);
//                 awalPeminjaman.setHours(peminjaman.awal_peminjaman.getHours(), peminjaman.awal_peminjaman.getMinutes(), 0, 0);
//             } else {
//                 console.error(`Invalid awal_peminjaman format for peminjaman ${peminjaman._id}:`, peminjaman.awal_peminjaman);
//                 continue;
//             }

//             console.log(`Peminjaman ${peminjaman._id}:`, {
//                 status: peminjaman.status,
//                 tanggal_peminjaman: tanggalPeminjaman.toISOString(),
//                 awal_peminjaman: awalPeminjaman.toISOString(),
//                 now: now.toISOString(),
//                 isExpired: now > awalPeminjaman
//             });

//             if ((peminjaman.status === 'Menunggu' || peminjaman.status === 'Diproses') && now > awalPeminjaman) {
//                 console.log(`Updating peminjaman ${peminjaman._id} to Ditolak`);
//                 peminjaman.status = 'Ditolak';
//                 peminjaman.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
//                 try {
//                     await peminjaman.save();
//                     console.log(`Updated peminjaman ${peminjaman._id} to Ditolak`);
//                 } catch (error) {
//                     console.error(`Error updating peminjaman ${peminjaman._id}:`, error);
//                 }
//             }
//         }
//     }
// };

// const updateExpiredPeminjaman = async () => {
//     const models = [Cnc, Laser, Printing];
//     const now = new Date();
//     console.log('Current server time:', now.toISOString());
    
//     for (const Model of models) {
//         const allPeminjaman = await Model.find({});
//         console.log(`Total ${allPeminjaman.length} peminjaman for ${Model.modelName}`);

//         let expiredCount = 0;

//         for (const peminjaman of allPeminjaman) {
//             let tanggalPeminjaman = new Date(peminjaman.tanggal_peminjaman);
//             let awalPeminjaman;

//             // Handle berbagai format awal_peminjaman
//             if (peminjaman.awal_peminjaman instanceof Date) {
//                 awalPeminjaman = peminjaman.awal_peminjaman;
//             } else if (typeof peminjaman.awal_peminjaman === 'string') {
//                 if (peminjaman.awal_peminjaman.includes('T')) {
//                     // Jika dalam format ISO
//                     awalPeminjaman = new Date(peminjaman.awal_peminjaman);
//                 } else {
//                     // Jika hanya waktu (HH:MM)
//                     const [hours, minutes] = peminjaman.awal_peminjaman.split(':');
//                     awalPeminjaman = new Date(tanggalPeminjaman);
//                     awalPeminjaman.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
//                 }
//             } else {
//                 console.error(`Invalid awal_peminjaman format for peminjaman ${peminjaman._id}:`, peminjaman.awal_peminjaman);
//                 continue;
//             }

//             const isExpired = awalPeminjaman < now && tanggalPeminjaman < now;

//             console.log(`Peminjaman ${peminjaman._id}:`, {
//                 status: peminjaman.status,
//                 tanggal_peminjaman: tanggalPeminjaman.toISOString(),
//                 awal_peminjaman: awalPeminjaman instanceof Date ? awalPeminjaman.toISOString() : peminjaman.awal_peminjaman,
//                 isExpired: isExpired,
//                 needsUpdate: isExpired && (peminjaman.status === 'Menunggu' || peminjaman.status === 'Diproses')
//             });

//             if (isExpired && (peminjaman.status === 'Menunggu' || peminjaman.status === 'Diproses')) {
//                 peminjaman.status = 'Ditolak';
//                 peminjaman.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
//                 await peminjaman.save();
//                 console.log(`Updated peminjaman ${peminjaman._id} to Ditolak`);
//                 expiredCount++;
//             }
//         }

//         console.log(`Found and updated ${expiredCount} expired peminjaman for ${Model.modelName}`);
//     }
// };


// Tambahkan fungsi untuk mengecek peminjaman secara manual
const checkPeminjamanStatus = async (req, res) => {
    const models = [Cnc, Laser, Printing];
    const now = new Date();
    const results = {};
    
    for (const Model of models) {
        const allPeminjaman = await Model.find({});
        const expiredPeminjaman = allPeminjaman.filter(p => {
            const tanggalPeminjaman = new Date(p.tanggal_peminjaman);
            let awalPeminjaman;
            if (p.awal_peminjaman instanceof Date) {
                awalPeminjaman = p.awal_peminjaman;
            } else if (typeof p.awal_peminjaman === 'string') {
                if (p.awal_peminjaman.includes('T')) {
                    awalPeminjaman = new Date(p.awal_peminjaman);
                } else {
                    const [hours, minutes] = p.awal_peminjaman.split(':');
                    awalPeminjaman = new Date(tanggalPeminjaman);
                    awalPeminjaman.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                }
            } else {
                console.error(`Invalid awal_peminjaman format for peminjaman ${p._id}:`, p.awal_peminjaman);
                return false;
            }
            return awalPeminjaman < now && tanggalPeminjaman < now;
        });
        
        results[Model.modelName] = {
            total: allPeminjaman.length,
            statusCounts: {
                Menunggu: allPeminjaman.filter(p => p.status === 'Menunggu').length,
                Disetujui: allPeminjaman.filter(p => p.status === 'Disetujui').length,
                Ditolak: allPeminjaman.filter(p => p.status === 'Ditolak').length,
                Diproses: allPeminjaman.filter(p => p.status === 'Diproses').length,
                Other: allPeminjaman.filter(p => !['Menunggu', 'Disetujui', 'Ditolak', 'Diproses'].includes(p.status)).length
            },
            expired: expiredPeminjaman.length,
            needsUpdate: expiredPeminjaman.filter(p => 
                p.status === 'Menunggu' || p.status === 'Diproses'
            ).length,
            details: allPeminjaman.map(p => {
                const tanggalPeminjaman = new Date(p.tanggal_peminjaman);
                let awalPeminjaman;
                if (p.awal_peminjaman instanceof Date) {
                    awalPeminjaman = p.awal_peminjaman;
                } else if (typeof p.awal_peminjaman === 'string') {
                    if (p.awal_peminjaman.includes('T')) {
                        awalPeminjaman = new Date(p.awal_peminjaman);
                    } else {
                        const [hours, minutes] = p.awal_peminjaman.split(':');
                        awalPeminjaman = new Date(tanggalPeminjaman);
                        awalPeminjaman.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    }
                } else {
                    console.error(`Invalid awal_peminjaman format for peminjaman ${p._id}:`, p.awal_peminjaman);
                    awalPeminjaman = null;
                }
                const isExpired = awalPeminjaman && tanggalPeminjaman < now && awalPeminjaman < now;
                return {
                    id: p._id,
                    status: p.status,
                    tanggal_peminjaman: p.tanggal_peminjaman,
                    awal_peminjaman: p.awal_peminjaman,
                    isExpired: isExpired,
                    needsUpdate: isExpired && (p.status === 'Menunggu' || p.status === 'Diproses')
                };
            })
        };
    }
    
    res.json(results);
};

// Jalankan fungsi ini secara berkala, misalnya setiap 5 menit
const updateInterval = 3 * 60 * 1000; // 5 menit dalam milidetik
setInterval(updateExpiredPeminjaman, updateInterval);

module.exports = {
    upload,
    peminjamanHandler,
    getPeminjamanAllHandler,
    getPeminjamanByIdHandler,
    extendPeminjamanHandler,
    updateExpiredPeminjaman,
    checkPeminjamanStatus
};
