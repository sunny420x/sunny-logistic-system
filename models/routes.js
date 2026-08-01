const db = require('../database');

function getRoutes(date = null) {
    let query = `SELECT r.id, r.date, c.customer_name, c.customer_id, c.location, r.status, t.license_plate, u.full_name as driver_full_name, r.driver_id, t.id as truck_id 
    FROM transition_records as r 
    JOIN customers as c ON c.id = r.customer_id 
    LEFT JOIN trucks as t ON t.id = r.truck_id
    JOIN users as u ON u.id = r.driver_id `
    return new Promise(resolve => {
        if(date != null) {
            query += "WHERE r.date = ? "
            db.query(query+"ORDER BY r.date DESC", [date], (err, results) => {
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
        db.query(`SELECT r.id, r.date, c.customer_name, c.customer_id, c.location, r.status, t.license_plate, u.full_name as driver_full_name, r.driver_id, t.id as truck_id 
        FROM transition_records as r 
        JOIN customers as c ON c.id = r.customer_id 
        LEFT JOIN trucks as t ON t.id = r.truck_id
        JOIN users as u ON u.id = r.driver_id WHERE r.driver_id = ? AND r.date = CURDATE()`, [driver_id], (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })    
}

function getRouteById(id) {
    return new Promise(resolve => {
        db.query(`SELECT r.id, r.date, c.customer_name, c.customer_id, c.location, t.license_plate, r.driver_id, u.full_name as driver_full_name 
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
    date
) {
    return new Promise(resolve => {
        db.query("INSERT INTO transition_records(customer_id, truck_id, driver_id, date) VALUES(?,?,?,?)", 
            [customer_id, truck_id, driver_id, date], (err) => {
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
    date
) {
    return new Promise(resolve => {
        db.query("UPDATE transition_records SET customer_id = ?, truck_id = ?, driver_id = ?, date = ? WHERE id = ?", 
            [customer_id, truck_id, driver_id, date, id], (err) => {
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
    editRoute
}