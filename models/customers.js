const db = require('../database');

function getCustomers(search = null, group_id = null) {
    return new Promise(resolve => {
        let query = `SELECT c.*, cg.name as customer_group, c.group_id, c.address, cg.color, u.full_name as created_by_user 
        FROM customers as c 
        JOIN customer_groups as cg ON cg.id = c.group_id
        LEFT JOIN users as u ON u.id = c.created_by `
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
        db.query("SELECT cg.*, u.full_name as created_by_user FROM customer_groups as cg LEFT JOIN users as u ON u.id = cg.created_by ORDER BY cg.id ASC", (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getCustomerGroupById(id) {
    return new Promise(resolve => {
        db.query("SELECT cg.*, u.full_name as created_by_user FROM customer_groups as cg LEFT JOIN users as u ON u.id = cg.created_by WHERE cg.id = ?", [id], (err, result) => {
            if(err) console.error(err);
            resolve(result[0])
        })
    })
}

function getCustomerById(id) {
    return new Promise(resolve => {
        db.query("SELECT c.*, u.full_name as created_by_user FROM customers as c LEFT JOIN users as u ON u.id = c.created_by WHERE c.id = ?", [id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })    
}

function addCustomers(
    customer_name,
    customer_id,
    address,
    location,
    group_id,
    phone_number,
    created_at,
    created_by
) {
    return new Promise(resolve => {
        db.query("INSERT INTO customers(customer_name, customer_id, location, address, group_id, phone_number, created_at, created_by) VALUES(?,?,?,?,?,?,?,?)", 
            [customer_name, customer_id, location, address, group_id, phone_number, created_at, created_by], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editCustomer(
    id,
    customer_name,
    customer_id,
    address,
    location,
    group_id,
    phone_number
) {
    return new Promise(resolve => {
        db.query("UPDATE customers SET customer_name = ?, customer_id = ?, location = ?, address = ?, group_id = ?, phone_number = ? WHERE id = ?", 
            [customer_name, customer_id, location, address, group_id, phone_number, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function addCustomerGroup(
    name,
    color,
    created_at,
    created_by
) {
    return new Promise(resolve => {
        db.query("INSERT INTO customer_groups(name, color, created_at, created_by) VALUES(?,?,?,?)", 
            [name, color, created_at, created_by], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}

function editCustomerGroup(
    id,
    name,
    color
) {
    return new Promise(resolve => {
        db.query("UPDATE customer_groups SET name = ?, color = ? WHERE id = ?", 
            [name, color, id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })    
}


function deleteCustomerById(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM customers WHERE id = ?`, [id], (err) => {
            if(err) console.error(err);
            resolve()
        })
    })
}

function deleteCustomerGroupById(id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM customer_groups WHERE id = ?`, [id], (err) => {
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
    addCustomerGroup,
    editCustomerGroup,
    getCustomerGroupById,
    deleteCustomerById,
    deleteCustomerGroupById,
}