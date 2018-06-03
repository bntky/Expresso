const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const {
    getOne, getAll, insertNew, updateItem, deleteItem
} = require('./db-utils');

timesheetsRouter.get('/', (req, res, next) => {
    const where = `employee_id = ${req.employeeId}`;
    const errMsg = `ERROR: Failed to get timesheets`;
    getAll('Timesheet', where,
           timesheets => res.status(200).send({timesheets}),
           error => res.status(500).send(`${errMsg}: ${error}`));
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

    const errMsg = `ERROR: Failed to insert new timesheet`;
    const timesheetData = dbTimesheetVars(req.body.timesheet);
    timesheetData.$employee_id = req.employeeId;
    insertNew('Timesheet', timesheetData,
              timesheet => res.status(201).send({timesheet}), 
              error => res.status(500).send(`${errMsg}: ${error}`));
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
        const errMsg = `ERROR: No timesheet found with id`;
        return res.status(404).send(`${errMsg}: ${req.timesheetId}`);
    }
    next();
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    if( ! isValidTimesheet(req.body.timesheet) ) {
        return res.status(400).send(`ERROR: Missing fields for timesheet`);
    }

    const errMsg = `ERROR: Failed to update timesheet with ID, ` +
          `${req.timesheetId}`;
    let timesheetData = dbTimesheetVars(req.body.timesheet);
    timesheetData.$id = req.timesheetId;
    timesheetData.$employee_id = req.employeeId;
    updateItem('Timesheet', timesheetData,
               timesheet => res.status(200).send({timesheet}),
               error => res.status(500).send(`${errMsg}: ${error}`));
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const errMsg = `ERROR: Failed to delete timesheet`;
    const deletedMsg = `Timesheet with ID, ${req.timesheetId}, deleted`;
    deleteItem('Timesheet', req.timesheetId,
               () => res.status(204).send(`${deletedMsg}`),
               error => res.status(500).send(`${errMsg}: ${error}`));
});

module.exports = timesheetsRouter;
