const db = require('../database');

function addRepair( truck_id, repair_type, details, notes, created_at, created_by ) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO repairs (truck_id, repair_type, details, note, created_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [truck_id, repair_type, details, notes, created_at, created_by], (err) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getRepairs() {
    return new Promise((resolve, reject) => {
        const query = `SELECT r.*, rt.name as repair_type_name, t.license_plate, u.full_name as created_by_user
        FROM repairs as r 
        LEFT JOIN repair_types as rt ON r.repair_type = rt.id
        JOIN trucks as t ON r.truck_id = t.id 
        LEFT JOIN users as u ON r.created_by = u.id 
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getRepairById(id) {
    return new Promise((resolve, reject) => {
        const query = `SELECT r.*, rt.name as repair_type_name, t.license_plate, u.full_name as created_by_user FROM repairs as r 
        LEFT JOIN repair_types as rt ON r.repair_type = rt.id
        JOIN trucks as t ON r.truck_id = t.id 
        LEFT JOIN users as u ON r.created_by = u.id 
        WHERE r.id = ?`;
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
}

function updateRepair(id, truck_id, repair_type, note, details) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE repairs
            SET truck_id = ?, repair_type = ?, note = ?, details = ?
            WHERE id = ?
        `;
        db.query(query, [truck_id, repair_type, note, details, id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function deleteRepair(id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM repairs WHERE id = ?`;
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getRepairTypes() {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM repair_types`;
        db.query(query, (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function addRepairType(name, created_at, user_id) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO repair_types (name, created_at, created_by) VALUES (?, ?, ?)`;
        db.query(query, [name, created_at, user_id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getRepairTypeById(id) {
    return new Promise((resolve, reject) => {
        const query = `SELECT rt.*, u.full_name as created_by_user FROM repair_types as rt JOIN users as u ON rt.created_by = u.id WHERE rt.id = ?`;
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
}

function deleteRepairType(id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM repair_types WHERE id = ?`;
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function updateRepairType(id, name) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE repair_types SET name = ? WHERE id = ?`;
        db.query(query, [name, id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = {
    addRepair,
    getRepairs,
    getRepairById,
    updateRepair,
    deleteRepair,
    getRepairTypes,
    addRepairType,
    updateRepairType,
    deleteRepairType,
    getRepairTypeById
};