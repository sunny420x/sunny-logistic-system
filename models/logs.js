const db = require('../database');
const moment = require('moment')

function addLog(action = "unknown", details) {
    return new Promise(resolve => {
        const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
        db.query("INSERT INTO logs(action, details, created_at) VALUES(?,?,?)", [action, details, created_at], (err) => {
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

        db.query(query, params, (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function deleteLogById(id = null) {
    if(!id) return;
    return new Promise(resolve => {
        db.query("DELETE FROM logs WHERE id = ?", [id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

module.exports = {
    addLog, 
    showLogs, 
    getLogById,
    clearLogs,
    deleteLogById
}