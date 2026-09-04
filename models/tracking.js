const db = require('../database')
const moment = require('moment-timezone')
moment.tz.setDefault(process.env.TIMEZONE);

function finishDelivery(id, finish_at) {
    return new Promise(resolve => {
        db.query("UPDATE transition_records SET status = 1, finish_at = ? WHERE id = ?", [finish_at, id], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success"
            })
        })
    })
}

function arrivalAtWarehouse(id, time) {
    return new Promise(resolve => {
        db.query("UPDATE transition_records SET arrival_at_warehouse = ? WHERE id = ?", [time, id], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success"
            })
        })
    })
}

function saveLocation(truck_id, driver_id, position_latitude, position_longitude) {
    return new Promise(resolve => {
        const created_at = moment().format("YYYY-MM-DD HH:mm:ss")
        db.query("INSERT INTO location_records(truck_id, driver_id, position_latitude, position_longitude, created_at) VALUES(?,?,?,?,?)", [truck_id, driver_id, position_latitude, position_longitude,created_at], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success"
            })
        })
    })
}

function getAllTruckLocation() {
    return new Promise(resolve => {
        db.query(`WITH LatestLocations AS (
            SELECT 
                lr.truck_id, 
                lr.position_latitude, 
                lr.position_longitude, 
                t.license_plate, 
                lr.created_at, 
                u.full_name,
                ROW_NUMBER() OVER (
                    PARTITION BY lr.truck_id 
                    ORDER BY lr.created_at DESC
                ) AS rn
            FROM location_records AS lr 
            JOIN trucks AS t ON t.id = lr.truck_id 
            JOIN users AS u ON u.id = lr.driver_id 
            WHERE DATE(lr.created_at) = CURDATE() GROUP BY lr.truck_id 
        )
        SELECT 
            truck_id, 
            position_latitude, 
            position_longitude, 
            license_plate, 
            created_at, 
            full_name
        FROM LatestLocations
        WHERE rn = 1
        ORDER BY created_at DESC;`, (err, results) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                locations: results
            })
        })
    })
}

function getAllCustomersLocation(group_id = null) {
    return new Promise(resolve => {
        let query = `SELECT c.id, c.customer_name, c.customer_id, c.location, c.group_id, cg.name as group_name, cg.color, c.address, c.phone_number FROM customers as c JOIN customer_groups as cg ON cg.id = c.group_id `
        let params = []
        if(group_id != null) {
            query += `WHERE c.group_id = ?`
            params.push(group_id)
        }
        db.query(query+` ORDER BY c.id DESC`, params, (err, results) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                locations: results
            })
        })
    })
}

function getTruckLocation(date = null, truck_id) {
    return new Promise(resolve => {
        let query = `SELECT lr.position_latitude, lr.position_longitude, lr.created_at, u.full_name as driver_full_name, t.license_plate, tr.customer_id,
        tr.status as transition_status, tr.arrival_at_warehouse, tr.finish_at, c.id as customer_row_id, c.customer_name, c.location
        FROM location_records as lr
        JOIN trucks as t ON t.id = lr.truck_id
        JOIN users as u ON u.id = lr.driver_id 
        JOIN transition_records as tr ON tr.truck_id = lr.truck_id AND tr.driver_id = lr.driver_id AND DATE(tr.date) = DATE(lr.created_at) 
        JOIN customers AS c ON c.id = tr.customer_id 
        WHERE lr.truck_id = ?`

        const params = [truck_id]

        if (date) {
            query += ` AND DATE(lr.created_at) = ?`
            params.push(date);
        }

        query += ` ORDER BY lr.id ASC`

        db.query(query, params, (err, results) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                locations: results
            })
        })
    })
}

function ongoingDrivers() {
    return new Promise(resolve => {
        db.query(`SELECT r.id, u.full_name, u.id as driver_id, t.license_plate, t.id as truck_id, r.time, c.location, c.customer_name, c.customer_id, cg.color, cg.id as group_id  
            FROM transition_records as r 
            JOIN users as u ON r.driver_id = u.id 
            JOIN trucks as t ON t.id = r.truck_id 
            JOIN customers AS c ON c.id = r.customer_id 
            JOIN customer_groups as cg ON c.group_id = cg.id 
            WHERE r.date = CURDATE()
            ORDER BY t.id, r.time ASC, r.id ASC`, (err, drivers) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
                data: drivers
            })
        })
    })
}

function saveArrivalImageFile(route_id, file_names) {
    return new Promise(resolve => {
        const imageList = Array.isArray(file_names) ? file_names.join(',') : (file_names || '');
        db.query("UPDATE transition_records SET arrivalImage = ? WHERE id = ?", [imageList, route_id], (err) => {
            if(err) {
                resolve({
                    status: "error",
                    message: err.message
                })
            }
            resolve({
                status: "success",
            })
        })
    })
}

function calculateTruckStats(locations) {
    if (!locations || locations.length === 0) {
        return {};
    }

    const locationsByDate = locations.reduce((groups, location) => {
        const date = moment(location.created_at).format('YYYY-MM-DD');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(location);
        return groups;
    }, {});

    return Object.fromEntries(
        Object.entries(locationsByDate).map(([date, dailyLocations]) => [
            date,
            calculateDailyTruckStats(dailyLocations)
        ])
    );
}

function calculateDailyTruckStats(locations) {
    if (locations.length < 2) {
        return {
            total_distance: 0,
            total_time: 0,
            average_speed: 0,
            max_speed: 0
        };
    }

    const orderedLocations = [...locations].sort((first, second) =>
        new Date(first.created_at) - new Date(second.created_at)
    );
    const maxReasonableSpeed = 120;
    let totalDistance = 0;
    let maxSpeed = 0;
    for (let i = 1; i < orderedLocations.length; i++) {
        const previous = orderedLocations[i - 1];
        const current = orderedLocations[i];
        const lat1 = parseFloat(previous.position_latitude);
        const lon1 = parseFloat(previous.position_longitude);
        const lat2 = parseFloat(current.position_latitude);
        const lon2 = parseFloat(current.position_longitude);
        if (
            !Number.isFinite(lat1) ||
            !Number.isFinite(lon1) ||
            !Number.isFinite(lat2) ||
            !Number.isFinite(lon2)
        ) {
            continue;
        }
        const distance = calculateDistance(
            lat1,
            lon1,
            lat2,
            lon2
        );
        const timeDiff = new Date(current.created_at) - new Date(previous.created_at);
        const hours = timeDiff / (1000 * 60 * 60);

        if (hours > 0) {
            const speed = distance / hours;

            if (speed <= maxReasonableSpeed) {
                totalDistance += distance;
            }
            if (speed > maxSpeed && speed <= maxReasonableSpeed) {
                maxSpeed = speed;
            }
        }
    }
    const startTime = new Date(orderedLocations[0].created_at);
    const endTime = new Date(orderedLocations[orderedLocations.length - 1].created_at);
    const totalTime = endTime - startTime;
    const totalHours = totalTime / (1000 * 60 * 60);
    const averageSpeed = totalHours > 0 ? totalDistance / totalHours : 0;
    return {
        total_distance: Number(totalDistance.toFixed(2)),
        total_time: totalTime,
        average_speed: Number(averageSpeed.toFixed(2)),
        max_speed: Number(maxSpeed.toFixed(2))
    };
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = {
    finishDelivery,
    saveLocation,
    getAllTruckLocation,
    getTruckLocation,
    getAllCustomersLocation,
    ongoingDrivers,
    saveArrivalImageFile,
    arrivalAtWarehouse,
    calculateTruckStats,
}