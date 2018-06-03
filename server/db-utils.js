const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(
    process.env.TEST_DATABASE || './database.sqlite');

const getOne = (table, id, callback, errCallback) => {
    const query = 'SELECT * FROM ' + table + ' WHERE id = $id';

    db.get(query, {$id: id}, function(error, row) {
        if(error && errCallback) {
            return errCallback(error);
        }
        return callback(row);
    });
};

const getAll = (table, where, callback, errCallback) => {
    where = ! where ? '' : ` WHERE ${where}`;
    const sql = `SELECT * FROM ${table}${where}`;
    db.all(sql, (error, rows) => {
        if( error ) {
            return errCallback(error);
        }
        return callback(rows, error);
    });
};

const tableColumns = {
    Employee: ['name', 'position', 'wage', 'is_current_employee'],
    Timesheet: ['hours', 'rate', 'date', 'employee_id'],
    Menu: ['title'],
    MenuItem: ['name', 'description', 'inventory', 'price', 'menu_id']
};

const insertNew = (table, item, callback, errCallback) => {
    const columns = tableColumns[table].join(', ');
    const values = tableColumns[table].map(c => '$' + c).join(', ');
    const insertSQL = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

    db.run(insertSQL, item, function(error) {
        if(error) {
            return errCallback(error);
        }
        getOne(table, this.lastID, callback, errCallback);
    });
};

const updateItem = (table, item, callback, errCallback, columns) => {
    columns = columns ? columns : tableColumns[table];
    const items = columns.map(c => `${c} = $${c}`).join(', ');
    const updateSQL = `UPDATE ${table} set ${items} WHERE id = $id`;

    db.run(updateSQL, item, error => {
        if(error) {
            return errCallback(error);
        }
        getOne(table, item.$id, callback, errCallback);
    });
};

const deleteItem = (table, id, callback, errCallback) => {
    const deleteSQL = `DELETE FROM ${table} WHERE id = $id`;

    if( table === 'Employee' ) {
        updateItem('Employee', {$id: id, $is_current_employee: 0}, callback,
                   errCallback, ['is_current_employee']);
        return;
    }
    
    db.run(deleteSQL, {$id: id}, function(error) {
        if(error) {
            return errCallback(error);
        }
        return callback();
    });
};

const countMenuItemsOnMenu = (menuId, callback, errCallback) => {
    const menuItemsSQL = `SELECT COUNT(*) as count FROM MenuItem ` +
          `WHERE menu_id = $menuId`;

    db.get(menuItemsSQL, {$menuId: menuId}, (error, row) => {
        if(error) {
            return errCallback(error);
        }
        return callback(row.count);
    });
};

module.exports = {getOne, getAll, insertNew, updateItem, deleteItem,
                  countMenuItemsOnMenu};
