const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(
    process.env.TEST_DATABASE || './database.sqlite');

// Get one item from a table in the database with the given ID
// Run the callback function with the found item as it's first
// argument.  If an error occurs, run the errCallback function
// with the given error.
const getOne = (table, id, callback, errCallback) => {
    const query = 'SELECT * FROM ' + table + ' WHERE id = $id';

    db.get(query, {$id: id}, function(error, row) {
        if(error && errCallback) {
            return errCallback(error);
        }
        return callback(row);
    });
};

// Get all the items in a table in the database limited by the
// where clause given by "where".  Run the callback function
// passing the rows found as an array in the first argument.  If
// an error occurs, call errCallback with the error.
const getAll = (table, where, callback, errCallback) => {
    where = ! where ? '' : ` WHERE ${where}`;
    const sql = `SELECT * FROM ${table}${where}`;
    db.all(sql, (error, rows) => {
        if( error ) {
            return errCallback(error);
        }
        return callback(rows);
    });
};

// An object mapping the table names to their columns
const tableColumns = {
    Employee: ['name', 'position', 'wage', 'is_current_employee'],
    Timesheet: ['hours', 'rate', 'date', 'employee_id'],
    Menu: ['title'],
    MenuItem: ['name', 'description', 'inventory', 'price', 'menu_id']
};


// Insert a new item into the database for the given table.  The item
// should be an object with keys prefixed with a dollar sign ($) and
// named after the column.  The primary key should not be included.
// The callback function will be run if the insert is successful.  The
// first argument to it will be the inserted item.  If an error
// occurs, it will run the errCallback function with the error.
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

// Update an item in the database for the given table.  The item
// should be similar to the item in the insertNew function.  However,
// it must, also, include the primary key as "$id" for the item to be
// modified.  The callback function will be run if the update is
// successful.  The first argument to it will be the updated item.  If
// an error occurs, it will run the errCallback function with the
// error.  If the columns argument is given, then only update those
// columns for the item.
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

// Delete an item in the database for the given table with the given
// id.  If no error occurs, then run the callback function with no
// arguments.  If an error occurs, run the errCallback with the given
// error.
const deleteItem = (table, id, callback, errCallback) => {
    const deleteSQL = `DELETE FROM ${table} WHERE id = $id`;

    db.run(deleteSQL, {$id: id}, function(error) {
        if(error) {
            return errCallback(error);
        }
        return callback();
    });
};

// Count the number of menu items for the given menu in the
// database. If the query is successful, then run the callback
// function with the number of menu items found.  If an error occurs,
// then run the errCallback with the given error.
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
