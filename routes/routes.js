const express = require('express');
const app = express.Router();
const moment = require('moment');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { getRoutes, getRouteById, addRoute, editRoute } = require('../models/routes')
const { getCustomers, getCustomerById, getCustomerGroups } = require('../models/customers')
const { getTrucks, getTruckById } = require('../models/trucks')
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
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const customer_id = req.body.customer_id
    const truck_id = req.body.truck_id
    const driver_id = req.body.driver_id
    const date = req.body.date
    const time_start = req.body.time_start
    const weight = req.body.weight

    addRoute(customer_id, truck_id, driver_id, date, time_start, weight).then(() => {
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
    const time_start = req.body.time_start
    const weight = req.body.weight

    editRoute(id, customer_id, truck_id, driver_id, date, time_start, weight).then(() => {
        res.redirect('/admin/routes/edit/'+id)
    })
})

module.exports = app;
