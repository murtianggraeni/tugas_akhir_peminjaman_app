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
        enum: ['user', 'admin'], 
        default: 'user',
        required: true,
    },
    refresh_token: {
        type: String,
        default: null,
    },
    peminjamanCnc: [{ type: Schema.Types.ObjectId, ref: 'Cnc' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;