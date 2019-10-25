const DBError = {
  status: 'error',
  statusCode: 500,
  message: 'Database Error'
};


export function getPlayer(req, res) {
  let pid = req.params.pid;

  if (pid.length !== 17) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Invalid PID'
    });
  }


  global.pool.getConnection()
    .then(conn => {
      conn.query('SELECT * FROM players WHERE pid = ?', [ pid ])
        .then(results => {
          conn.end();

          if (results.length !== 1) {
            return res.status(404).send({
              status: 'error',
              statusCode: 404,
              message: `${pid} not found`
            });
          }

          res.status(200).send({
            status: 'success',
            statusCode: 200,
            data: results[0],
          });
        })
        .catch(err => {
          conn.end();
          return res.status(500).send(DBError);
        });
    });
}

export function getPlayerLogs(req, res) {
  let pid = req.params.pid;

  if (pid.length !== 17) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Invalid PID'
    });
  }

  let limit = req.query.limit ? parseInt(req.query.limit, 0) : 20;
  let offset = req.query.offset ? parseInt(req.query.offset, 0) : 0;
  let direction = req.query.direction === 'ASC' ? 'ASC' : 'DESC';

  global.pool.getConnection()
    .then(conn => {
      conn.query('SELECT COUNT(*) as total FROM player_logs WHERE pid = ?', [ pid ])
        .then(count => {

          conn.query(`SELECT * FROM player_logs WHERE pid = ? ORDER BY time ${direction} LIMIT ? OFFSET ?`, [ pid, limit, offset ])
          .then(results => {
            conn.end();

            if (results.length < 1) {
              return res.status(404).send({
                status: 'error',
                statusCode: 404,
                message: `No Logs for ${pid}`
              });
            }

            res.status(200).send({
              status: 'success',
              statusCode: 200,
              limit,
              offset,
              total: count[0].total,
              data: results,
            });
          })
          .catch(err => {
            conn.end();
            return res.status(500).send(DBError);
          });

        })
        .catch(err => {
          conn.end();
          return res.status(500).send(DBError);
        });
    });
}

export function getPlayerMoneyHistory(req, res) {
  let pid = req.params.pid;

  if (pid.length !== 17) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Invalid PID'
    });
  }


  global.pool.getConnection()
    .then(conn => {
      conn.query(`SELECT * FROM player_logs WHERE pid=? AND action in ('cashChange','bankChange')`, [ pid ])
        .then(results => {
          conn.end();

          if (results.length < 1) {
            return res.status(404).send({
              status: 'error',
              statusCode: 404,
              message: `No money history for ${pid}`
            });
          }

          res.status(200).send({
            status: 'success',
            statusCode: 200,
            data: results,
          });
        })
        .catch(err => {
          conn.end();
          return res.status(500).send(DBError);
        });
    });
}

export function getPlayerVehicles(req, res) {
  let pid = req.params.pid;

  if (pid.length !== 17) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Invalid PID'
    });
  }

  let limit = req.query.limit ? parseInt(req.query.limit, 0) : 20;
  let offset = req.query.offset ? parseInt(req.query.offset, 0) : 0;
  let direction = req.query.direction === 'ASC' ? 'ASC' : 'DESC';

  global.pool.getConnection()
    .then(conn => {
      conn.query(`SELECT * FROM vehicles WHERE pid = ? ORDER BY id ${direction} LIMIT ? OFFSET ?`, [ pid, limit, offset ])
        .then(results => {
          conn.end();

          if (results.length < 1) {
            return res.status(404).send({
              status: 'error',
              statusCode: 404,
              message: `No vehicles for ${pid}`
            });
          }

          res.status(200).send({
            status: 'success',
            statusCode: 200,
            data: results,
          });
        })
        .catch(err => {
          conn.end();
          return res.status(500).send(DBError);
        });
    });
}

export function getPlayerNames(req, res) {
  let pids = req.query.pids;

  if (pids.length < 1) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Invalid PIDs'
    });
  }

  global.pool.getConnection()
    .then(conn => {
      conn.query(`SELECT pid, name FROM players WHERE pid in (?)`, [ pids ])
        .then(results => {
          conn.end();

          res.status(200).send({
            status: 'success',
            statusCode: 200,
            data: results,
          });
        })
        .catch(err => {
          conn.end();
          return res.status(500).send(DBError);
        });
    });
}


export default {
  getPlayer,
  getPlayerLogs,
  getPlayerMoneyHistory,
  getPlayerVehicles,
  getPlayerNames,
}
