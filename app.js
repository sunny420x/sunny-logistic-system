const express = require('express');
const app = express();
const path = require('path');
const db = require('./database');
const moment = require('moment');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { getCustomers, getCustomerById, addCustomers, editCustomer } = require('./models/customers')
const { getDashboardAllPackages, getDashboardCustomers, getDashboardDelivered, getDashboardUsers } = require('./models/dashboard')
const { getTrucks, getTruckById, addTruck, editTruck } = require('./models/trucks')
const { getRoutes, getMyRoutes, getRouteById, addRoute, editRoute } = require('./models/routes')
const { finishDelivery, saveLocation, getAllTruckLocation, getTruckLocation } = require('./models/tracking')
const { getSettings, saveSettings } = require('./models/settings')
const { loginUser, getUsers, registerUser, getUserTypes, getUserById, editUser, getDrivers, initUserToken } = require('./models/users')

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', async(req,res) => {
    if(req.cookies.auth) {
        const auth = await initUserToken(req.cookies.auth)
        if(auth.status == "success") {
            if(auth.user.type_id == "2") {
                res.redirect('/driver/myRoute')
            } else {
                res.redirect('/admin')
            }
        }
    } else {
        res.render('login', {
            settings: await getSettings(),
        })
    }
})

app.get("/logout", (req,res) => {
    res.clearCookie('auth')
    res.redirect('/')
})

app.post('/api/login', async(req,res) => {
    const username = req.body.username ?? null
    const password = req.body.password ?? null

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

app.get('/driver/myRoute', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    
    res.render('driver', {
        driver_id: auth.user.id,
        auth: auth,
        settings: await getSettings(),
    });
});

app.get('/api/driver/getMyRoute', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')

    const driver_id = auth.user.id
    const date = moment().format("YYYY-MM-DD")
    const routes = await getMyRoutes(driver_id)
    res.json(routes)
})

app.get('/api/driver/getAllTruckLocation', async(req,res) => {
    const data = await getAllTruckLocation()
    res.json(data)
})

app.get('/api/driver/getTruckLocation/:driver_id/:date', async(req,res) => {
    const driver_id = req.params.driver_id;
    const date = req.params.date ?? null
    const data = await getTruckLocation(date, driver_id)
    res.json(data)
})

app.get('/api/finishDelivery/:id', async (req, res) => {
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

app.get('/admin', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('dashboard')) res.end("Permission denial") //Check Permission

    const delivered = await getDashboardDelivered(moment().format("YYYY-MM-DD"))
    const all_package = await getDashboardAllPackages(moment().format("YYYY-MM-DD"))
    const customers = await getDashboardCustomers()
    const users = await getDashboardUsers()

    res.render('admin/dashboard', {
        page: 'dashboard',
        moment: moment,
        delivered: delivered,
        all_package: all_package,
        customers: customers,
        auth: auth,
        users:users,
        settings: await getSettings(),
    })
})
app.get('/admin/help', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('dashboard')) res.end("Permission denial") //Check Permission

    const customers = await getCustomers() ?? [];
    res.render('admin/help', {
        auth: auth,
        page: 'help',
        settings: await getSettings(),
    })
})

// Customers
app.get('/admin/customers', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission

    const search = req.query.q ?? null
    const customers = await getCustomers(search) ?? [];

    res.render('admin/customers', {
        customers: customers,
        auth: auth,
        page: 'customers',
        settings: await getSettings(),
    })
})
app.get('/admin/customers/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission
    
    res.render('admin/customers/add', {
        auth: auth,
        settings: await getSettings(),
        page: 'customers'
    })
})
app.post('/admin/customers/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission
    
    const customer_name = req.body.customer_name
    const customer_id = req.body.customer_id
    const location = req.body.location

    if(location.split(",").length != 2) {
        res.end("พิกัดที่อยู่ลูกค้าไม่ถูกต้อง")
    }

    addCustomers(customer_name, customer_id, location).then(() => {
        res.redirect('/admin/customers')
    })
})
app.get('/admin/customers/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;
    const customer = await getCustomerById(id)
    res.render('admin/customers/edit', {
        customer: customer[0],
        auth: auth,
        settings: await getSettings(),
        page: 'customers'
    })
})
app.post('/admin/customers/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const customer_name = req.body.customer_name
    const customer_id = req.body.customer_id
    const location = req.body.location

    if(location.split(",").length != 2) {
        res.end("พิกัดที่อยู่ลูกค้าไม่ถูกต้อง")
    }

    editCustomer(id, customer_name, customer_id, location).then(() => {
        res.redirect('/admin/customers/edit/'+id)
    })
})

