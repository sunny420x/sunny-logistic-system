const db = require('../database');

function getTrucks(search = null) {
    return new Promise(resolve => {
        let query = "SELECT t.id, t.license_plate, t.brand, t.model, t.cost_per_km FROM trucks as t LEFT JOIN location_records l ON t.id = l.truck_id ";
        if(search != null) {
            query += "WHERE t.license_plate LIKE ? ";
        }
        query += "GROUP BY t.id, t.brand, t.model, t.cost_per_km ORDER BY t.id DESC";

        db.query(query, [ `%${search}%` ], (err, results) => {
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
    license_plate,
    brand,
    model,
    cost_per_km
) {
    return new Promise(resolve => {
        db.query("INSERT INTO trucks(license_plate, brand, model, cost_per_km) VALUES(?,?,?,?)", 
            [license_plate, brand, model, cost_per_km], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editTruck(
    id,
    license_plate,
    brand,
    model,
    cost_per_km
) {
    return new Promise(resolve => {
        db.query("UPDATE trucks SET license_plate = ?, brand = ?, model = ?, cost_per_km = ? WHERE id = ?", 
            [license_plate, brand, model, cost_per_km, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function deleteTruckById(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM trucks WHERE id = ?`, [id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

module.exports = {
    getTrucks,
    getTruckById,
    addTruck,
    editTruck,
    deleteTruckById,
}