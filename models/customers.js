const db = require('../database');

function getCustomers(search = null) {
    return new Promise(resolve => {
        let query = "SELECT * FROM customers ";
        if(search != null) {
            query += "WHERE customer_name LIKE ? OR customer_id LIKE ? OR location LIKE ? ";
        }
        query += "ORDER BY id DESC";
        db.query(query, [ `%${search}%`, `%${search}%`, `%${search}%` ], (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })    
}

function getCustomerById(id) {
    return new Promise(resolve => {
        db.query("SELECT * FROM customers WHERE id = ?", [id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })    
}

function addCustomers(
    customer_name,
    customer_id,
    location
) {
    return new Promise(resolve => {
        db.query("INSERT INTO customers(customer_name, customer_id, location) VALUES(?,?,?)", 
            [customer_name, customer_id, location], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editCustomer(
    id,
    customer_name,
    customer_id,
    location
) {
    return new Promise(resolve => {
        db.query("UPDATE customers SET customer_name = ?, customer_id = ?, location = ? WHERE id = ?", 
            [customer_name, customer_id, location, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

module.exports = {
    getCustomers,
    getCustomerById,
    addCustomers,
    editCustomer
}