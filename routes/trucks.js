const express = require('express');
const app = express.Router();
const moment = require('moment');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { 
    getTrucks, getTruckById, addTruck, editTruck, deleteTruckById, getMaintenanceByTruckId, 
    getMaintenanceTypes, addMaintenance, saveMaintenance, getMaintenanceById, getMaintenanceTypeById,
    addMaintenanceType, saveMaintenanceType, deleteMaintenanceType, deleteMaintenance
} = require('../models/trucks')
const { initUserToken } = require('../models/users')
const { getSettings } = require('../models/settings');

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
        settings: await getSettings(),
        page: 'trucks'
    })
})

app.get('/admin/trucks/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id;

    deleteTruckById(id).then(() => {
        res.redirect('/admin/trucks')
    })
})

app.get('/admin/trucks/maintenances', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const date = req.query.date ?? null

    res.render('admin/maintenance', {
        date: date,
        maintenance: await getMaintenanceByTruckId(null, date) ?? [],
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.get('/admin/trucks/maintenances/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null
    const date = req.query.date ?? null

    res.render('admin/maintenance', {
        id: id,
        date: date,
        maintenance: await getMaintenanceByTruckId(id, date) ?? [],
        truck_id: req.params.id,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.get('/admin/maintenances/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.query.id ?? null

    res.render('admin/maintenance/add', {
        id: id,
        auth: auth,
        moment: moment,
        trucks: await getTrucks(),
        maintenance_type: await getMaintenanceTypes(),
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.post('/admin/maintenances/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const truck_id = req.body.truck_id ?? null
    const user_id = auth.user.id
    const maintenance_type = req.body.truck_id ?? null
    const note = req.body.note
    const created_at = moment().format("YYYY-MM-DD HH:mm:ss")

    addMaintenance(truck_id, user_id, maintenance_type, note, created_at).then(() => {
        res.redirect('/admin/trucks/maintenances/'+truck_id)
    })
})

app.get('/admin/maintenances/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null

    res.render('admin/maintenance/edit', {
        id:id,
        maintenance: await getMaintenanceById(id),
        auth: auth,
        moment: moment,
        trucks: await getTrucks(),
        maintenance_type: await getMaintenanceTypes(),
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.post('/admin/maintenances/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null
    const truck_id = req.body.truck_id ?? null
    const maintenance_type = req.body.maintenance_type  ?? null
    const note = req.body.note

    saveMaintenance(id, truck_id, maintenance_type, note).then(() => {
        res.redirect('/admin/maintenances/edit/'+truck_id)
    })
})

app.get('/admin/maintenances/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null

    deleteMaintenance(id).then(() => {
        res.redirect('/trucks/maintenances/')
    })
})

app.get('/admin/maintenances/types', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    res.render('admin/maintenance_types', {
        maintenance: await getMaintenanceTypes() ?? [],
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.get('/admin/maintenances/types/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.query.id ?? null

    res.render('admin/maintenance_type/add', {
        id: id,
        auth: auth,
        moment: moment,
        trucks: await getTrucks(),
        maintenance_type: await getMaintenanceTypes(),
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.post('/admin/maintenances/types/add', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const name = req.body.name ?? null
    const round = req.body.round ?? null
    const created_at = moment().format("YYYY-MM-DD HH:mm:ss")

    addMaintenanceType(name, round, created_at).then(() => {
        res.redirect('/admin/maintenances/types')
    })
})

app.get('/admin/maintenances/types/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null

    res.render('admin/maintenance_type/edit', {
        id:id,
        maintenance: await getMaintenanceTypeById(id),
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'maintenance'
    })
})

app.post('/admin/maintenances/types/edit/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null
    const name = req.body.name ?? null
    const round = req.body.round ?? null

    saveMaintenanceType(id, name, round).then(() => {
        res.redirect('/admin/maintenance/types/edit/'+id)
    })
})

app.get('/admin/maintenances/types/delete/:id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission
   
    const id = req.params.id ?? null

    deleteMaintenanceType(id).then(() => {
        res.redirect('/admin/maintenances/types')
    })
})

module.exports = app;