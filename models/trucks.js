const db = require('../database');

function getTrucks() {
    return new Promise(resolve => {
        db.query("SELECT * FROM trucks ORDER BY id DESC", (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })    
}

function getTruckById(id) {
    return new Promise(resolve => {
        db.query("SELECT * FROM trucks WHERE id = ?", [id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })    
}

function addTruck(
    license_plate
) {
    return new Promise(resolve => {
        db.query("INSERT INTO trucks(license_plate) VALUES(?)", 
            [license_plate], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editTruck(
    id,
    license_plate,
) {
    return new Promise(resolve => {
        db.query("UPDATE trucks SET license_plate = ? WHERE id = ?", 
            [customer_name, customer_id, location, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

module.exports = {
    getTrucks,
    getTruckById,
    addTruck,
    editTruck
}