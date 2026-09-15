const db = require('../database');

function getUserTypes() {
    return new Promise(resolve => {
        db.query("SELECT ut.*, u.full_name as created_by_user FROM user_types as ut LEFT JOIN users as u ON u.id = ut.created_by ORDER BY ut.id ASC", (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getUserTypeById(id) {
    return new Promise(resolve => {
        db.query("SELECT ut.*, u.full_name as created_by_user FROM user_types as ut LEFT JOIN users as u On u.id = ut.created_by WHERE ut.id = ?", [id], (err, results) => {
            if(err) console.error(err);
            resolve(results[0])
        })
    })
}

function getUsers(search = null) {
    return new Promise(resolve => {
        let query = `SELECT u.id, u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id, ut.color as user_type_color, u.round_cost 
        FROM users as u JOIN user_types as ut ON ut.id = u.type_id `;
        if(search != null) {
            query += "WHERE u.username LIKE ? OR u.full_name LIKE ? OR u.phone_number LIKE ? ";
        }
        query += "ORDER BY u.type_id ASC";
        db.query(query, [ `%${search}%`, `%${search}%`, `%${search}%` ], (err, users) => {
            if(err) console.error(err);
            resolve(users)
        })
    })
}

function getDrivers() {
    return new Promise(resolve => {
        db.query("SELECT u.id, u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id FROM users as u JOIN user_types as ut ON ut.id = u.type_id WHERE u.type_id = 2 ORDER BY u.id DESC", (err, users) => {
            if(err) console.error(err);
            resolve(users)
        })
    })
}

function getUserById(id) {
    return new Promise(resolve => {
        db.query(`SELECT u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id, uc.full_name as created_by_user, u.created_at, u.round_cost 
            FROM users as u 
            JOIN user_types as ut ON ut.id = u.type_id 
            LEFT JOIN users as uc ON uc.id = u.created_by 
            WHERE u.id = ?`, [id], (err, user) => {
            if(err) console.error(err);
            resolve(user[0])
        })
    })
}

function registerUser(username, password, full_name, type_id, phone_number, round_cost, created_at, created_by) {
    return new Promise(resolve => {
        db.query("INSERT INTO users(username, password, full_name, type_id, phone_number, round_cost, created_at, created_by) VALUES(?,?,?,?,?,?,?,?)", 
        [username, password, full_name, type_id, phone_number, round_cost, created_at, created_by], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function editUser(id, username, full_name, type_id, phone_number, round_cost, password = null) {
    return new Promise(resolve => {
        if(password != null) {
            db.query("UPDATE users SET username = ?, full_name = ?, type_id = ?, phone_number = ?, round_cost = ?, password = ? WHERE id = ?", [username, full_name, type_id, phone_number, round_cost, password, id], (err) => {
                if(err) console.error(err);
                resolve()
            })
            return
        } else {
            db.query("UPDATE users SET username = ?, full_name = ?, type_id = ?, phone_number = ?, round_cost = ? WHERE id = ?", [username, full_name, type_id, phone_number, round_cost, id], (err) => {
                if(err) console.error(err);
                resolve()
            })
        }
    })
}

function addUserType(user_type, permission, color, created_at, created_by) {
    return new Promise(resolve => {
        db.query("INSERT INTO user_types(name, permission, color, created_at, created_by) VALUES(?,?,?,?,?)", [user_type, permission, color, created_at, created_by], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function editUserType(id, user_type, permission, color) {
    return new Promise(resolve => {
        db.query("UPDATE user_types SET name = ?, permission = ?, color = ? WHERE id = ?", [user_type, permission, color, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function deleteUser(id) {
    return new Promise(resolve => {
        db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
            if(err) console.error(err);
            resolve()
        }) 
    })
}

function loginUser(username, password) {
    return new Promise(resolve => {
        db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        }) 
    })
}

function initUserToken(token = null) {
    return new Promise(resolve => {
        if(token == null) {
            resolve({
                status: 'error',
                message: "ไม่พบ Token"
            })
        }
        if(atob(token).split(":").length == 2) {
            const username = atob(token).split(":")[0]
            const password = atob(token).split(":")[1]
            db.query("SELECT u.id, u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id, ut.permission FROM users as u JOIN user_types as ut ON ut.id = u.type_id WHERE u.username = ? AND u.password = ?", [username, password], (err, user) => {
                if(err) console.error(err);
                resolve({
                    status: 'success',
                    user: user[0]
                })
            }) 
        } else {
            resolve({
                status: 'error',
                message: "Token ไม่ถูกต้อง"
            })
        }
    })
}

function saveAccountSettings(id, username, full_name, phone_number) {
    return new Promise(resolve => {
        db.query("UPDATE users SET username = ?, full_name = ?, phone_number = ? WHERE id = ?", [username, full_name, phone_number, id], (err) => {
            if(err) console.error(err);
            resolve()
        }) 
    })
}

function changeAccountPassword(id, currentPassword, newPassword) {
    return new Promise(resolve => {
        db.query("SELECT password FROM users WHERE id = ? AND password = ?", [id, currentPassword], (err, checkCurrentPasswordResult) => {
            if(err) console.error(err);
            if(checkCurrentPasswordResult.length == 1) {
                db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
                    if(err) console.error(err);
                    resolve({
                        status: 'success',
                        message: 'เปลี่ยนรหัสผ่านเสร็จสมบูรณ์',
                    })
                }) 
            } else {
                resolve({
                    status: 'error',
                    message: 'รหัสผ่านเดิมไม่ถูกต้อง',
                })
            }
        })
    })
}

function getCalculateRoundByDate(date = null) {
    return new Promise(resolve => {
        let params = []
        let query = `SELECT u.id as driver_id, u.full_name, u.username, DATE(tr.date) as date, COUNT(DISTINCT tr.round) AS round_count, u.round_cost 
        FROM transition_records as tr 
        JOIN users as u ON u.id = tr.driver_id `
        if(date) {
            params.push(date)
            query += "WHERE DATE(tr.date) = ? "
        }
        query += " GROUP BY u.id, DATE(tr.date) "
        db.query(query, params, (err, result) => {
            if(err) console.error(err);
            resolve(result)
        }) 
    })
}

function getCalculateRoundByMonth(month) {
    return new Promise(resolve => {
        let params = []
        let query = `SELECT u.id as driver_id, u.full_name, u.username, DATE_FORMAT(tr.date, '%Y-%m') as month, COUNT(DISTINCT DATE(tr.date), tr.round) AS round_count, u.round_cost 
        FROM transition_records as tr 
        JOIN users as u ON u.id = tr.driver_id `
        if(month) {
            params.push(month)
            query += "WHERE DATE_FORMAT(tr.date, '%Y-%m') = ? "
        }
        query += " GROUP BY u.id, DATE_FORMAT(tr.date, '%Y-%m') "
        db.query(query, params, (err, result) => {
            if(err) console.error(err);
            resolve(result)
        }) 
    })
}

function getCalculateRoundReport(driver_id, date) {
    return new Promise(resolve => {
        db.query(`SELECT u.full_name, u.username, u.round_cost, tr.round, tr.time, tr.status, tr.finish_at,
            c.customer_name, c.customer_id
            FROM transition_records as tr
            JOIN users as u ON u.id = tr.driver_id
            JOIN customers as c ON c.id = tr.customer_id
            WHERE tr.driver_id = ? AND DATE(tr.date) = ?
            ORDER BY tr.round ASC, tr.time ASC`, [driver_id, date], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

function getCalculateRoundReportByMonth(driver_id, month) {
    return new Promise(resolve => {
        db.query(`SELECT u.full_name, u.username, u.round_cost, tr.date, tr.round, tr.time, tr.status, tr.finish_at,
            c.customer_name, c.customer_id
            FROM transition_records as tr
            JOIN users as u ON u.id = tr.driver_id
            JOIN customers as c ON c.id = tr.customer_id
            WHERE tr.driver_id = ? AND DATE_FORMAT(tr.date, '%Y-%m') = ?
            ORDER BY tr.date ASC, tr.round ASC, tr.time ASC`, [driver_id, month], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

module.exports = {
    getUserTypes,
    getUsers,
    getUserById,
    registerUser,
    editUser,
    deleteUser,
    loginUser,
    getDrivers,
    initUserToken,
    getUserTypeById,
    editUserType,
    addUserType,
    saveAccountSettings,
    changeAccountPassword,
    getCalculateRoundByDate,
    getCalculateRoundByMonth,
    getCalculateRoundReport,
    getCalculateRoundReportByMonth,
}