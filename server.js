const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const serveStatic = require('serve-static');
const sqlite3 = require('sqlite3');

module.exports = app;

const PORT = process.env.PORT || 4000;

// Middleware tools
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(serveStatic('.'));

// routes
const apiRouter = require('./server/api');
app.use('/api', apiRouter);

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
