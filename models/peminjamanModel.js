const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const peminjamanSchema = new mongoose.Schema({
    nama_mesin: {
        type: String,
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
})

const Cnc = mongoose.model('Cnc', peminjamanSchema);
const Laser = mongoose.model('Laser', peminjamanSchema);
const Printing = mongoose.model('Printing', peminjamanSchema);

module.exports = {Cnc, Laser, Printing};