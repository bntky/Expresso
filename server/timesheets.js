const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(
    process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
    db.all(sql, {$employeeId: req.employeeId}, (error, rows) => {
        if( error ) {
            return res.status(500).send(`ERROR: Failed to get Timesheets: ${error}`);
        }
        return res.status(200).send({timesheets: rows});
    });
});

const isValidTimesheet = timesheet => ['hours', 'rate', 'date']
      .every(timesheet.hasOwnProperty.bind(timesheet));

const dbTimesheetVars = timesheet => { return {
    $hours: timesheet.hours,
    $rate: timesheet.rate,
    $date: timesheet.date
}};

timesheetsRouter.post('/', (req, res, next) => {
    if( ! isValidTimesheet(req.body.timesheet) ) {
        return res.status(400).send(`ERROR: Missing fields for timesheet`);
    }

    const insertSQL = 'INSERT INTO Timesheet ' +
          '(hours, rate, date, employee_id) VALUES ' +
          '($hours, $rate, $date, $employeeId)';
    const newTimesheetSQL = 'SELECT * FROM Timesheet WHERE id = $id';
    const vars = dbTimesheetVars(req.body.timesheet);
    vars.$employeeId = req.employeeId;
    
    db.run(insertSQL, vars, function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to insert new Timesheet: ${error}`);
        }
        db.get(newTimesheetSQL, {$id: this.lastID}, (error, row) => {
            if(error) {
                return res.status(500).send(`ERROR: Failed to find newly inserted Timesheet: ${error}`);
            }
            return res.status(201).send({timesheet: row});
        });
    });
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    const timesheetSQL = 'SELECT * FROM Timesheet WHERE id = $id';
    db.get(timesheetSQL, {$id: timesheetId}, (error, row) => {
        req.timesheet = row;
        req.timesheetId = timesheetId;
        next();
    });
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    if( ! req.timesheet ) {
        return res.status(404).send(`ERROR: No timesheet found with id: ${req.timesheetId}`);
    }
    next();
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    if( ! isValidTimesheet(req.body.timesheet) ) {
        return res.status(400).send(`ERROR: Missing fields for timesheet`);
    }

    const updateSQL = 'UPDATE Timesheet set ' +
          'hours = $hours, ' +
          'rate = $rate, ' +
          'date = $date, ' +
          'employee_id = $employeeId ' +
          'WHERE id = $id';
    const newTimesheetSQL = 'SELECT * FROM Timesheet WHERE id = $id';
    let vars = dbTimesheetVars(req.body.timesheet);
    vars.$id = req.timesheetId;
    vars.$employeeId = req.employeeId;
    
    db.run(updateSQL, vars, function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to update timesheet: ${error}`);
        }
        db.get(newTimesheetSQL, {$id: req.timesheetId}, (error, row) => {
            if(error) {
                return res.status(500).send(`ERROR: Failed to find newly updated timesheet: ${error}`);
            }
            return res.status(200).send({timesheet: row});
        });
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const deleteSQL = 'DELETE FROM Timesheet WHERE id = $id';
    
    db.run(deleteSQL, {$id: req.timesheetId}, function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to delete Timesheet: ${error}`);
        }
        return res.status(204).send(`Timesheet with ID, ${req.timesheetId}, deleted`);
    });
});

module.exports = timesheetsRouter;
