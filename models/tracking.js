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

function saveLocation(truck_id, position_latitude, position_longitude) {
    return new Promise(resolve => {
        const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
        db.query("INSERT INTO location_records(truck_id, position_latitude, position_longitude, created_at) VALUES(?,?,?,?)", [truck_id, position_latitude, position_longitude,created_at], (err) => {
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
        db.query(`SELECT DISTINCT lr.truck_id, lr.position_latitude, lr.position_longitude, t.license_plate, lr.created_at, u.full_name 
            FROM location_records as lr 
            JOIN trucks as t ON t.id = lr.truck_id 
            JOIN users as u ON u.id = lr.driver_id 
            WHERE DATE(lr.created_at) = CURDATE() 
            ORDER BY lr.id DESC`, (err, results) => {
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
    getAllTruckLocation
}