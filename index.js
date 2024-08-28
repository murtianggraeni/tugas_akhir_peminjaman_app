require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routeUser = require('./routes/routeAuth');
const routePeminjaman = require('./routes/routeUser');
const routeAdmin = require('./routes/routeAdmin');
const routeSensor = require('./routes/routeSensor');
const connectDb = require('./config/db');
const autoRejectPeminjaman = require('./tasks/cronJobs'); // Mengimpor cronJobs.js untuk memulai cron job

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
app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
})

