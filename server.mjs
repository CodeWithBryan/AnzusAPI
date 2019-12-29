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
import { initWS } from './websocket/ws.mjs';

const config = JSON.parse(fs.readFileSync('config.json'));
const APIPort = config.port;
global.avgResponseTime = [];


/****************
**   Config    **
****************/


const app = express();

// Database
global.pool = mariadb.createPool({
  ...config.database,
  connectionLimit: 10,
  idleTimeout: 1000,
  acquireTimeout: 1000,
});

initWS();

app.use(function(req, res, next) {
  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

    if (req.path !== "/" && req.path !== "/api/info") {
      global.avgResponseTime.push(elapsedTimeInMs);
      if (global.avgResponseTime.length > 99) {
        global.avgResponseTime.shift();
      }
    }
  });

  next();
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
  res.status(200).send('API Online');
});

app.get("/api/info", function(req, res) {
  const arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length
  res.status(200).json({
    active: global.pool.activeConnections(),
    total: global.pool.totalConnections(),
    idle: global.pool.idleConnections(),
    taskQueueSize: global.pool.taskQueueSize(),
    avgResponseTime: arrAvg(avgResponseTime),
  });
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
