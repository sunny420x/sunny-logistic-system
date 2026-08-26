const express = require('express');
const app = express.Router();
const moment = require('moment');
const cookieParser = require('cookie-parser');

const { getRoutes, getRouteById, addRoute, editRoute, deleteRouteById } = require('../models/routes')
const { getCustomers } = require('../models/customers')
const { getTrucks } = require('../models/trucks')
const { getDrivers, initUserToken } = require('../models/users')
const { getSettings } = require('../models/settings')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/routes', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
    
    const search = req.query.q ?? null
    const date = req.query.date ?? null
    const status = req.query.status ?? null
   
    const routes = await getRoutes(date, search, status)
    res.render('admin/routes', {
        routes: routes,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'routes'
    })
})
app.get('/admin/routes/calendar', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
    
    const search = req.query.q ?? null
    const date = req.query.date ?? null
    const status = req.query.status ?? null
   
    const routes = await getRoutes(date, search, status)
    res.render('admin/routes/calendar', {
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const customers = await getCustomers()
    const trucks = await getTrucks()
    const drivers = await getDrivers()

    res.render('admin/routes/add', {
        moment: moment,
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const customer_id = req.body.customer_id
    const truck_id = req.body.truck_id
    const driver_id = req.body.driver_id
    const date = req.body.date
    const time_start = req.body.time_start
    const weight = req.body.weight
    const location_note = req.body.location_note
    const driver_note = req.body.driver_note
    const temporary_location = req.body.temporary_location

    addRoute(customer_id, truck_id, driver_id, date, time_start, weight, location_note, driver_note, temporary_location).then(() => {
        res.redirect('/admin/routes')
    })
})
app.get('/admin/routes/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const customer_id = req.body.customer_id
    const truck_id = req.body.truck_id
    const driver_id = req.body.driver_id
    const date = req.body.date
    const time_start = req.body.time_start
    const weight = req.body.weight
    const location_note = req.body.location_note
    const driver_note = req.body.driver_note
    const temporary_location = req.body.temporary_location
    const status = req.body.status

    const arrival_at_warehouse_date = req.body.arrival_at_warehouse_date ?? null
    const arrival_at_warehouse_time = req.body.arrival_at_warehouse_time ?? null
    let arrival_at_warehouse = null
    
    if(arrival_at_warehouse_date && arrival_at_warehouse_time) {
        arrival_at_warehouse = `${arrival_at_warehouse_date} ${arrival_at_warehouse_time}`
    }

    editRoute(id, customer_id, truck_id, driver_id, date, time_start, weight, location_note, driver_note, temporary_location, status, arrival_at_warehouse).then(() => {
        res.redirect('/admin/routes/edit/'+id)
    })
})
app.get('/admin/routes/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;

    deleteRouteById(id).then(() => {
        res.redirect('/admin/routes')
    })
})

module.exports = app;
