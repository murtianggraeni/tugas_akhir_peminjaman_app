// peminjamanModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const peminjamanSchema = new mongoose.Schema({
    nama_mesin: {
        type: String,
    },
    alamat_esp: {
        type: String,  // URL untuk mengakses ESP32 yang sesuai
    },
    email: {
        type: String,
        // required: true
    },
    nama_pemohon: {
        type: String,
        // required: true
    },
    tanggal_peminjaman: {
        type: Date,
        // required: true,
        get: (value) => {
            if (!value) return null;
            return value.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        }
    },
    awal_peminjaman: {
        type: Date,
        // required: true,
        get: (value) => value ? value.toLocaleTimeString('en-GB', { hour12: true, timeZone: 'Asia/Jakarta' }) : null,
        set: (value) => {
            // Convert the input like "1:00 PM" to a Date object
            const date = new Date();
            const [time, modifier] = value.split(' ');
            let [hours, minutes] = time.split(':');
            
            if (modifier === 'PM' && hours !== '12') {
                hours = parseInt(hours, 10) + 12;
            }
            if (modifier === 'AM' && hours === '12') {
                hours = '00';
            }
            
            date.setHours(parseInt(hours), parseInt(minutes), 0);
            date.setHours(date.getHours()); // Adjust for Jakarta timezone (UTC+7)
            return date;
        }
    },
    akhir_peminjaman: {
        type: Date,
        // required: true,
        get: (value) => value ? value.toLocaleTimeString('en-GB', { hour12: true, timeZone: 'Asia/Jakarta' }) : null,
        set: (value) => {
            // Convert the input like "1:00 PM" to a Date object
            const date = new Date();
            const [time, modifier] = value.split(' ');
            let [hours, minutes] = time.split(':');
            
            if (modifier === 'PM' && hours !== '12') {
                hours = parseInt(hours, 10) + 12;
            }
            if (modifier === 'AM' && hours === '12') {
                hours = '00';
            }
            
            date.setHours(parseInt(hours), parseInt(minutes), 0);
            date.setHours(date.getHours()); // Adjust for Jakarta timezone (UTC+7)
            return date;
        }
    },    
    jumlah: {
        type: Number,
        required: true
    },
    jurusan : {
        type: String,
        // required: true
    },
    program_studi: {
        type: String,
        // required: true
    },
    kategori: {
        type: String,
        // required: true
    },
    detail_keperluan: {
        type: String,
    },    
    desain_benda: {
        type: String,
        // required: true
    },
    status: {
        type: String,
    },
    alasan: {
        type: String,
    },
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    waktu: {
        type: Date,
        default: Date.now,
    },
    extended_count: {
        type: Number,
        default: 0
    },
    original_akhir_peminjaman: {
        type: Date
    }
});

// Pre-save hook untuk mengatur original_akhir_peminjaman
peminjamanSchema.pre('save', function(next) {
    if (this.isNew) {
        this.original_akhir_peminjaman = this.akhir_peminjaman;
    }
    next();
});

// Pre-save hook untuk menolak jika sudah melewati jam peminjaman dan status masih diproses
peminjamanSchema.pre('save', async function(next) {
    const now = new Date();
    if ((this.status === 'Menunggu' || this.status === 'Diproses') && now > this.awal_peminjaman) {
        this.status = 'Ditolak';
        this.alasan = 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.';
        console.log(`Peminjaman ${this._id} ditolak otomatis karena melewati batas waktu.`);
    }
    next();
});

peminjamanSchema.pre('findOneAndUpdate', async function(next) {
    const now = new Date();
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate && (docToUpdate.status === 'Menunggu' || docToUpdate.status === 'Diproses') && now > docToUpdate.awal_peminjaman) {
        this.set({ status: 'Ditolak', alasan: 'Peminjaman otomatis ditolak karena melebihi batas awal peminjaman.' });
        console.log(`Peminjaman ${docToUpdate._id} ditolak otomatis saat update karena melewati batas waktu.`);
    }
    next();
});

const Cnc = mongoose.model('Cnc', peminjamanSchema);
const Laser = mongoose.model('Laser', peminjamanSchema);
const Printing = mongoose.model('Printing', peminjamanSchema);

module.exports = {Cnc, Laser, Printing};

// tanggal_peminjaman: {
//     type: Date,
//     get: (value) => value ? value.toISOString() : null,
// },
// awal_peminjaman: {
//     type: Date,
//     get: (value) => value ? value.toISOString() : null,
// },
// akhir_peminjaman: {
//     type: Date,
//     get: (value) => value ? value.toISOString() : null,
// },
// // -- Metode 2 --
// // awal_peminjaman: {
// //     type: Date,  // Tidak perlu format manual, gunakan ISO 8601 default
// // },
// // akhir_peminjaman: {
// //     type: Date,  // Tidak perlu format manual, gunakan ISO 8601 default
// // },