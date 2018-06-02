const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(
    process.env.TEST_DATABASE || './database.sqlite');

const getOne = (table, id, callback, res) => {
    const query = 'SELECT * FROM ' + table + ' WHERE id = $id';

    db.get(query, {$id: id}, function(error, row) {
        if(error && res) {
            return res.status(500).send(`ERROR: No ${table} found with ` +
                                        `id, ${id}: ${error}`);
        }
        return callback(row);
    });
};

const getAll = (table, where, callback, res) => {
    where = ! where ? '' : ` WHERE ${where}`;
    const sql = `SELECT * FROM ${table}${where}`;
    db.all(sql, (error, rows) => {
        if( error ) {
            return res.status(500)
                .send(`ERROR: Failed to get ${table}: ${error}`);
        }
        return callback(rows, error);
    });
};

const tableColumns = {
    Employee: ['name', 'position', 'wage', 'is_current_employee'],
    Timesheet: ['hours', 'rate', 'date', 'employee_id']
};

const insertNew = (table, item, res) => {
    const columns = tableColumns[table].join(', ');
    const values = tableColumns[table].map(c => '$' + c).join(', ');
    const insertSQL = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

    db.run(insertSQL, item, function(error) {
        if(error) {
            return res.status(500)
                .send(`ERROR: Failed to insert new ${table}: ${error}`);
        }
        getOne(table, this.lastID, newItem => {
            const result = {};
            result[table.toLowerCase()] = newItem;
            return res.status(201).send(result);
        }, res);
    });
};

const updateItem = (table, item, res, columns) => {
    columns = columns ? columns : tableColumns[table];
    const items = columns.map(c => `${c} = $${c}`).join(', ');
    const updateSQL = `UPDATE ${table} set ${items} WHERE id = $id`;

    db.run(updateSQL, item, error => {
        if(error) {
            return res.status(500).send(`ERROR: Failed to update ${table} ` +
                                        `with ID, ${item.$id}: ${error}`);
        }
        getOne(table, item.$id, updatedItem => {
            const result = {};
            result[table.toLowerCase()] = updatedItem;
            return res.status(200).send(result);
        });
    });
};

const deleteItem = (table, id, res) => {
    const deleteSQL = `DELETE FROM ${table} WHERE id = $id`;

    if( table === 'Employee' ) {
        updateItem('Employee', {$id: id, $is_current_employee: 0}, res,
                   ['is_current_employee']);
        return;
    }
    
    db.run(deleteSQL, {$id: id}, function(error) {
        if(error) {
            return res.status(500)
                .send(`ERROR: Failed to delete ${table}: ${error}`);
        }
        return res.status(204).send(`${table} with ID, ${id}, deleted`);
    });
};

module.exports = {getOne, getAll, insertNew, updateItem, deleteItem};
