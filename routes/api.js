const express = require('express')
const app = express.Router()
const moment = require('moment')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const multer  = require('multer')
const path  = require('path')

const { getCustomers, getCustomerById, addCustomers, editCustomer, getCustomerGroups } = require('../models/customers')
const { getMyRoutes, getRoutes } = require('../models/routes')
const { finishDelivery, saveLocation, getAllTruckLocation, getTruckLocation, getAllCustomersLocation, saveArrivalImageFile, ongoingDrivers } = require('../models/tracking')
const { getSettings } = require('../models/settings')
const { loginUser, initUserToken } = require('../models/users')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const newFileName = `arrival-${Date.now()}${ext}`;
        cb(null, newFileName);
    }
});
const upload = multer({ storage: storage });

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.post('/api/login', async(req,res) => {
    const username = req.body.username ?? null
    const password = req.body.password ?? null
    const remember = req.body.remember ?? false

    if(!username || !password) {
        res.json({
            status: 'error',
            message: "โปรดกรอกชื่อผู้ใช้และรหัสผ่าน"
        })
        res.end()
    }

    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const auth = await loginUser(username, password_hash)

    if(auth.length == 1) {
        let maxAge = 24 * 60 * 60 * 1000
        if(remember) {
            maxAge =  10 * 365 * 24 * 60 * 60 * 1000
        }
        res.cookie('auth', btoa(auth[0].username + ":" + password_hash), {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: maxAge
        });
        res.json({
            status: 'success',
            token: btoa(auth[0].username + ":" + password_hash)
        })
        res.end()
    } else {
        res.json({
            status: 'error',
            message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
        })
        res.end()
    }
})

app.get('/api/driver/getMyRoute', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const driver_id = auth.user.id
    const date = moment().format("YYYY-MM-DD")
    const routes = await getMyRoutes(driver_id)
    res.json(routes)
})

app.get('/api/driver/getAllTruckLocation', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const data = await getAllTruckLocation()
    res.json(data)
})

app.get('/api/driver/ongoingDrivers', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const data = await ongoingDrivers()
    res.json(data)
})

app.get('/api/admin/getAllCustomersLocation', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const data = await getAllCustomersLocation()
    res.json(data)
})

app.get('/api/admin/getCurrentRoutes', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const date = req.query.date ?? null
    const search = req.query.search ?? null
    const status = req.query.status ?? null

    const data = await getRoutes(date, search, status)
    res.json(data)
})

app.get('/api/getPointOfInterest/:group_id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const data = await getAllCustomersLocation(req.params.group_id)
    res.json(data)
})

app.get('/api/driver/getTruckLocation/:truck_id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const truck_id = req.params.truck_id;
    const data = await getTruckLocation(null, truck_id)
    res.json(data)
})

app.get('/api/driver/getTruckLocation/:truck_id/:date', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const truck_id = req.params.truck_id;
    const date = req.params.date ?? null
    const data = await getTruckLocation(date, truck_id)
    res.json(data)
})

app.get('/api/finishDelivery/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    try {
        const finish_at = moment().format("YYYY-MM-DD HH:mm:ss");
        const id = req.params.id;
        
        const result = await finishDelivery(id, finish_at);

        if (result === "success" || (result && result.status === "success")) {
            return res.json({
                status: "success",
                message: "อัปเดตสถานะการส่งสินค้าเสร็จสิ้น"
            });
        } else {
            return res.status(400).json({
                status: "failed",
                message: "ไม่สามารถเปลี่ยนสถานะในระบบได้"
            });
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะอัปเดตงาน:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

app.get('/api/saveLocation/:truck_id/:driver_id/:position_latitude/:position_longitude', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    try {
        const truck_id = req.params.truck_id;
        const driver_id = req.params.driver_id;
        const position_latitude = req.params.position_latitude;
        const position_longitude = req.params.position_longitude;

        const result = await saveLocation(truck_id, driver_id, position_latitude, position_longitude);

        if (result === "success" || (result && result.status === "success")) {
            return res.json({
                status: "success",
            });
        } else {
            return res.status(400).json({
                status: "failed",
                message: "ไม่สามารถเพิ่มข้อมูลลงในระบบได้"
            });
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะบันทึกตำแหน่ง:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

app.post('/api/driver/uploadArrivalImage', (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            return res.status(400).json({
                status: 'error',
                message: err.message
            });
        }
        next();
    });
}, async (req, res) => {
    if (!req.cookies.auth) {
        return res.redirect('/login');
    }
    
    const auth = await initUserToken(req.cookies.auth);
    if (auth.status !== 'success') {
        return res.redirect('/login');
    }

    const route_id = req.body.route_id

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    const filenames = req.files.map(file => file.filename);
    const saveDataStatus = await saveArrivalImageFile(route_id, filenames)

    if(saveDataStatus.status == "success") {
        return res.json({
            status: "success",
            filenames: filenames
        });
    } else {
        return res.status(500).json({
            status: "error",
            message: saveDataStatus.message
        });
    }
});

module.exports = app;