const express = require('express');
const app = express();
const path = require('path');
const moment = require('moment-timezone');
const cookieParser = require('cookie-parser');

// Models
const { getCustomers, getCustomerGroups } = require('./models/customers')
const { getDashboardAllPackages, getDashboardCustomers, getDashboardDelivered, getDashboardUsers } = require('./models/dashboard')
const { getMaintenanceAlerts } = require('./models/trucks')
const { ongoingDrivers } = require('./models/tracking')
const { getSettings, saveSettings, getCurrentVersion } = require('./models/settings')
const { initUserToken} = require('./models/users')

app.set('trust proxy', 1)
moment.tz.setDefault(process.env.TIMEZONE);

//Routes
const usersRoute = require('./routes/users')
const apiRoute = require('./routes/api')
const customersRoute = require('./routes/customers')
const transitionRoute = require('./routes/routes')
const trucksRoute = require('./routes/trucks')

app.use('/', usersRoute)
app.use('/', apiRoute)
app.use('/', customersRoute)
app.use('/', transitionRoute)
app.use('/', trucksRoute)

// Express Settings
require('dotenv').config()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get('/', async(req, res) => {
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
        res.redirect('/login');
    }
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
        version: await getCurrentVersion(),
        })
    }
})

app.get("/logout", (req,res) => {
    res.clearCookie('auth')
    res.redirect('/')
})

app.get('/driver/myRoute', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    
    res.render('driver', {
        auth: auth,
        settings: await getSettings(),
        version: await getCurrentVersion(),
    });
});

app.get('/admin', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('dashboard')) res.end("Permission denial") //Check Permission

    const delivered = await getDashboardDelivered(moment().format("YYYY-MM-DD"))
    const all_package = await getDashboardAllPackages(moment().format("YYYY-MM-DD"))
    const customers = await getDashboardCustomers()
    const users = await getDashboardUsers()
    const customer_groups = await getCustomerGroups()
    const ongoing_drivers = await ongoingDrivers()

    const maintenance_alerts = await getMaintenanceAlerts()

    res.render('admin/dashboard', {
        page: 'dashboard',
        moment: moment,
        delivered: delivered,
        all_package: all_package,
        customers: customers,
        customer_groups:customer_groups,
        ongoing_drivers:ongoing_drivers,
        auth: auth,
        users:users,
        maintenance_alerts: maintenance_alerts ?? [],
        settings: await getSettings(),
        version: await getCurrentVersion(),
    })
})
app.get('/admin/help', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('dashboard')) res.end("Permission denial") //Check Permission

    const customers = await getCustomers() ?? [];
    res.render('admin/help', {
        auth: auth,
        page: 'help',
        settings: await getSettings(),
        version: await getCurrentVersion(),
    })
})

app.get('/admin/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('settings')) res.end("Permission denial") //Check Permission
   
    res.render('admin/settings', {
        auth: auth,
        settings: await getSettings(),
        version: await getCurrentVersion(),
        page: 'settings'
    })
})

app.post('/admin/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('settings')) res.end("Permission denial") //Check Permission

    const company_name = req.body.company_name
    const company_logo = req.body.company_logo
    const company_banner = req.body.company_banner
    const zone = req.body.company_zone

    saveSettings(company_name, company_logo, company_banner, zone).then(() => {
        res.redirect('/admin/settings')
    })
})

app.listen(process.env.PORT ?? 3000, () => {
    console.log('[+] Sunny Logistic server is running on http://localhost:'+process.env.PORT);
});