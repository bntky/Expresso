const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets');
const {
    getOne, getAll, insertNew, updateItem, deleteItem
} = require('./db-utils');

employeesRouter.get('/', (req, res, next) => {
    const where = 'is_current_employee = 1';
    getAll('Employee', where,
           employees => res.status(200).send({employees}),
           error =>
           res.status(500).send(`ERROR: Failed to get employees: ${error}`));
});

const isValidEmployee = employee => ['name', 'position', 'wage']
      .every(employee.hasOwnProperty.bind(employee));

const dbEmplVars = employee => { return {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $is_current_employee: employee.is_current_employee === 0 ? 0 : 1
}};

employeesRouter.post('/', (req, res, next) => {
    if( ! isValidEmployee(req.body.employee) ) {
        return res.status(400).send(`ERROR: Missing fields for employee`);
    }

    insertNew('Employee', dbEmplVars(req.body.employee),
              employee => res.status(201).send({employee}), 
              error =>
              res.status(500).send(
                  `ERROR: Failed to insert new employee: ${error}`));
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    getOne('Employee', employeeId, employee => {
        req.employee = employee;
        req.employeeId = employeeId;
        next();
    });
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    if( ! req.employee ) {
        return res.status(404).send(`ERROR: No employee found with id: ${req.employeeId}`);
    }
    next();
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.send({employee: req.employee});
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    if( ! isValidEmployee(req.body.employee) ) {
        return res.status(400).send(`ERROR: Missing fields for employee`);
    }

    let employeeData = dbEmplVars(req.body.employee);
    employeeData.$id = req.employeeId;
    updateItem('Employee', employeeData,
               employee => res.status(200).send({employee}),
               error =>
               res.status(500).send(
                   `ERROR: Failed to update employee with ID, ` +
                       `${req.employeeId}: ${error}`));
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    deleteItem('Employee', req.employeeId,
               employee => res.status(200).send({employee}),
               error =>
               res.status(500).send(
                   `ERROR: Failed to delete employee: ${error}`));
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

module.exports = employeesRouter;
