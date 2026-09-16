const express = require('express');
const app = express.Router();
const moment = require('moment');
const cookieParser = require('cookie-parser');
const { getRoutineChecks, getRoutineCheckById, addRoutineCheck, updateRoutineCheck, deleteRoutineCheckById } = require('../models/routineCheck')
const { getTrucks } = require('../models/trucks')
const { getSettings } = require('../models/settings')
const { addLog } = require('../models/logs')
const { initUserToken } = require('../models/users')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/routine_check/:truck_id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
    
    const search = req.query.q ?? null
    const date = req.query.date ?? null
    const truck_id = req.params.truck_id

    const routine_checks = await getRoutineChecks(date, search, truck_id)
    res.render('admin/routine_check', {
        routine_checks: routine_checks,
        license_plate: (routine_checks[0] && routine_checks[0].license_plate) || null,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'trucks',
        truck_id: truck_id
    })
})

app.get('/admin/routine_check/:truck_id/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) {
        res.redirect('/logout')
        return
    }
    if(auth.user.permission.split(',').length < 2) {
        res.end("Permission denial") //Check Permission
        return
    }
    if(!auth.user.permission.split(',').includes('trucks')) {
        res.end("Permission denial") //Check Permission
        return
    }
    
    res.render('admin/routine_check/add', {
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        trucks: await getTrucks(),
        page: 'trucks'
    })
})

app.post('/admin/routine_check/:truck_id/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) {
        res.redirect('/logout')
        return
    }
    if(auth.user.permission.split(',').length < 2) {
        res.end("Permission denial") //Check Permission
        return
    }
    if(!auth.user.permission.split(',').includes('trucks')) {
        res.end("Permission denial") //Check Permission
        return
    }

    const { mileage, notes } = req.body
    const truck_id = req.params.truck_id
    const created_at = moment().format('YYYY-MM-DD HH:mm:ss')
    await addRoutineCheck(truck_id, mileage, notes, created_at, auth.user.id)

    res.cookie('alert', 'success')
    addLog('add', `ข้อมูลตรวจเช็คประจำรถหมายเลข #${truck_id} ถูกเพิ่มโดย #${auth.user.id} - ${auth.user.username}`)

    res.redirect('/admin/routine_check/' + truck_id)
})

app.get('/admin/routine_check/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) {
        res.redirect('/logout')
        return
    }
    if(auth.user.permission.split(',').length < 2) {
        res.end("Permission denial") //Check Permission
        return
    }
    if(!auth.user.permission.split(',').includes('trucks')) {
        res.end("Permission denial") //Check Permission
        return
    }
   
    const routine_check = await getRoutineCheckById(req.params.id)
    res.render('admin/routine_check/edit', {
        routine_check: routine_check,
        trucks: await getTrucks(),
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'trucks'
    })
})

app.post('/admin/routine_check/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) {
        res.redirect('/logout')
        return
    }
    if(auth.user.permission.split(',').length < 2) {
        res.end("Permission denial") //Check Permission
        return
    }
    if(!auth.user.permission.split(',').includes('trucks')) {
        res.end("Permission denial") //Check Permission
        return
    }

    const { truck_id, mileage, notes } = req.body
    const updated_at = moment().format('YYYY-MM-DD HH:mm:ss')
    await updateRoutineCheck(req.params.id, truck_id, mileage, notes, updated_at, auth.user.id)

    res.cookie('alert', 'success')
    addLog('update', `ข้อมูลตรวจเช็คประจำรถหมายเลข #${req.params.id} ถูกแก้ไขโดย #${auth.user.id} - ${auth.user.username}`)

    res.redirect('/admin/routine_check/' + req.body.truck_id)
})

app.get('/admin/routine_check/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) {
        res.redirect('/logout')
        return
    }
    if(auth.user.permission.split(',').length < 2) {
        res.end("Permission denial") //Check Permission
        return
    }
    if(!auth.user.permission.split(',').includes('trucks')) {
        res.end("Permission denial") //Check Permission
        return
    }

    const id = req.params.id
    const routine_check = await getRoutineCheckById(id)
    const truck_id = routine_check ? routine_check.truck_id : null

    await deleteRoutineCheckById(id)

    res.cookie('alert', 'delete_success')
    addLog('delete', `ข้อมูลตรวจเช็คประจำรถหมายเลข #${id} ถูกลบโดย #${auth.user.id} - ${auth.user.username}`)
    res.redirect('/admin/routine_check/' + truck_id)
})

module.exports = app;