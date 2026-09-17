const db = require('../database');

function getFollowingUp() {
    return new Promise(resolve => {
        db.query(`SELECT * FROM following_up ORDER BY created_at DESC`, (err, results) => {
            if(err) console.error(err);
            resolve(results)
        })
    })
}

function getFollowingUpByTruckId(truck_id) {
    return new Promise(resolve => {
        db.query(`SELECT * FROM following_up WHERE truck_id = ? ORDER BY created_at DESC`, [truck_id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

function getFollowingUpById(following_up_id) {
    return new Promise(resolve => {
        db.query(`SELECT * FROM following_up WHERE id = ?`, [following_up_id], (err, result) => {
            if(err) console.error(err);
            resolve(result[0])
        })
    })
}

function addFollowingUp(repair_id, target_mileage, created_at, created_by) {
    return new Promise(resolve => {
        db.query(`INSERT INTO following_up (repair_id, target_mileage, created_at, created_by) VALUES (?, ?, ?, ?)`, 
            [repair_id, target_mileage, created_at, created_by], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

function updateFollowingUp(following_up_id, repair_id, target_mileage) {
    return new Promise(resolve => {
        db.query(`UPDATE following_up SET repair_id = ?, target_mileage = ? WHERE id = ?`, 
            [repair_id, target_mileage, following_up_id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

function deleteFollowingUp(following_up_id) {
    return new Promise(resolve => {
        db.query(`DELETE FROM following_up WHERE id = ?`, [following_up_id], (err, result) => {
            if(err) console.error(err);
            resolve(result)
        })
    })
}

module.exports = {
    getFollowingUp,
    getFollowingUpByTruckId,
    addFollowingUp,
    updateFollowingUp,
    getFollowingUpById,
    deleteFollowingUp,
}