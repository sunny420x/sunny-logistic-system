const db = require('../database');

const resourceQueries = {
    customers: {
        select: `SELECT c.*, cg.name as customer_group, cg.color, u.full_name as created_by_user
            FROM customers c JOIN customer_groups cg ON cg.id = c.group_id
            LEFT JOIN users u ON u.id = c.created_by`,
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.q) {
                conditions.push('(c.customer_name LIKE ? OR c.customer_id LIKE ? OR c.location LIKE ?)');
                params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
            }
            if (filters.group_id) { conditions.push('c.group_id = ?'); params.push(filters.group_id); }
            return { conditions, params };
        },
        order: 'c.id DESC'
    },
    customer_groups: {
        select: 'SELECT cg.*, u.full_name as created_by_user FROM customer_groups cg LEFT JOIN users u ON u.id = cg.created_by',
        where: () => ({ conditions: [], params: [] }),
        order: 'cg.id DESC'
    },
    trucks: {
        select: `SELECT t.id, t.license_plate, t.brand, t.model, t.cost_per_km, t.round_cost,
            t.mileage_cycle, u.full_name as created_by_user
            FROM trucks t LEFT JOIN users u ON u.id = t.created_by`,
        where(filters) {
            if (!filters.q) return { conditions: [], params: [] };
            return { conditions: ['t.license_plate LIKE ?'], params: [`%${filters.q}%`] };
        },
        order: 't.id DESC'
    },
    users: {
        select: `SELECT u.id, u.username, u.full_name, ut.name as user_type, u.phone_number,
            u.type_id, ut.color as user_type_color FROM users u JOIN user_types ut ON ut.id = u.type_id`,
        where(filters) {
            if (!filters.q) return { conditions: [], params: [] };
            return { conditions: ['(u.username LIKE ? OR u.full_name LIKE ? OR u.phone_number LIKE ?)'], params: [`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`] };
        },
        order: 'u.type_id ASC, u.id DESC'
    },
    user_types: {
        select: 'SELECT ut.*, u.full_name as created_by_user FROM user_types ut LEFT JOIN users u ON u.id = ut.created_by',
        where: () => ({ conditions: [], params: [] }),
        order: 'ut.id ASC'
    },
    logs: {
        select: 'SELECT l.* FROM logs l',
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.action) { conditions.push('l.action = ?'); params.push(filters.action); }
            if (filters.date) { conditions.push('DATE(l.created_at) = ?'); params.push(filters.date); }
            return { conditions, params };
        },
        order: 'l.id DESC'
    },
    routes: {
        select: `SELECT r.id, r.date, r.time, c.customer_name, c.customer_id, c.location, r.status,
            t.license_plate, u.full_name as driver_full_name, r.driver_id, t.id as truck_id,
            r.weight, r.finish_at, r.arrivalImage, cg.color, c.group_id, r.location_note,
            r.driver_note, r.temporary_location, r.billing_id, r.round
            FROM transition_records r JOIN customers c ON c.id = r.customer_id
            JOIN customer_groups cg ON c.group_id = cg.id LEFT JOIN trucks t ON t.id = r.truck_id
            LEFT JOIN users u ON u.id = r.driver_id`,
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.date) { conditions.push('r.date = ?'); params.push(filters.date); }
            if (filters.q) { conditions.push('(c.customer_name LIKE ? OR c.customer_id LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`); }
            if (filters.status !== undefined && filters.status !== '') { conditions.push('r.status = ?'); params.push(filters.status); }
            return { conditions, params };
        },
        order: 'r.driver_id DESC, r.date DESC, r.round ASC, r.time ASC'
    },
    maintenance: {
        select: `SELECT t.license_plate, u.full_name, u.id AS user_id, mt.name as maintenace_name, m.note,
            m.created_at, m.updated_at, m.id AS id, m.truck_id, m.maintenance_type
            FROM truck_maintenance m JOIN maintenance_type mt ON mt.id = m.maintenance_type
            JOIN trucks t ON t.id = m.truck_id JOIN users u ON u.id = m.user_id`,
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.truck_id) { conditions.push('m.truck_id = ?'); params.push(filters.truck_id); }
            if (filters.date) { conditions.push('DATE(m.created_at) = ?'); params.push(filters.date); }
            return { conditions, params };
        },
        order: 'm.id DESC'
    },
    maintenance_types: {
        select: 'SELECT mt.* FROM maintenance_type mt',
        where: () => ({ conditions: [], params: [] }),
        order: 'mt.id ASC'
    },
    repairs: {
        select: `SELECT r.*, rt.name as repair_type_name, t.license_plate, u.full_name as created_by_user
            FROM repairs r LEFT JOIN repair_types rt ON r.repair_type = rt.id
            JOIN trucks t ON r.truck_id = t.id LEFT JOIN users u ON r.created_by = u.id`,
        where: () => ({ conditions: [], params: [] }),
        order: 'r.id DESC'
    },
    repair_types: {
        select: 'SELECT rt.*, u.full_name as created_by_user FROM repair_types rt LEFT JOIN users u ON u.id = rt.created_by',
        where: () => ({ conditions: [], params: [] }),
        order: 'rt.id DESC'
    },
    routine_checks: {
        select: `SELECT rc.*, t.license_plate, u.full_name as created_by_user
            FROM routine_checks rc LEFT JOIN trucks t ON rc.truck_id = t.id
            LEFT JOIN users u ON rc.created_by = u.id`,
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.date) { conditions.push('DATE(rc.created_at) = ?'); params.push(filters.date); }
            if (filters.q) { conditions.push('t.license_plate LIKE ?'); params.push(`%${filters.q}%`); }
            if (filters.truck_id) { conditions.push('rc.truck_id = ?'); params.push(filters.truck_id); }
            return { conditions, params };
        },
        order: 'rc.id DESC'
    },
    calculate_round: {
        select: `SELECT u.id as driver_id, u.full_name, u.username, DATE(tr.date) as date,
            COUNT(DISTINCT tr.round) AS round_count, t.round_cost
            FROM transition_records tr JOIN users u ON u.id = tr.driver_id
            JOIN trucks t ON t.id = tr.truck_id`,
        where(filters) {
            if (!filters.date) return { conditions: [], params: [] };
            return { conditions: ['DATE(tr.date) = ?'], params: [filters.date] };
        },
        order: 'date DESC, u.id ASC',
        group: ' GROUP BY u.id, DATE(tr.date), t.round_cost'
    },
    calculate_round_range: {
        select: `SELECT u.id as driver_id, u.full_name, u.username,
            COUNT(DISTINCT DATE(tr.date), tr.round) AS round_count, t.round_cost
            FROM transition_records tr JOIN users u ON u.id = tr.driver_id
            JOIN trucks t ON t.id = tr.truck_id`,
        where(filters) {
            const conditions = [];
            const params = [];
            if (filters.start_date) { conditions.push('DATE(tr.date) >= ?'); params.push(filters.start_date); }
            if (filters.end_date) { conditions.push('DATE(tr.date) <= ?'); params.push(filters.end_date); }
            return { conditions, params };
        },
        order: 'u.id ASC',
        group: ' GROUP BY u.id, t.round_cost'
    }
};

function getAdminPage(resource, filters = {}, page = 1, pageSize = 20) {
    return new Promise((resolve, reject) => {
        const definition = resourceQueries[resource];
        if (!definition) return reject(new Error('Unknown pagination resource'));
        const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
        const safePageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
        const { conditions, params } = definition.where(filters);
        const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
        const group = definition.group || '';
        const countQuery = `SELECT COUNT(*) AS total FROM (${definition.select}${where}${group}) counted_rows`;
        const dataQuery = `${definition.select}${where}${group} ORDER BY ${definition.order} LIMIT ? OFFSET ?`;
        db.query(countQuery, params, (countError, countRows) => {
            if (countError) return reject(countError);
            db.query(dataQuery, [...params, safePageSize, (safePage - 1) * safePageSize], (dataError, rows) => {
                if (dataError) return reject(dataError);
                const total = Number(countRows[0]?.total || 0);
                resolve({ rows, page: safePage, pageSize: safePageSize, total, totalPages: Math.ceil(total / safePageSize) });
            });
        });
    });
}

module.exports = { getAdminPage };
