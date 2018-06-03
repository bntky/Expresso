const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const {
    getOne, getAll, insertNew, updateItem, deleteItem
} = require('./db-utils');

menuItemsRouter.get('/', (req, res, next) => {
    const errMsg = `ERROR: Failed to get menu items`;
    const where = `menu_id = ${req.menuId}`;
    getAll('MenuItem', where,
           menuItems => res.status(200).send({menuItems}),
           error => res.status(500).send(`${errMsg}: ${error}`));
});

const isValidMenuItem = menuItem =>
      ['name', 'description', 'inventory', 'price']
      .every(menuItem.hasOwnProperty.bind(menuItem));

const dbMenuItemVars = menuItem => { return {
    $name: menuItem.name,
    $description: menuItem.description,
    $inventory: menuItem.inventory,
    $price: menuItem.price
}};

menuItemsRouter.post('/', (req, res, next) => {
    if( ! isValidMenuItem(req.body.menuItem) ) {
        return res.status(400).send(`ERROR: Missing fields for menu item`);
    }

    const errMsg = `ERROR: Failed to insert new menu item`;
    const menuItemData = dbMenuItemVars(req.body.menuItem);
    menuItemData.$menu_id = req.menuId;
    insertNew('MenuItem', menuItemData,
              menuItem => res.status(201).send({menuItem}), 
              error => res.status(500).send(`${errMsg}: ${error}`));
});

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    getOne('MenuItem', menuItemId, menuItem => {
        req.menuItem = menuItem;
        req.menuItemId = menuItemId;
        next();
    });
});

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    if( ! req.menuItem ) {
        const errMsg = `ERROR: No menu item found with id: ${req.menuItemId}`;
        return res.status(404).send(errMsg);
    }
    next();
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    if( ! isValidMenuItem(req.body.menuItem) ) {
        return res.status(400).send(`ERROR: Missing fields for menu item`);
    }

    let menuItemData = dbMenuItemVars(req.body.menuItem);
    const errMsg = `ERROR: Failed to update menu item with ID, ` +
          `${req.menuItemId}`;
    menuItemData.$id = req.menuItemId;
    menuItemData.$menu_id = req.menuId;
    updateItem('MenuItem', menuItemData,
               menuItem => res.status(200).send({menuItem}),
               error => res.status(500).send(`${errMsg}: ${error}`));
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const errMsg = `ERROR: Failed to delete menu item`;
    deleteItem('MenuItem', req.menuItemId, () =>
               res.status(204)
               .send(`Menu item with ID, ${req.menuItemId}, deleted`),
               error => res.status(500).send(`${errMsg}: ${error}`));
});

module.exports = menuItemsRouter;
