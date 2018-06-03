const express = require('express');
const menusRouter = express.Router();
const {
    getOne, getAll, insertNew, updateItem, deleteItem, countMenuItemsOnMenu
} = require('./db-utils');

menusRouter.get('/', (req, res, next) => {
    getAll('Menu', '', menus => res.status(200).send({menus}),
           error =>
           res.status(500).send(`ERROR: Failed to get menus: ${error}`));
});

const isValidMenu = menu => ['title'].every(menu.hasOwnProperty.bind(menu));

const dbMenuVars = menu => { return {
    $title: menu.title,
}};

menusRouter.post('/', (req, res, next) => {
    if( ! isValidMenu(req.body.menu) ) {
        return res.status(400).send(`ERROR: Missing fields for menu`);
    }

    insertNew('Menu', dbMenuVars(req.body.menu),
              menu => res.status(201).send({menu}), 
              error => 
              res.status(500).send(
                  `ERROR: Failed to insert new menu: ${error}`));
});

menusRouter.param('menuId', (req, res, next, menuId) => {
    getOne('Menu', menuId, menu => {
        req.menu = menu;
        req.menuId = menuId;
        next();
    });
});

menusRouter.param('menuId', (req, res, next, menuId) => {
    if( ! req.menu ) {
        return res.status(404).send(`ERROR: No menu found with id: ${req.menuId}`);
    }
    next();
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.send({menu: req.menu});
});

menusRouter.put('/:menuId', (req, res, next) => {
    if( ! isValidMenu(req.body.menu) ) {
        return res.status(400).send(`ERROR: Missing fields for menu`);
    }

    let menuData = dbMenuVars(req.body.menu);
    menuData.$id = req.menuId;
    updateItem('Menu', menuData,
               menu => res.status(200).send({menu}),
               error =>
               res.status(500).send(
                   `ERROR: Failed to update menu with ID, ` +
                       `${req.menuId}: ${error}`));
});

menusRouter.delete('/:menuId', (req, res, next) => {
    countMenuItemsOnMenu(req.menuId, count => {
        if( count > 0 ) {
            return res.status(400)
                .send(`Menu, ${req.menuId}, still has ${count} menu items`);
        }
        deleteItem('Menu', req.menuId,
                   menu => res.status(204)
                   .send(`Menu with ID, ${req.menuId}, deleted`),
                   error => 
                   res.status(500).send(
                       `ERROR: Failed to delete menu: ${error}`));
    }, error => res.status(500).send(
        `ERROR: Failed to count menu items for ${req.menuId}: ${error}`));
});

module.exports = menusRouter;
