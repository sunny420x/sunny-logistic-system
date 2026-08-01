const db = require('../database')
const moment = require('moment')

function finishDelivery(id, finish_at) {
    return new Promise(resolve => {
        db.query("UPDATE transition_records SET status = 1, finish_at = ? WHERE id = ?", [finish_at, id], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success"
            })
        })
    })
}

function saveLocation(truck_id, driver_id, position_latitude, position_longitude) {
    return new Promise(resolve => {
        const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
        db.query("INSERT INTO location_records(truck_id, driver_id, position_latitude, position_longitude, created_at) VALUES(?,?,?,?,?)", [truck_id, driver_id, position_latitude, position_longitude,created_at], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success"
            })
        })
    })
}

function getAllTruckLocation() {
    return new Promise(resolve => {
        db.query(`WITH LatestLocations AS (
            SELECT 
                lr.truck_id, 
                lr.position_latitude, 
                lr.position_longitude, 
                t.license_plate, 
                lr.created_at, 
                u.full_name,
                ROW_NUMBER() OVER (
                    PARTITION BY lr.truck_id 
                    ORDER BY lr.created_at DESC
                ) AS rn
            FROM location_records AS lr 
            JOIN trucks AS t ON t.id = lr.truck_id 
            JOIN users AS u ON u.id = lr.driver_id 
            WHERE DATE(lr.created_at) = CURDATE() GROUP BY lr.truck_id 
        )
        SELECT 
            truck_id, 
            position_latitude, 
            position_longitude, 
            license_plate, 
            created_at, 
            full_name
        FROM LatestLocations
        WHERE rn = 1
        ORDER BY created_at DESC;`, (err, results) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                locations: results
            })
        })
    })
}

function getTruckLocation(date = null, truck_id) {
    return new Promise(resolve => {
        let query = `SELECT lr.position_latitude, lr.position_longitude, lr.created_at, u.full_name as driver_full_name, t.license_plate
            FROM location_records as lr
            JOIN trucks as t ON t.id = lr.truck_id
            JOIN users as u ON u.id = lr.driver_id
            WHERE lr.truck_id = ?`

        const params = [truck_id]

        if (date) {
            query += ` AND DATE(lr.created_at) = ?`
            params.push(date);
        }

        query += ` ORDER BY lr.id ASC`

        db.query(query, params, (err, results) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                locations: results
            })
        })
    })
}

module.exports = {
    finishDelivery,
    saveLocation,
    getAllTruckLocation,
    getTruckLocation
}