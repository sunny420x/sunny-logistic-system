const express = require('express');
const app = express.Router();
const moment = require('moment');
const { getTrucks } = require('../models/trucks')
const cookieParser = require('cookie-parser');

const { addLog } = require('../models/logs')
const { initUserToken } = require('../models/users')
const { getSettings } = require('../models/settings')

const { addRepair, getRepairs, getRepairById, updateRepair, deleteRepair, 
    getRepairTypes, addRepairType, deleteRepairType, updateRepairType, getRepairTypeById  } = require('../models/repairs')   

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/admin/repairs', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const repairs = await getRepairs();
    res.render('admin/repairs', {
        repairs,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.get('/admin/repairs/edit/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const repair = await getRepairById(req.params.id);
    const repairTypes = await getRepairTypes();
    const trucks = await getTrucks();

    res.render('admin/repairs/edit', {
        repair,
        repair_types: repairTypes,
        trucks,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.get('/admin/repairs/report/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial")
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial")

    const repair = await getRepairById(req.params.id);
    if(!repair) {
        res.status(404).send('ไม่พบข้อมูลการซ่อม')
        return
    }

    let details = [];
    try {
        const parsedDetails = JSON.parse(repair.details || '[]');
        details = Array.isArray(parsedDetails) ? parsedDetails : [];
    } catch (error) {
        details = [];
    }

    res.render('admin/repairs/report', {
        repair,
        details,
        auth: auth,
        moment: moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.post('/admin/repairs/edit/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const { truck_id, repair_type, details, notes } = req.body;
    
    await updateRepair(req.params.id, truck_id, repair_type, notes, details);
    res.redirect('/admin/repairs'); 
})

app.get('/admin/repairs/add', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const repairTypes = await getRepairTypes();
    const trucks = await getTrucks();

    res.render('admin/repairs/add', { 
        repair_types: repairTypes,
        trucks,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.post('/admin/repairs/add', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const { truck_id, repair_type, details, notes } = req.body;
    
    await addRepair( truck_id, repair_type, details, notes, moment().format('YYYY-MM-DD HH:mm:ss'), auth.user.id );
    res.redirect('/admin/repairs'); 
})   

app.get('/admin/repair_types', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const repairTypes = await getRepairTypes();

    res.render('admin/repair_types', { 
        repair_types: repairTypes,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.get('/admin/repair_type/add', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    res.render('admin/repair_type/add', { 
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.post('/admin/repair_type/add', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const { name } = req.body;
    const created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    await addRepairType(name, created_at, auth.user.id);
    addLog('add', `ประเภทการซ่อมบำรุงใหม่ "${name}" ถูกเพิ่มเข้าสู่ระบบ โดย #${auth.user.id} - ${auth.user.username}`)
    res.cookie('alert', 'success')
    res.redirect('/admin/repair_types'); 
});

app.get('/admin/repair_type/edit/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const repairType = await getRepairTypeById(req.params.id);

    res.render('admin/repair_type/edit', { 
        repair_type: repairType,
        auth: auth,
        moment:moment,
        settings: await getSettings(),
        page: 'repairs'
    });
});

app.post('/admin/repair_type/edit/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    const { name } = req.body;
    await updateRepairType(req.params.id, name);
    addLog('update', `ประเภทการซ่อมบำรุง #${req.params.id} ถูกแก้ไขเป็น "${name}" โดย #${auth.user.id} - ${auth.user.username}`)
    res.cookie('alert', 'success')
    res.redirect(`/admin/repair_types`); 
});

app.get('/admin/repair_type/delete/:id', async (req, res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('trucks')) res.end("Permission denial") //Check Permission

    await deleteRepairType(req.params.id);
    addLog('delete', `ประเภทการซ่อมบำรุง #${req.params.id} ถูกลบออกจากระบบโดย #${auth.user.id} - ${auth.user.username}`)
    res.cookie('alert', 'success')
    res.redirect('/admin/repair_types'); 
});

module.exports = app;