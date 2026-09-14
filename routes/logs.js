const express = require('express');
const app = express.Router();
const moment = require('moment');
const cookieParser = require('cookie-parser');

const { addLog, showLogs, getLogById, clearLogs, deleteLogById } = require('../models/logs')
const { initUserToken } = require('../models/users')
const { getSettings } = require('../models/settings')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/logs', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('logs')) res.end("Permission denial") //Check Permission

    const limit = 100;
    const action = req.query.action || null
    const date = req.query.date || null
   
    const logs = await showLogs(limit, action, date) ?? [];

    res.render('admin/logs', {
        logs: logs,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'logs'
    })
})

app.get('/admin/logs/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('logs')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const log = await getLogById(id) ?? [];

    res.render('admin/logs/view', {
        log: log,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'logs'
    })
})

app.get('/admin/logs/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('logs')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    
    deleteLogById(id).then(() => {
        res.redirect('/admin/logs')
    })
})

app.get('/admin/clearLogs', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('logs')) res.end("Permission denial") //Check Permission
   
    const limit = req.query.limit ?? 0

    clearLogs(limit).then(() => {
        addLog("delete", `ข้อมูลประวัติการใช้งานเก่าจำนวน ${limit} รายการ ถูกลบออกจากระบบ โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/logs')
    })
})

module.exports = app;