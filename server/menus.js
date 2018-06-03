const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menu-items');
const {
    getOne, getAll, insertNew, updateItem, deleteItem, countMenuItemsOnMenu
} = require('./db-utils');

menusRouter.get('/', (req, res, next) => {
    const errMsg = `ERROR: Failed to get menus`;
    getAll('Menu', '', menus => res.status(200).send({menus}),
           error => res.status(500).send(`${errMsg}: ${error}`));
});

const isValidMenu = menu => ['title'].every(menu.hasOwnProperty.bind(menu));

const dbMenuVars = menu => { return {
    $title: menu.title,
}};

menusRouter.post('/', (req, res, next) => {
    if( ! isValidMenu(req.body.menu) ) {
        return res.status(400).send(`ERROR: Missing fields for menu`);
    }

    const errMsg = `ERROR: Failed to insert new menu`;
    insertNew('Menu', dbMenuVars(req.body.menu),
              menu => res.status(201).send({menu}), 
              error => res.status(500).send(`${errMsg}: ${error}`));
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
        const errMsg = `ERROR: No menu found with id: ${req.menuId}`;
        return res.status(404).send(`${errMsg}`);
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

    const errMsg = `ERROR: Failed to update menu with ID, ${req.menuId}`;
    let menuData = dbMenuVars(req.body.menu);
    menuData.$id = req.menuId;
    updateItem('Menu', menuData,
               menu => res.status(200).send({menu}),
               error => res.status(500).send(`${errMsg}: ${error}`));
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const errMsg2 = `ERROR: Failed to count menu items for ${req.menuId}`;
    countMenuItemsOnMenu(req.menuId, count => {
        if( count > 0 ) {
            const errMsg = `Menu, ${req.menuId}, has ${count} menu items`;
            return res.status(400).send(`${errMsg}`);
        }
        const errMsg1 = `ERROR: Failed to delete menu`;
        const deletedMsg = `Menu with ID, ${req.menuId}, deleted`;
        deleteItem('Menu', req.menuId,
                   menu => res.status(204).send(`${deletedMsg}`),
                   error => res.status(500).send(`${errMsg1}: ${error}`));
    }, error => res.status(500).send(`${errMsg2}: ${error}`));
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

module.exports = menusRouter;
