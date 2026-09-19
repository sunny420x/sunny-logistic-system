const express = require('express');
const app = express.Router();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const { addLog } = require('../models/logs')

const { getUsers, registerUser, getUserTypes, getUserById, editUser, 
    initUserToken, getUserTypeById, editUserType, addUserType } = require('../models/users')
const { getSettings } = require('../models/settings')
const  {getCalculateRoundByDate, getCalculateRoundByMonth, 
    getCalculateRoundReport, getCalculateRoundReportByMonth } = require('../models/trucks')

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
        moment: moment,
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
        moment: moment,
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

    const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
    const created_by = auth.user.id

    registerUser(username, password_hash, full_name, type_id, phone_number, created_at, created_by).then(() => {
        res.cookie('alert', 'success')
        addLog('add', `ผู้ใช้ '${username}' ชื่อเต็ม '${full_name}' ถูกเพิ่มเข้าสู่ระบบ โดย #${auth.user.id} - ${auth.user.username}`)
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
        moment: moment,
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
            addLog('edit', `ผู้ใช้ #${id} - ${username} ถูกแก้ไข โดย #${auth.user.id} - ${auth.user.username}`)
            res.redirect('/admin/users/')
        })
    } else {
        editUser(id, username, full_name, type_id, phone_number, null).then(() => {
            res.cookie('alert', 'success')
            addLog('edit', `ผู้ใช้ #${id} - ${username} ถูกแก้ไข โดย #${auth.user.id} - ${auth.user.username}`)
            res.redirect('/admin/users/')
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
        moment: moment,
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
        moment: moment,
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

    const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
    const created_by = auth.user.id

    addUserType(user_type, permission, color, created_at, created_by).then(() => {
        res.cookie('alert', 'success')
        addLog('add', `ประเภทผู้ใช้ใหม่ '${user_type}' สิทธิ์ ${permission} ถูกเพิ่มเข้าสู่ระบบ โดย #${auth.user.id} - ${auth.user.username}`)
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
        moment: moment,
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
        addLog('add', `ประเภทผู้ใช้หมายเลข #${id} - ${user_type} ถูกแก้ไข โดย #${auth.user.id} - ${auth.user.username}`)
        res.redirect('/admin/user_types')
    })
})

app.get('/admin/calculate_round', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission
   
    const date = req.query.date;
    const drivers_round = await getCalculateRoundByDate(date)

    res.render('admin/calculate_round', {
        drivers_round: drivers_round,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'users'
    })
})

app.get('/admin/calculate_round/report/:driver_id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission

    const driver_id = req.params.driver_id;
    const date = req.query.date ?? moment().format('YYYY-MM-DD');
    const rows = await getCalculateRoundReport(driver_id, date) ?? [];

    if (rows.length === 0) {
        res.status(404).end("ไม่พบข้อมูลรอบของพนักงานขับรถในวันที่เลือก");
        return;
    }

    // ของแต่ละรอบใช้ round_cost จากเรคอร์ที่บันทึกก่อนสุด (id น้อยสุด) เพื่อให้ตรงกับหน้าตารางสรุป
    const roundCostByRound = new Map();
    rows.filter(row => row.round !== null).forEach(row => {
        const existing = roundCostByRound.get(row.round);
        if (!existing || row.id < existing.id) roundCostByRound.set(row.round, row);
    });
    const round_count = roundCostByRound.size;
    const round_cost_total = [...roundCostByRound.values()].reduce((sum, row) => sum + Number(row.round_cost), 0);

    res.render('admin/calculate_round_report', {
        driver: rows[0],
        rows: rows,
        round_count: round_count,
        round_cost_total: round_cost_total,
        date: date,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'users'
    })
})

app.get('/admin/calculate_round_month', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission

    const start_date = req.query.start_date ?? moment().startOf('month').format('YYYY-MM-DD');
    const end_date = req.query.end_date ?? moment().endOf('month').format('YYYY-MM-DD');
    const drivers_round = await getCalculateRoundByMonth(start_date, end_date)

    res.render('admin/calculate_round_month', {
        drivers_round: drivers_round,
        start_date: start_date,
        end_date: end_date,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'users'
    })
})

app.get('/admin/calculate_round_month/report/:driver_id', async(req,res) => {
    if(!req.cookies.auth) {
        res.redirect('/login')
        return
    }
    const auth = await initUserToken(req.cookies.auth)
    if(!auth.user) res.redirect('/logout')
    if(auth.user.permission.split(',').length < 2) res.end("Permission denial") //Check Permission
    if(!auth.user.permission.split(',').includes('users')) res.end("Permission denial") //Check Permission

    const driver_id = req.params.driver_id;
    const start_date = req.query.start_date ?? moment().startOf('month').format('YYYY-MM-DD');
    const end_date = req.query.end_date ?? moment().endOf('month').format('YYYY-MM-DD');
    const rows = await getCalculateRoundReportByMonth(driver_id, start_date, end_date) ?? [];

    if (rows.length === 0) {
        res.status(404).end("ไม่พบข้อมูลรอบของพนักงานขับรถในช่วงวันที่เลือก");
        return;
    }

    const round_count = new Set(rows.map(row => `${moment(row.date).format('YYYY-MM-DD')}-${row.round}`).filter(key => !key.endsWith('-null'))).size;
    const rowsByDate = rows.reduce((groups, row) => {
        const dateKey = moment(row.date).format('YYYY-MM-DD');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(row);
        return groups;
    }, {});

    // สรุปจำนวนรอบและค่ารอบรวมของแต่ละวัน (ใช้ round_cost ของเรคอร์ที่บันทึกก่อนสุดต่อรอบ ตรงกับหน้าตารางสรุป)
    const dailyTotals = Object.fromEntries(
        Object.entries(rowsByDate).map(([dateKey, dailyRows]) => {
            const roundCostByRound = new Map();
            dailyRows.filter(row => row.round !== null).forEach(row => {
                const existing = roundCostByRound.get(row.round);
                if (!existing || row.id < existing.id) roundCostByRound.set(row.round, row);
            });
            return [dateKey, {
                round_count: roundCostByRound.size,
                round_cost: [...roundCostByRound.values()].reduce((sum, row) => sum + Number(row.round_cost), 0),
                license_plate: dailyRows[0].license_plate
            }];
        })
    );
    const round_cost_total = Object.values(dailyTotals).reduce((sum, day) => sum + day.round_cost, 0);

    res.render('admin/calculate_round_report_month', {
        driver: rows[0],
        rowsByDate: rowsByDate,
        dailyTotals: dailyTotals,
        round_count: round_count,
        round_cost_total: round_cost_total,
        start_date: start_date,
        end_date: end_date,
        auth: auth,
        settings: await getSettings(),
        moment: moment,
        page: 'users'
    })
})

module.exports = app;