const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {username, email, password, role} = req.body;

    const user = await User.findOne({
        email: email,
    })

    if(!username || !email || !password || !role)
        return res.status(400).json({
            success: false,
            statusCode: res.statusCode,
            message: "Please complate input data"
        });
    
    const emailRegex = /@gmail\.(com|id)$/i;
    if(!emailRegex.test(email))
        return res.status(400).json({
            success: false,
            statusCode: res.statusCode,
            message: 'Invalid format email',
        })

    if(user)
        return res.status(400).json({
            success: false,
            statusCode: res.statusCode,
            message: 'Your email has been registered!',
    })

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await User.create({
            username: username, 
            email: email, 
            password: hashPassword, 
            role: role
        });
        res.status(201).json({
            success: true,
            statusCode: res.statusCode,
            message: "Register Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            statusCode: res.statusCode,
            error: {
                message: error.message,
                uri: req.originalUrl,
            },
        });
        console.log(error);
    }
}

const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({
            email: email,
        })
    
        if(!email || !password)
            return res.status(400).json({
                success: false,
                statusCode: res.statusCode,
                message: "Please complate input data"
            });
        
        const emailRegex = /@gmail\.(com|id)$/i;
        if(!emailRegex.test(email))
            return res.status(400).json({
                success: false,
                statusCode: res.statusCode,
                message: 'Invalid format email',
            })
    
        if(!user)
            return res.status(404).json({
                success: false,
                statusCode: res.statusCode,
                message: 'User Not Found',
        })
    
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(400).json({
                success: false,
                statusCode: res.statusCode,
                message: "Password Wrong!!!",
            })
    
        const userId = user._id;
        const userName = user.username;
        const emailId = user.email;
    
        const accessToken = jwt.sign({
            userId, userName, emailId
        }, process.env.ACCESS_TOKEN_SECRET);
        const refreshToken = jwt.sign({
            userId, userName, emailId
        }, process.env.REFRESH_TOKEN_SECRET);
    
        await User.updateOne(
            {_id: userId}, 
            {$set: { refresh_token: refreshToken}}
        );
    
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
    
        res.status(201).json({
            success: true,
            statusCode: res.statusCode,
            message: "Login Success",
            data: {
                userId,
                email,
                userName,
                accessToken
            }
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            statusCode: res.statusCode,
            error: {
                message: "Internal Server Error",
                uri: req.originalUrl,
            },
        });
    }
    
}

module.exports = {register, login};