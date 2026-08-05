const db = require('../database');

function getCustomers(search = null, group_id = null) {
    return new Promise(resolve => {
        let query = "SELECT c.*, cg.name as customer_group, c.group_id FROM customers as c JOIN customer_groups as cg ON cg.id = c.group_id ";
        if(search != null && group_id == null) {
            query += "WHERE c.customer_name LIKE ? OR c.customer_id LIKE ? OR c.location LIKE ? ORDER BY c.id DESC";
            db.query(query, [ `%${search}%`, `%${search}%`, `%${search}%` ], (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        }
        if(search == null && group_id != null) {
            query += "WHERE c.group_id = ? ORDER BY c.id DESC";
            db.query(query, [ group_id ], (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        }
        if(search != null && group_id != null) {
            query += "WHERE (c.customer_name LIKE ? OR c.customer_id LIKE ? OR c.location LIKE ?) AND c.group_id = ? ORDER BY c.id DESC"
            db.query(query, [ `%${search}%`, `%${search}%`, `%${search}%`, group_id ], (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        }
        if(search == null && group_id == null) {
            query += "ORDER BY c.id DESC"
            db.query(query, (err, results) => {
                if(err) console.error(err);
                resolve(results)
            })
        }
    })    
}

function getCustomerGroups() {
    return new Promise(resolve => {
        db.query("SELECT * FROM customer_groups ORDER BY id ASC", (err, results) => {
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
    location,
    group_id
) {
    return new Promise(resolve => {
        db.query("INSERT INTO customers(customer_name, customer_id, location, group_id) VALUES(?,?,?,?)", 
            [customer_name, customer_id, location, group_id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editCustomer(
    id,
    customer_name,
    customer_id,
    location,
    group_id
) {
    return new Promise(resolve => {
        db.query("UPDATE customers SET customer_name = ?, customer_id = ?, location = ?, group_id = ? WHERE id = ?", 
            [customer_name, customer_id, location, group_id, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

module.exports = {
    getCustomers,
    getCustomerById,
    addCustomers,
    editCustomer,
    getCustomerGroups,
}