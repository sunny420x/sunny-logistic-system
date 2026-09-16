const db = require('../database');

function getRoutineChecks(date, search, truck_id) {
    return new Promise((resolve, reject) => {
        let query = `SELECT rc.*, t.license_plate, u.full_name as created_by_user 
        FROM routine_checks as rc 
        LEFT JOIN trucks as t ON rc.truck_id = t.id 
        LEFT JOIN users as u ON rc.created_by = u.id WHERE 1=1`;
        const params = [];

        if(date) {
            query += ' AND DATE(created_at) = ?';
            params.push(date);
        }

        if(search) {
            query += ' AND license_plate LIKE ?';
            params.push(`%${search}%`);
        }

        if(truck_id) {
            query += ' AND rc.truck_id = ?';
            params.push(truck_id);
        }

        db.query(query, params, (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

function getRoutineCheckById(id) {
    return new Promise((resolve, reject) => {
        const query = `SELECT rc.*, t.license_plate, u.full_name as created_by_user 
        FROM routine_checks as rc 
        LEFT JOIN trucks as t ON rc.truck_id = t.id 
        LEFT JOIN users as u ON rc.created_by = u.id WHERE rc.id = ?`;
        db.query(query, [id], (err, result) => {
            if(err) reject(err);
            else resolve(result[0]);
        });
    });
}

function getRoutineChecksByLicensePlate(license_plate) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT rc.*, t.license_plate FROM routine_checks as rc LEFT JOIN trucks as t ON rc.truck_id = t.id WHERE t.license_plate = ?';
        db.query(query, [license_plate], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

function addRoutineCheck(truck_id, current_mileage, note, created_at, created_by) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO routine_checks (truck_id, current_mileage, note, created_at, created_by) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [truck_id, current_mileage, note, created_at, created_by], function(err, result) {
            if(err) reject(err);
            else resolve(result.insertId);
        });
    });
}

function updateRoutineCheck(id, truck_id, current_mileage, note) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE routine_checks SET truck_id = ?, current_mileage = ?, note = ? WHERE id = ?';
        db.query(query, [truck_id, current_mileage, note, id], function(err, result) {
            if(err) reject(err);
            else resolve(result.affectedRows);
        });
    });
}

function deleteRoutineCheckById(id) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM routine_checks WHERE id = ?';
        db.query(query, [id], function(err, result) {
            if(err) reject(err);
            else resolve(result.affectedRows);
        });
    });
}

module.exports = { getRoutineChecks, getRoutineCheckById, getRoutineChecksByLicensePlate, addRoutineCheck, updateRoutineCheck, deleteRoutineCheckById };