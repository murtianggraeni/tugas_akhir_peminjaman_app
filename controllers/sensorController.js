// sensorController.js

const { CncSensor, LaserSensor, PrintingSensor } = require('../models/sensorModel');

const getModelByType = (type) => {
    switch (type) {
        case 'cnc':
            return CncSensor;
        case 'laser':
            return LaserSensor;
        case 'printing':
            return PrintingSensor;
        default:
            throw new Error ('Invalid type parameter');
    }
};

const buttonPeminjaman = async (req, res) => {
    const { type } = req.params;
    const { button } = req.body;
    const Model = getModelByType(type);
    
    try {
        const SensorModel = await Model.create({
            button,
        })

        res.status(201).json({
            success: true,
            statusCode: res.statusCode,
            message: "Terunggah",
            data: SensorModel
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error mengunggah data"
        });
    }
}

// const getLatestData = async (req, res) => {
//     const { type } = req.params;
//     const Model = getModelByType(type);

//     try {
//         const latestData = await Model.findOne().sort({ waktu : -1 });

//         if (!latestData) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No data found"
//             });
//         }
//         res.status(200).json({
//             success: true,
//             statusCode: res.statusCode,
//             data: latestData
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Error retrieving data"
//         });
//     }
// }

const getLatestData = async (req, res) => {
    const { type } = req.params;
    const Model = getModelByType(type);

    try {
        const latestButtonData = await Model.findOne({ button: { $exists: true } }).sort({ waktu: -1 });
        const latestCurrentData = await Model.findOne({ current: { $exists: true } }).sort({ waktu: -1 });

        if (!latestButtonData && !latestCurrentData) {
            return res.status(404).json({
                success: false,
                message: "No data found"
            });
        }

        const responseData = {
            button: latestButtonData ? latestButtonData.button : false,
            current: latestCurrentData ? latestCurrentData.current : null,
            waktu: latestCurrentData ? latestCurrentData.waktu : latestButtonData.waktu
        };

        res.status(200).json({
            success: true,
            statusCode: res.statusCode,
            data: responseData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error retrieving data"
        });
    }
}

const updateCurrent = async (req, res) => {
    const { type } = req.params;
    const { current } = req.body;
    const Model = getModelByType(type);
    
    try {
        const SensorModel = await Model.create({
            current,
        })

        res.status(201).json({
            success: true,
            statusCode: res.statusCode,
            message: "Data arus terunggah",
            data: SensorModel
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error mengunggah data arus"
        });
    }
}

const getLatestCurrent = async (req, res) => {
    const { type } = req.params;
    const Model = getModelByType(type);

    try {
        const latestCurrentData = await Model.findOne({ current: { $exists: true } }).sort({ waktu: -1 });

        if (!latestCurrentData) {
            return res.status(404).json({
                success: false,
                message: "No current data found"
            });
        }

        res.status(200).json({
            success: true,
            statusCode: res.statusCode,
            data: {
                current: latestCurrentData.current,
                waktu: latestCurrentData.waktu
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error retrieving current data"
        });
    }
}

module.exports = {buttonPeminjaman, getLatestData, updateCurrent, getLatestCurrent};