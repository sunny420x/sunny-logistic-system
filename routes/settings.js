const express = require('express');
const app = express.Router();
const moment = require('moment');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const { addLog } = require('../models/logs')
const { initUserToken } = require('../models/users')
const { getSettings, saveSettings, saveAccountSettings, changeAccountPassword } = require('../models/settings')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

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
        moment: moment,
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

app.get('/admin/account/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
   
    res.render('admin/account_settings', {
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'account_settings'
    })
})

app.post('/admin/account/settings', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const username = req.body.username
    const full_name = req.body.full_name
    const phone_number = req.body.phone_number

    saveAccountSettings(auth.user.id, username, full_name, phone_number).then(() => {
        res.redirect('/admin/settings')
    })
})

app.get('/admin/account/settings/updatePassword', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
   
    res.render('admin/account_update_password', {
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'account_settings'
    })
})

app.post('/admin/account/settings/updatePassword', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const currentPassword = crypto.createHash('sha256').update(req.body.currentPassword).digest('hex');
    const newPassword = crypto.createHash('sha256').update(req.body.newPassword).digest('hex');

    changeAccountPassword(auth.user.id, currentPassword, newPassword).then((result) => {
        if(result.status == "success") {
            addLog('edit', `#${auth.user.id} - ${auth.user.username} ได้เปลี่ยนรหัสผ่านบัญชีของตนเอง`)
            res.redirect('/logout')
        } else {
            res.redirect('/admin/account/settings/updatePassword?alert=currentPasswordNotMatch')
        }
    })
})

module.exports = app;