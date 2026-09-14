const db = require('../database');
const fs = require('fs');
const path = require('path');

function checkDatabaseExistance(db_name) {
    return new Promise(resolve => {
        db.query(`SELECT SCHEMA_NAME 
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?`, [db_name], (err, result) => {
            if(err) console.error(err)
            if(result.length == 1) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}


function checkTableExistance(db_name, table_name) {
    return new Promise(resolve => {
        db.query(`SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = ?
        AND table_name = ?`, [db_name, table_name], (err, result) => {
            if(err) console.error(err)
            if(result[0].count == 1) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

async function installDatabase() {
    try {
        const filePath = path.join(__dirname, '../database/logistic.sql');
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await db.promise().query(sql);

        return { status: 'success' };
    } catch (error) {
        return {
            status: 'error',
            error: error
        };
    }
}

module.exports = {
    checkDatabaseExistance, installDatabase, checkTableExistance
}