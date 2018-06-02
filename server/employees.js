const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const timesheetsRouter = require('./timesheets');

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

    const insertSQL = 'INSERT INTO Employee ' +
          '(name, position, wage, is_current_employee) VALUES ' +
          '($name, $position, $wage, $is_current_employee)';
    const newEmpSQL = 'SELECT * FROM Employee WHERE id = $id';
    db.run(insertSQL, dbEmplVars(req.body.employee), function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to insert new Employee: ${error}`);
        }
        db.get(newEmpSQL, {$id: this.lastID}, (error, row) => {
            if(error) {
                return res.status(500).send(`ERROR: Failed to find newly inserted Employee: ${error}`);
            }
            return res.status(201).send({employee: row});
        });
    });
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    const emplSQL = 'SELECT * FROM Employee WHERE id = $id';
    db.get(emplSQL, {$id: employeeId}, (error, row) => {
        req.employee = row;
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

    const updateSQL = 'UPDATE Employee set ' +
          'name = $name, ' +
          'position = $position, ' +
          'wage = $wage, ' +
          'is_current_employee = $is_current_employee ' +
          'WHERE id = $id';
    const newEmpSQL = 'SELECT * FROM Employee WHERE id = $id';
    let vars = dbEmplVars(req.body.employee);
    vars.$id = req.employeeId;
    
    db.run(updateSQL, vars, function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to insert new Employee: ${error}`);
        }
        db.get(newEmpSQL, {$id: req.employeeId}, (error, row) => {
            if(error) {
                return res.status(500).send(`ERROR: Failed to find newly inserted Employee: ${error}`);
            }
            return res.status(200).send({employee: row});
        });
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const updateSQL = 'UPDATE Employee set ' +
          'is_current_employee = 0 ' +
          'WHERE id = $id';
    const newEmpSQL = 'SELECT * FROM Employee WHERE id = $id';
    
    db.run(updateSQL, {$id: req.employeeId}, function(error) {
        if(error) {
            return res.status(500).send(`ERROR: Failed to insert new Employee: ${error}`);
        }
        db.get(newEmpSQL, {$id: req.employeeId}, (error, row) => {
            if(error) {
                return res.status(500).send(`ERROR: Failed to find newly inserted Employee: ${error}`);
            }
            return res.status(200).send({employee: row});
        });
    });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

module.exports = employeesRouter;
