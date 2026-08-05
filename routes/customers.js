const express = require('express');
const app = express.Router();
const moment = require('moment');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const path = require('path');

const { getCustomers, getCustomerById, addCustomers, editCustomer, getCustomerGroups } = require('../models/customers')
const { initUserToken} = require('../models/users')
const { getSettings } = require('../models/settings')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/customers', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(auth.status != 'success') res.redirect('/login')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('customers')) res.end("Permission denial") //Check Permission

    const search = req.query.q || null
    const group_id = req.query.group_id || null

    const customers = await getCustomers(search, group_id) ?? [];
    const customer_groups = await getCustomerGroups() ?? [];

    res.render('admin/customers', {
        customers: customers,
        customer_groups: customer_groups,
        group_id:group_id,
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

    const customer_groups = await getCustomerGroups() ?? [];
    
    res.render('admin/customers/add', {
        auth: auth,
        customer_groups: customer_groups,
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
    const address = req.body.address
    const group_id = req.body.group_id

    if(location.split(",").length != 2) {
        res.end("พิกัดที่อยู่ลูกค้าไม่ถูกต้อง")
    }

    addCustomers(customer_name, customer_id, address, location, group_id).then(() => {
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
    const customer_groups = await getCustomerGroups() ?? [];

    res.render('admin/customers/edit', {
        customer: customer[0],
        customer_groups: customer_groups,
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
    const address = req.body.address
    const group_id = req.body.group_id

    if(location.split(",").length != 2) {
        res.end("พิกัดที่อยู่ลูกค้าไม่ถูกต้อง")
    }

    editCustomer(id, customer_name, customer_id, address, location, group_id).then(() => {
        res.redirect('/admin/customers/edit/'+id)
    })
})

module.exports = app;