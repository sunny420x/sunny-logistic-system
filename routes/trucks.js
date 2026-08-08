const express = require('express');
const app = express.Router();
const moment = require('moment');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { getTrucks, getTruckById, addTruck, editTruck } = require('../models/trucks')
const { initUserToken } = require('../models/users')
const { getSettings } = require('../models/settings');
const { time } = require('console');

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
require('dotenv').config();

app.get('/admin/trucks', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('routes')) res.end("Permission denial") //Check Permission
   
    const date = req.query.date ?? null

    res.render('admin/trucks/location_history', {
        date: date,
        truck_id: req.params.id,
        auth: auth,
        moment: moment,
        timezone: process.env.TIMEZONE,
        settings: await getSettings(),
        page: 'trucks'
    })
})

module.exports = app;