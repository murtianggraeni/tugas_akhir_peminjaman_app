require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const routeUser = require('./routes/routeAuth');
const routePeminjaman = require('./routes/routeUser');
const routeAdmin = require('./routes/routeAdmin');
const routeSensor = require('./routes/routeSensor');
const connectDb = require('./config/db');

const { updateExpiredPeminjaman } = require('./controllers/userController');
const { getAndUpdateCounts } = require('./controllers/countController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
connectDb();
app.get('/', (req, res) => {
    res.send("API Ready")
})
app.use('/admin', routeAdmin);
app.use('/auth', routeUser);
app.use('/user', routePeminjaman);
app.use('/sensor', routeSensor);

const port = process.env.PORT ||3000

app.listen(port, async () => {
    console.log(`Server berjalan di port ${port}`);
    try {
        // Perbarui data expired peminjaman dan count saat startup
        await updateExpiredPeminjaman();
        await getAndUpdateCounts();
        console.log('Initial update of expired peminjaman and counts completed');
        
        // Schedule task to update peminjaman and counts every 5 minutes
        scheduleUpdateExpiredPeminjaman();
    } catch (error) {
        console.error('Error during startup:', error);
    }
});

// Fungsi untuk menjalankan pembaruan secara berkala setiap 5 menit
const scheduleUpdateExpiredPeminjaman = () => {
    cron.schedule('*/5 * * * *', async () => {
        console.log('Menjalankan pemeriksaan peminjaman kedaluwarsa...');
        try {
            await updateExpiredPeminjaman();
            await getAndUpdateCounts();
            console.log('Pemeriksaan peminjaman kedaluwarsa dan update counts selesai');
        } catch (error) {
            console.error('Error during scheduled update:', error);
        }
    });
};

// app.listen(port, async () => {

//     console.log(`Server berjalan di port ${port}`);
//     await updateExpiredPeminjaman();
//     console.log('Initial update of expired peminjaman completed');
// })