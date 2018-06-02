const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const {
    getOne, getAll, insertNew, updateItem, deleteItem
} = require('./db-utils');

timesheetsRouter.get('/', (req, res, next) => {
    const where = `employee_id = ${req.employeeId}`;
    getAll('Timesheet', where, timesheets => {
        return res.status(200).send({timesheets});
    }, res);
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

    const vars = dbTimesheetVars(req.body.timesheet);
    vars.$employee_id = req.employeeId;
    insertNew('Timesheet', vars, res);
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    getOne('Timesheet', timesheetId, timesheet => {
        req.timesheet = timesheet;
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

    let timesheet = dbTimesheetVars(req.body.timesheet);
    timesheet.$id = req.timesheetId;
    timesheet.$employee_id = req.employeeId;
    updateItem('Timesheet', timesheet, res);
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    deleteItem('Timesheet', req.timesheetId, res);
});

module.exports = timesheetsRouter;
