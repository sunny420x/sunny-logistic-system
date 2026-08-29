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

function getMaintenanceTypes() {
    return new Promise(resolve => {
        db.query(`SELECT * FROM maintenance_type ORDER BY id ASC`, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getMaintenanceTypeById(id) {
    return new Promise(resolve => {
        db.query(`SELECT * FROM maintenance_type WHERE id = ?`, [id], (err, result) => {
            if(err) console.error(err);
            resolve(result[0])
        })
    })
}

function getMaintenanceByTruckId(id = null, date = null) {
    return new Promise(resolve => {
        let params = []
        let query = `SELECT t.license_plate, u.full_name, u.id, mt.name as maintenace_name, m.note, m.created_at, m.updated_at, m.id, m.truck_id, m.maintenance_type 
            FROM truck_maintenance as m 
            JOIN maintenance_type as mt ON mt.id = m.maintenance_type 
            JOIN trucks as t ON t.id = m.truck_id 
            JOIN users as u ON u.id = m.user_id `

        if(id) {
            query += `WHERE m.truck_id = ? `
            params.push(id)
        }

        if(date) {
            if(id) {
                query += `AND m.created_at = ?`
            } else {
                query += `WHERE m.created_at = ?`
            }
            params.push(date)
        }
        
        db.query(query, params, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getMaintenanceById(id = null) {
    return new Promise(resolve => {
        db.query(`SELECT u.full_name, u.id, mt.name as maintenace_name, m.note, m.created_at, m.updated_at, m.id, m.truck_id, m.maintenance_type
            FROM truck_maintenance as m 
            JOIN maintenance_type as mt ON mt.id = m.maintenance_type
            JOIN users as u ON u.id = m.user_id 
            WHERE m.id = ?`, [id], (err, result) => {
            if(err) console.error(err);
            resolve(result[0])
        })
    })
}

function addMaintenance(truck_id, user_id, maintenance_type, note, created_at) {
    return new Promise(resolve => {
        db.query(`INSERT INTO truck_maintenance(truck_id, user_id, maintenance_type, note, created_at) VALUES(?,?,?,?,?)`, [truck_id, user_id, maintenance_type, note, created_at], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function saveMaintenance(id, truck_id, maintenance_type, note, updated_at) {
    return new Promise(resolve => {
        db.query(`UPDATE truck_maintenance SET truck_id = ?, maintenance_type = ?, note = ?, updated_at = ? WHERE id = ?`, [truck_id, maintenance_type, note, updated_at, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function deleteMaintenance(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM truck_maintenance WHERE id = ?`, [id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function addMaintenanceType(name, round, created_at) {
    return new Promise(resolve => {
        db.query(`INSERT INTO maintenance_type(name, round, created_at) VALUES(?,?,?)`, [name, round, created_at], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function saveMaintenanceType(id, name, round) {
    return new Promise(resolve => {
        db.query(`UPDATE maintenance_type SET name = ?, round = ? WHERE id = ?`, [name, round, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function deleteMaintenanceType(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM maintenance_type WHERE id = ?`, [id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function getMaintenanceAlerts() {
    return new Promise(resolve => {
        db.query(`SELECT mt.round, mt.name, t.license_plate, DATEDIFF(m.created_at + INTERVAL mt.round DAY, NOW()) as days_left 
        FROM truck_maintenance as m 
        JOIN maintenance_type as mt ON mt.id = m.maintenance_type 
        JOIN trucks as t ON m.truck_id = t.id 
        WHERE DATEDIFF(m.created_at + INTERVAL mt.round DAY, NOW()) < 30`, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getLicensePlateByTruckId(id) {
    return new Promise(resolve => {
        db.query(`SELECT license_plate FROM trucks WHERE id = ?`, [id], (err, result) => {
            if(err) console.error(err);
            resolve(result[0].license_plate)
        })
    })
}

module.exports = {
    getTrucks,
    getTruckById,
    addTruck,
    editTruck,
    deleteTruckById,
    getMaintenanceTypes,
    getMaintenanceTypeById,
    getMaintenanceByTruckId,
    addMaintenance,
    saveMaintenance,
    deleteMaintenance,
    getMaintenanceById,
    addMaintenanceType, 
    saveMaintenanceType,
    deleteMaintenanceType,
    getMaintenanceAlerts,
    getLicensePlateByTruckId,
}