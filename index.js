require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routeUser = require('./routes/routeAuth');
const routePeminjaman = require('./routes/routeUser');
const routeAdmin = require('./routes/routeAdmin');
const connectDb = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
connectDb();
app.get('/', (req, res) => {
    res.send("Api Ready")
})
app.use('/admin', routeAdmin);
app.use('/auth', routeUser);
app.use('/user', routePeminjaman);

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
})

