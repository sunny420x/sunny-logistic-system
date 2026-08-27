const express = require('express');
const app = express.Router();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { getUsers, registerUser, getUserTypes, getUserById, editUser, initUserToken, getUserTypeById, editUserType, addUserType } = require('../models/users')
const { getSettings } = require('../models/settings')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/users', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const username = req.body.username
    const password = req.body.password
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const type_id = req.body.type_id
    const phone_number = req.body.phone_number
    const full_name = req.body.full_name

    registerUser(username, password_hash, full_name, type_id, phone_number).then(() => {
        res.cookie('alert', 'success')
        res.redirect('/admin/users')
    })
})
app.get('/admin/users/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
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
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const username = req.body.username
    const password = req.body.password || null
    const type_id = req.body.type_id
    const phone_number = req.body.phone_number
    const full_name = req.body.full_name

    if(password) {
        const password_hash = crypto.createHash('sha256').update(password).digest('hex');
        editUser(id, username, full_name, type_id, phone_number, password_hash).then(() => {
            res.cookie('alert', 'success')
            res.redirect('/admin/users/edit/'+id)
        })
    } else {
        editUser(id, username, full_name, type_id, phone_number).then(() => {
            res.cookie('alert', 'success')
            res.redirect('/admin/users/edit/'+id)
        })
    }
})
// User Types
app.get('/admin/user_types', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const user_types = await getUserTypes() ?? [];

    res.render('admin/user_types', {
        user_types: user_types,
        auth: auth,
        settings: await getSettings(),
        page: 'user_types'
    })
})
app.get('/admin/user_types/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    res.render('admin/user_types/add', {
        page: 'user_types',
        auth: auth,
        settings: await getSettings(),
    })
})
app.post('/admin/user_types/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const user_type = req.body.user_type
    const permission = req.body.permission
    const color = req.body.color

    addUserType(user_type, permission, color).then(() => {
        res.cookie('alert', 'success')
        res.redirect('/admin/user_types')
    })
})
app.get('/admin/user_types/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;
    const user_type = await getUserTypeById(id)
    const user_types = await getUserTypes() ?? []
    res.render('admin/user_types/edit', {
        user_type: user_type,
        auth: auth,
        user_types: user_types,
        settings: await getSettings(),
        page: 'user_types'
    })
})
app.post('/admin/user_types/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id
    const user_type = req.body.user_type
    const permission = req.body.permission
    const color = req.body.color

    editUserType(id, user_type, permission, color).then(() => {
        res.cookie('alert', 'success')
        res.redirect('/admin/user_types/edit/'+id)
    })
})

module.exports = app;