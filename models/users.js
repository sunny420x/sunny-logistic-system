const db = require('../database');

function getUserTypes() {
    return new Promise(resolve => {
        db.query("SELECT * FROM user_types ORDEr BY id ASC", (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getUserTypeById(id) {
    return new Promise(resolve => {
        db.query("SELECT * FROM user_types WHERE id = ?", [id], (err, results) => {
            if(err) console.error(err);
            resolve(results[0])
        })
    })
}

function getUsers(search = null) {
    return new Promise(resolve => {
        let query = "SELECT u.id, u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id, ut.color as user_type_color FROM users as u JOIN user_types as ut ON ut.id = u.type_id ";
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
        db.query("SELECT u.username, u.full_name, ut.name as user_type, u.phone_number, u.type_id FROM users as u JOIN user_types as ut ON ut.id = u.type_id WHERE u.id = ?", [id], (err, user) => {
            if(err) console.error(err);
            resolve(user[0])
        })
    })
}

function registerUser(username, password, full_name, type_id, phone_number) {
    return new Promise(resolve => {
        db.query("INSERT INTO users(username, password, full_name, type_id, phone_number) VALUES(?,?,?,?,?)", [username, password, full_name, type_id, phone_number], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function editUser(id, username, full_name, type_id, phone_number, password = null) {
    return new Promise(resolve => {
        if(password != null) {
            db.query("UPDATE users SET username = ?, full_name = ?, type_id = ?, phone_number = ?, password = ? WHERE id = ?", [username, full_name, type_id, phone_number, password, id], (err) => {
                if(err) console.error(err);
                resolve()
            })
            return
        } else {
            db.query("UPDATE users SET username = ?, full_name = ?, type_id = ?, phone_number = ? WHERE id = ?", [username, full_name, type_id, phone_number, id], (err) => {
                if(err) console.error(err);
                resolve()
            })
        }
    })
}

function addUserType(user_type, permission, color) {
    return new Promise(resolve => {
        db.query("INSERT INTO user_types(name, permission, color) VALUES(?,?,?)", [user_type, permission, color], (err) => {
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
}