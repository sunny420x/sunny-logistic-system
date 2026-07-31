const db = require('../database');

function getDashboardDelivered(date) {
    return new Promise(resolve => {
        db.query("SELECT COUNT(*) as count FROM transition_records WHERE status = 1 AND date = ?", [date], (err, delivered) => {
            if(err) throw err;
            resolve(delivered[0])
        })
    })
}

function getDashboardAllPackages(date) {
    return new Promise(resolve => {
        db.query("SELECT COUNT(*) as count FROM transition_records WHERE date = ?", [date], (err, amount) => {
            if(err) throw err;
            resolve(amount[0])
        })
    })
}

function getDashboardCustomers() {
    return new Promise(resolve => {
        db.query("SELECT COUNT(*) as count FROM customers", (err, amount) => {
            if(err) throw err;
            resolve(amount[0])
        })
    })
}

function getDashboardUsers() {
    return new Promise(resolve => {
        db.query("SELECT COUNT(*) as count FROM users", (err, amount) => {
            if(err) throw err;
            resolve(amount[0])
        })
    })
}

module.exports = {
    getDashboardDelivered,
    getDashboardAllPackages,
    getDashboardCustomers,
    getDashboardUsers,
}