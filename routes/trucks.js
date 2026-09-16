const express = require('express');
const app = express.Router();
const moment = require('moment');
const cookieParser = require('cookie-parser');
const { addLog } = require('../models/logs')

const { 
    getTrucks, getTruckById, addTruck, editTruck, deleteTruckById, getMaintenanceByTruckId, getLicensePlateByTruckId, 
    getMaintenanceTypes, addMaintenance, saveMaintenance, getMaintenanceById, getMaintenanceTypeById,
    addMaintenanceType, saveMaintenanceType, deleteMaintenanceType, deleteMaintenance, getMaintenanceAlerts
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
        moment: moment,
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
        moment: moment,
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
    const round_cost = req.body.round_cost ?? 0
    const mileage_cycle = req.body.mileage_cycle ?? 0

    const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
    const created_by = auth.user.id

    addTruck(license_plate, brand, model, cost_per_km, round_cost, mileage_cycle, created_at, created_by).then(() => {
        res.cookie('alert', 'success')
        addLog('add', `รถส่งสินค้า หมายเลขทะเบียน ${license_plate} ถูกเพิ่มเข้ามาใหม่ โดย #${auth.user.id} - ${auth.user.username}`)
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
        moment: moment,
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
    const round_cost = req.body.round_cost ?? 0
    const mileage_cycle = req.body.mileage_cycle ?? 0

    editTruck(id, license_plate, brand, model, cost_per_km, round_cost, mileage_cycle).then(() => {
        res.cookie('alert', 'success')
        addLog('edit', `รถส่งสินค้าทะเบียน ${license_plate} ถูกแก้ไขแล้ว โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/trucks')
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
        res.cookie('alert', 'delete_success')
        addLog('delete', `รถส่งสินค้าหมายเลข #${id} ถูกลบออกจากระบบ โดย #${auth.user.id} - ${auth.user.username}`)
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
    
    const maintenance_alerts = await getMaintenanceAlerts()

    res.render('admin/maintenance', {
        date: date,
        maintenance_alerts:maintenance_alerts ?? [],
        maintenance: await getMaintenanceByTruckId(null, date) ?? [],
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'trucks'
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
    const license_plate = await getLicensePlateByTruckId(id)

    res.render('admin/maintenance', {
        id: id,
        date: date,
        license_plate: license_plate ?? null,
        maintenance: await getMaintenanceByTruckId(id, date) ?? [],
        truck_id: req.params.id,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'trucks'
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
        page: 'trucks'
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
        res.cookie('alert', 'success')
        addLog('add', `ข้อมูลการบำรุงรักษารถส่งสินค้าถูกเพิ่มเข้ามาในระบบ โดย #${auth.user.id} - ${auth.user.username}`)
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
        page: 'trucks'
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
    const updated_at = moment().format("YYYY-MM-DD HH:mm:ss")

    saveMaintenance(id, truck_id, maintenance_type, note, updated_at).then(() => {
        res.cookie('alert', 'success')
        addLog('edit', `ข้อมูลการบำรุงรักษารถส่งสินค้า หมายเลข #${id} ถูกแก้ไขแล้ว โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/trucks/maintenances/'+truck_id)
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
        res.cookie('alert', 'delete_success')
        addLog('delete', `ข้อมูลการบำรุงรักษารถส่งสินค้า หมายเลข #${id} ถูกลบออกจากระบบ โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/trucks/maintenances/'+truck_id)
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
        page: 'trucks'
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
        page: 'trucks'
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
        res.cookie('alert', 'success')
        addLog('add', `ประเภทการบำรุงรักษารถส่งสินค้า '${name}' ถูกเพิ่มเข้าสู่ระบบ โดย #${auth.user.id} - ${auth.user.username}`)
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
        page: 'trucks'
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
        res.cookie('alert', 'success')
        addLog('edited', `ประเภทการบำรุงรักษารถส่งสินค้า หมายเลข #${id} ถูกแก้ไข โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/maintenances/types')
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
        res.cookie('alert', 'delete_success')
        addLog('delete', `ประเภทการบำรุงรักษารถส่งสินค้าหมายเลข #${id} ถูกลบออกจากระบบ โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/maintenances/types')
    })
})

module.exports = app;