const express = require('express');
const { addFollowingUp, updateFollowingUp } = require('../models/followingUp')
const app = express.Router();
const cookieParser = require('cookie-parser');
const moment = require('moment');
const { addLog } = require('../models/logs')

const { getFollowingUp } = require('../models/followingUp')
const { getRepairs } = require('../models/repairs')
const { initUserToken} = require('../models/users')
const { getSettings } = require('../models/settings')
const { getFollowingUpById, deleteFollowingUp } = require('../models/followingUp')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/following_up', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const following_up = await getFollowingUp()

    res.render('admin/following_up', {
        page: 'following_up',
        moment: moment,
        following_up: following_up,
        auth: auth,
        settings: await getSettings(),
    });
});

app.get('/admin/following_up/add', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const repairs = await getRepairs()

    res.render('admin/following_up/add', {
        page: 'following_up',
        moment: moment,
        auth: auth,
        repairs: repairs,
        settings: await getSettings(),
    });
});

app.post('/admin/following_up/add', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const { repair_id, target_mileage } = req.body;
    const created_at = moment().format('YYYY-MM-DD HH:mm:ss');
    await addFollowingUp(repair_id, target_mileage, created_at, auth.user.id);
    addLog('add', `Following up #${req.body.repair_id} ถูกเพิ่มโดย #${auth.user.id} - ${auth.user.username}`)

    res.redirect('/admin/following_up')
});

app.get('/admin/following_up/edit/:following_up_id', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const following_up = await getFollowingUpById(req.params.following_up_id)
    const repairs = await getRepairs()

    res.render('admin/following_up/edit', {
        page: 'following_up',
        moment: moment,
        following_up: following_up,
        repairs: repairs,
        auth: auth,
        settings: await getSettings(),
    });
});

app.post('/admin/following_up/edit/:following_up_id', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    const { repair_id, target_mileage } = req.body;
    await updateFollowingUp(req.params.following_up_id, repair_id, target_mileage);
    addLog('edit', `Following up #${req.params.following_up_id} ถูกแก้ไขโดย #${auth.user.id} - ${auth.user.username}`)

    res.redirect('/admin/following_up')
});

app.get('/admin/following_up/delete/:following_up_id', async(req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')

    await deleteFollowingUp(req.params.following_up_id)
    addLog('delete', `Following up #${req.params.following_up_id} ถูกลบออกจากระบบโดย #${auth.user.id} - ${auth.user.username}`)

    res.redirect('/admin/following_up')
});

module.exports = app;