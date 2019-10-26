import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import fs from 'fs';
import mariadb from 'mariadb';
import cors from 'cors';

import { middleware } from './middleware/index.mjs';
import { login, register } from './routes/authentication/index.mjs';
import { getLogs } from './routes/logs/index.mjs';
import { getPlayer, getPlayerLogs, getNonMoneyLogs, getPlayerMoneyHistory, getPlayerVehicles, getPlayerNames } from './routes/player/index.mjs';
import { findPlayer } from './routes/search/index.mjs';

const config = JSON.parse(fs.readFileSync('config.json'));
const APIPort = config.port;


/****************
**   Config    **
****************/

const app = express();

// Database
global.pool = mariadb.createPool({
  ...config.database,
  connectionLimit: 10
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set('secret', config.secret);
app.use(morgan('dev'));

/****************
**  REST API   **
****************/

app.get("/", function(req, res) {
  res.status(200).send("API Status Online");
});

/* NO AUTHENTICATION REQUIRED */

app.post('/login', login);
app.post('/register', register);

/* AUTHENTICATION REQUIRED */

app.get("/logs", middleware, getLogs);
app.get("/player/:pid", middleware, getPlayer);
app.get("/player/:pid/logs", middleware, getPlayerLogs);
app.get("/player/:pid/logs/nomoney", middleware, getNonMoneyLogs)
app.get("/player/:pid/money/history", middleware, getPlayerMoneyHistory);
app.get("/player/:pid/vehicles", middleware, getPlayerVehicles);
app.get("/playernames", middleware, getPlayerNames);
app.get("/search/player/:search", middleware, findPlayer);

app.listen(APIPort, () => {
  console.log(`Listening on PORT ${APIPort}`);
});
