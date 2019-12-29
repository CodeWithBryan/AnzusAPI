const DBError = {
  status: 'error',
  statusCode: 500,
  message: 'Database Error'
};

export function getLogs(req, res) {
  let limit = req.query.limit ? parseInt(req.query.limit, 0) : 20;
  let offset = req.query.offset ? parseInt(req.query.offset, 0) : 0;
  let direction = req.query.direction === 'ASC' ? 'ASC' : 'DESC';

  global.pool.getConnection()
    .then(conn => {
      conn.query('SELECT COUNT(*) as total FROM player_logs')
        .then(count => {

          conn.query(`SELECT * FROM player_logs ORDER BY time ${direction} LIMIT ? OFFSET ?`, [ limit, offset ])
          .then(results => {
            conn.end();

            if (results.length < 1) {
              return res.status(404).send({
                status: 'error',
                statusCode: 404,
                message: `No Logs`
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
