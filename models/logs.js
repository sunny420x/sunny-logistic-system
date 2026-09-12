const db = require('../database');

function addLog(action = "unknown", details) {
    return new Promise(resolve => {
        db.query("INSERT INTO logs(action, details) VALUES(?,?)", [action, details], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function showLogs(limit = null) {
    return new Promise(resolve => {
        let params = []
        let query = `SELECT * FROM logs ORDER BY id DESC `

        if(limit) {
            query += `LIMIT ?`
            params.push(limit)
        }

        db.query(query, params, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getLogById(id = null) {
    if(!id) return;

    return new Promise(resolve => {
        db.query("SELECT * FROM logs WHERE id = ?", [id], (err, results) => {
            if(err) console.error(err);
            resolve(results[0])
        })
    })
}

function clearLogs(limit = null) {
    return new Promise(resolve => {
        let params = []
        let query = `DELETE FROM logs ORDER BY id ASC `

        if(limit) {
            query += `LIMIT ?`
            params.push(limit)
        }

        db.query(query, params, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

module.exports = {
    addLog, 
    showLogs, 
    getLogById,
    clearLogs
}