// Routes
app.get('/admin/routes', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission

    const date = req.query.date ?? null
    const search = req.query.q ?? null
   
    const routes = await getRoutes(date, search)
    res.render('admin/routes', {
        routes: routes,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'routes'
    })
})
app.get('/admin/routes/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const customers = await getCustomers()
    const trucks = await getTrucks()
    const drivers = await getDrivers()

    res.render('admin/routes/add', {
        customers: customers,
        auth: auth,
        trucks:trucks,
        drivers:drivers,
        settings: await getSettings(),
        page: 'routes'
    })
})
app.post('/admin/routes/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const customer_id = req.body.customer_id
    const truck_id = req.body.truck_id
    const driver_id = req.body.driver_id
    const date = req.body.date
    const weight = req.body.weight

    addRoute(customer_id, truck_id, driver_id, date, weight).then(() => {
        res.redirect('/admin/routes')
    })
})
app.get('/admin/routes/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;
    const customers = await getCustomers()
    const trucks = await getTrucks()
    const drivers = await getDrivers()
    const route = await getRouteById(id)

    res.render('admin/routes/edit', {
        customers: customers,
        trucks:trucks,
        auth: auth,
        route: route[0],
        page: 'routes',
        drivers:drivers,
        settings: await getSettings(),
        moment: moment
    })
})
app.post('/admin/routes/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const customer_id = req.body.customer_id
    const truck_id = req.body.truck_id
    const driver_id = req.body.driver_id
    const date = req.body.date
    const weight = req.body.weight

    editRoute(id, customer_id, truck_id, driver_id, date, weight).then(() => {
        res.redirect('/admin/routes/edit/'+id)
    })
})

app.listen(process.env.PORT ?? 3000, () => {
    console.log('[+] Sunny Logistic server is running on http://localhost:'+process.env.PORT);
});

// Trucks
app.get('/admin/trucks', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const search = req.query.q ?? null
    const trucks = await getTrucks(search) ?? [];

    res.render('admin/trucks', {
        trucks: trucks,
        auth: auth,
        settings: await getSettings(),
        page: 'trucks'
    })
})
app.get('/admin/trucks/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    res.render('admin/trucks/add', {
        auth: auth,
        settings: await getSettings(),
        page: 'trucks'
    })
})
app.post('/admin/trucks/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const license_plate = req.body.license_plate
    const brand = req.body.brand
    const model = req.body.model
    const cost_per_km = req.body.cost_per_km ?? 0

    addTruck(license_plate, brand, model, cost_per_km).then(() => {
        res.redirect('/admin/trucks')
    })
})
app.get('/admin/trucks/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;
    const truck = await getTruckById(id)
    res.render('admin/trucks/edit', {
        truck: truck[0],
        auth: auth,
        settings: await getSettings(),
        page: 'trucks'
    })
})
app.post('/admin/trucks/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const license_plate = req.body.license_plate
    const brand = req.body.brand
    const model = req.body.model
    const cost_per_km = req.body.cost_per_km ?? 0

    editTruck(id, license_plate, brand, model, cost_per_km).then(() => {
        res.redirect('/admin/trucks/edit/'+id)
    })
})

app.get('/admin/trucks/locations/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const date = req.query.date ?? null

    res.render('admin/trucks/location_history', {
        date: date,
        truck_id: req.params.id,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'routes'
    })
})
//Users
app.get('/admin/users', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const search = req.query.q ?? null
    const users = await getUsers(search) ?? [];

    res.render('admin/users', {
        users: users,
        auth: auth,
        settings: await getSettings(),
        page: 'users'
    })
})
app.get('/admin/users/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const user_types = await getUserTypes() ?? []
    res.render('admin/users/add', {
        page: 'users',
        auth: auth,
        settings: await getSettings(),
        user_types: user_types
    })
})
app.post('/admin/users/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const username = req.body.username
    const password = req.body.password
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const type_id = req.body.type_id
    const phone_number = req.body.phone_number
    const full_name = req.body.full_name

    registerUser(username, password_hash, full_name, type_id, phone_number).then(() => {
        res.redirect('/admin/users')
    })
})
app.get('/admin/users/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;
    const user = await getUserById(id)
    const user_types = await getUserTypes() ?? []
    res.render('admin/users/edit', {
        user: user,
        auth: auth,
        user_types: user_types,
        settings: await getSettings(),
        page: 'users'
    })
})
app.post('/admin/users/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const username = req.body.username
    const type_id = req.body.type_id
    const phone_number = req.body.phone_number
    const full_name = req.body.full_name

    editUser(id, username, full_name, type_id, phone_number).then(() => {
        res.redirect('/admin/users/edit/'+id)
    })
})

app.get('/admin/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('settings')) res.end("Permission denial") //Check Permission
   
    res.render('admin/settings', {
        auth: auth,
        settings: await getSettings(),
        page: 'settings'
    })
})

app.post('/admin/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('settings')) res.end("Permission denial") //Check Permission

    const company_name = req.body.company_name
    const company_logo = req.body.company_logo
    const company_banner = req.body.company_banner

    saveSettings(company_name, company_logo, company_banner).then(() => {
        res.redirect('/admin/settings')
    })
})