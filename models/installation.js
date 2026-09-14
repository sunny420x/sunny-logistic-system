const db = require('../database');
const fs = require('fs');
const path = require('path');

const expectedSchema = {
    users: ['id', 'username', 'password', 'full_name', 'phone_number', 'type_id', 'created_at', 'created_by'],
    customers: ['id', 'customer_name', 'customer_id', 'location', 'address', 'group_id', 'phone_number', 'created_at', 'created_by'],
    customer_groups: ['id', 'name', 'color', 'created_at', 'created_by'],
    location_records: ['id', 'truck_id', 'position_latitude', 'position_longitude', 'driver_id', 'created_at'],
    logs: ['id', 'action', 'details', 'created_at'],
    maintenance_type: ['id', 'name', 'round', 'created_at'],
    settings: ['company_name', 'company_logo', 'company_banner', 'zone'],
    transition_records: ['id', 'billing_id', 'customer_id', 'date', 'time', 'status', 'finish_at', 'truck_id', 'driver_id', 'weight', 'arrivalImage', 'temporary_location', 'driver_note', 'location_note', 'arrival_at_warehouse', 'round', 'created_at', 'created_by'],
    truck_maintenance: ['id', 'truck_id', 'user_id', 'maintenance_type', 'note', 'created_at', 'updated_at'],
    trucks: ['id', 'license_plate', 'brand', 'model', 'cost_per_km', 'created_at', 'created_by'],
    user_types: ['id', 'name', 'permission', 'color', 'created_at', 'created_by']
};

function checkDatabaseExistance(db_name) {
    return new Promise(resolve => {
        db.query(`SELECT SCHEMA_NAME 
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?`, [db_name], (err, result) => {
            if(err) console.error(err)
            if(result && result.length == 1) {
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
            if(result && result[0] && result[0].count == 1) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

function checkTableAndColumnsExistance(db_name, table_name, expectedColumns) {
    return new Promise(resolve => {
        const columns = expectedColumns || expectedSchema[table_name];
        if (!columns || columns.length === 0) {
            return checkTableExistance(db_name, table_name).then(resolve);
        }
        db.query(`SELECT COUNT(DISTINCT COLUMN_NAME) as count
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME IN (?)`, [db_name, table_name, columns], (err, result) => {
            if (err) {
                console.error(err);
                resolve(false);
            } else if (result && result[0] && result[0].count === columns.length) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
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
    checkDatabaseExistance, installDatabase, checkTableExistance, checkTableAndColumnsExistance, expectedSchema
}