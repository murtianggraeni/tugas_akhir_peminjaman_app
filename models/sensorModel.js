// sensorModel.js

const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema ({
    button : {
        type : Boolean
    },
    waktu : {
        type : Date,
        default : Date.now
    },
})

const CncSensor = mongoose.model('CncSensor', sensorSchema);
const LaserSensor = mongoose.model('LaserSensor', sensorSchema);
const PrintingSensor = mongoose.model('PrintingSensor', sensorSchema);

module.exports = {CncSensor, LaserSensor, PrintingSensor};