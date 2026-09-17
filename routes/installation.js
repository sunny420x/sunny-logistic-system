const express = require('express');
const app = express.Router();

const { checkDatabaseExistance, checkTableAndColumnsExistance, installDatabase, expectedSchema } = require('../models/installation');

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

require('dotenv').config()

app.get('/installation', async(req,res) => {
    const isDatabaseExist = await checkDatabaseExistance(process.env.DB_NAME)
    if(isDatabaseExist) {
        const tableStatus = {};
        for (const tableName of Object.keys(expectedSchema)) {
            tableStatus[tableName] = await checkTableAndColumnsExistance(process.env.DB_NAME, tableName);
        }

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
            },
            updateDatabase: req.query.updateDatabase === "yes" ? true : false
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