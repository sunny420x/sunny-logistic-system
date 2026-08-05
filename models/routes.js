const db = require('../database');

function getRoutes(date = null, search = null) {
    let query = `SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.location, r.status, t.license_plate, u.full_name as driver_full_name, r.driver_id, t.id as truck_id, r.weight, r.finish_at  
    FROM transition_records as r 
    JOIN customers as c ON c.id = r.customer_id 
    LEFT JOIN trucks as t ON t.id = r.truck_id
    JOIN users as u ON u.id = r.driver_id `
    return new Promise(resolve => {
        if(date != null || search != null) {
            if(date != null) {
                query += "WHERE r.date = ? "
            }
            if(search != null) {
                query += (date != null ? "AND" : "WHERE") + " (c.customer_name LIKE ? OR c.customer_id LIKE ?) "
            }
            db.query(query+"ORDER BY r.date DESC", [date, `%${search}%`, `%${search}%`], (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        } else {
            db.query(query+"ORDER BY r.date DESC", (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        }
    })    
}

function getMyRoutes(driver_id) {
    return new Promise(resolve => {
        db.query(`SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.id as customer_row_id, c.location, r.status, t.license_plate, u.full_name as driver_full_name, r.driver_id, t.id as truck_id, r.weight  
        FROM transition_records as r 
        JOIN customers as c ON c.id = r.customer_id 
        LEFT JOIN trucks as t ON t.id = r.truck_id
        JOIN users as u ON u.id = r.driver_id 
        WHERE r.driver_id = ? AND r.date = CURDATE() `, [driver_id], (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })    
}

function getRouteById(id) {
    return new Promise(resolve => {
        db.query(`SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.id as customer_row_id, c.location, t.license_plate, r.driver_id, u.full_name as driver_full_name, r.weight, r.finish_at 
            FROM transition_records as r JOIN customers as c ON c.id = r.customer_id 
            LEFT JOIN trucks as t ON t.id = r.truck_id 
            JOIN users as u ON u.id = r.driver_id WHERE r.id = ?`, [id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })    
}

function addRoute(
    customer_id,
    truck_id,
    driver_id,
    date,
    time,
    weight
) {
    return new Promise(resolve => {
        db.query("INSERT INTO transition_records(customer_id, truck_id, driver_id, date, time, weight) VALUES(?,?,?,?,?,?)", 
            [customer_id, truck_id, driver_id, date, time, weight], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editRoute(
    id,
    customer_id,
    truck_id,
    driver_id,
    date,
    time,
    weight
) {
    return new Promise(resolve => {
        db.query("UPDATE transition_records SET customer_id = ?, truck_id = ?, driver_id = ?, date = ?, time = ?, weight = ? WHERE id = ?", 
            [customer_id, truck_id, driver_id, date, time, weight, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

module.exports = {
    getRoutes,
    getMyRoutes,
    getRouteById,
    addRoute,
    editRoute,
}