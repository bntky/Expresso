const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(
    process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Employee WHERE is_current_employee = 1';
    db.all(sql, (error, rows) => {
        if( error ) {
            return res.status(500).send(`ERROR: Failed to get employees: ${error}`);
        }
        return res.status(200).send({employees: rows});
    });
});

module.exports = employeesRouter;
