const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
    },
    peminjamanCnc: [{ type: Schema.Types.ObjectId, ref: 'Cnc' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;