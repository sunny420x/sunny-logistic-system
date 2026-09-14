const express = require('express');
const app = express.Router();

const { checkDatabaseExistance, checkTableExistance, installDatabase } = require('../models/installation')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

require('dotenv').config()

app.get('/installation', async(req,res) => {
    const isDatabaseExist = await checkDatabaseExistance(process.env.DB_NAME)
    if(isDatabaseExist) {
        const tableStatus = {
            users: await checkTableExistance(process.env.DB_NAME, 'users'),
            customers: await checkTableExistance(process.env.DB_NAME, 'customers'),
            customer_groups: await checkTableExistance(process.env.DB_NAME, 'customer_groups'),
            location_records: await checkTableExistance(process.env.DB_NAME, 'location_records'),
            logs: await checkTableExistance(process.env.DB_NAME, 'logs'),
            maintenance_type: await checkTableExistance(process.env.DB_NAME, 'maintenance_type'),
            settings: await checkTableExistance(process.env.DB_NAME, 'settings'),
            transition_records: await checkTableExistance(process.env.DB_NAME, 'transition_records'),
            truck_maintenance: await checkTableExistance(process.env.DB_NAME, 'truck_maintenance'),
            trucks: await checkTableExistance(process.env.DB_NAME, 'trucks'),
            user_types: await checkTableExistance(process.env.DB_NAME, 'user_types'),
        };

        const allInstalled = Object.values(tableStatus).every(status => status === true);
        
        res.render('install', {
            database: {
                host: process.env.DB_HOST || "[ ค่าว่าง ]",
                username: process.env.DB_USER || "[ ค่าว่าง ]",
                password: process.env.DB_PASSWORD || "[ ค่าว่าง ]",
            },
            tables: {
                ...tableStatus,
                allInstalled: allInstalled
            }
        })
    } else {
        res.send("โปรดสร้างฐานข้อมูลที่ชื่อ "+process.env.DB_NAME+" ก่อน")
    }
})

app.get('/installation/database', (req,res) => {
    installDatabase().then((data) => {
        if(data.status == 'success') {
            res.json({
                status: 'success'
            })
        } else {
            res.json({
                status: data.status,
                error: data.error
            })
        }
    })
})

module.exports = app;