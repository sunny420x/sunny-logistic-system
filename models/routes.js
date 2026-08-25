const db = require('../database');

function getRoutes(date = null, search = null, status = null) {
    return new Promise((resolve, reject) => {
        let query = `SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.location, r.status, 
            t.license_plate, u.full_name as driver_full_name, r.driver_id, 
            t.id as truck_id, r.weight, r.finish_at, r.arrivalImage, cg.color, c.group_id, r.location_note, r.driver_note, r.temporary_location 
        FROM transition_records as r 
        JOIN customers as c ON c.id = r.customer_id 
        JOIN customer_groups as cg ON c.group_id = cg.id 
        LEFT JOIN trucks as t ON t.id = r.truck_id
        JOIN users as u ON u.id = r.driver_id`;

        let conditions = [];
        let params = [];

        if (date) {
            conditions.push("r.date = ?");
            params.push(date);
        }

        if (search) {
            conditions.push("(c.customer_name LIKE ? OR c.customer_id LIKE ?)");
            params.push(`%${search}%`, `%${search}%`); // ใส่ 2 ค่าสำหรับ 2 เครื่องหมาย ?
        }

        if (status) {
            conditions.push("r.status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY r.date DESC";

        db.query(query, params, (err, results) => {
            if (err) {
                console.error("Database Query Error:", err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getMyRoutes(driver_id) {
    return new Promise(resolve => {
        db.query(`SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.id as customer_row_id, c.location, r.status, t.license_plate, u.full_name as driver_full_name, 
            r.driver_id, t.id as truck_id, r.weight, r.finish_at, r.arrivalImage,  r.location_note, r.driver_note, r.temporary_location 
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
        db.query(`SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.id as customer_row_id, c.location, t.license_plate, t.id as truck_id, r.driver_id, 
            u.full_name as driver_full_name, r.weight, r.finish_at, r.arrivalImage, r.status, r.location_note, r.driver_note, r.temporary_location, r.arrival_at_warehouse 
            FROM transition_records as r JOIN customers as c ON c.id = r.customer_id 
            LEFT JOIN trucks as t ON t.id = r.truck_id 
            JOIN users as u ON u.id = r.driver_id WHERE r.id = ?`, [id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
            console.log(result)
        })
    })    
}

function addRoute(
    customer_id,
    truck_id,
    driver_id,
    date,
    time,
    weight,
    location_note,
    driver_note,
    temporary_location 
) {
    return new Promise(resolve => {
        db.query("INSERT INTO transition_records(customer_id, truck_id, driver_id, date, time, weight, location_note, driver_note, temporary_location) VALUES(?,?,?,?,?,?,?,?,?)", 
            [customer_id, truck_id, driver_id, date, time, weight, location_note, driver_note, temporary_location], (err) => {
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
    weight,
    location_note,
    driver_note,
    temporary_location,
    status,
    arrival_at_warehouse
) {
    return new Promise(resolve => {
        db.query(`UPDATE transition_records SET 
            customer_id = ?, truck_id = ?, driver_id = ?, date = ?, time = ?, weight = ?, 
            location_note = ?, driver_note = ?, temporary_location = ?, status = ?, 
            arrival_at_warehouse = ? WHERE id = ?`, 
            [customer_id, truck_id, driver_id, date, time, weight, location_note, driver_note, temporary_location, status, arrival_at_warehouse, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function deleteRouteById(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM transition_records WHERE id = ?`, [id], (err) => {
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
    deleteRouteById,
}