const DBError = {
  status: 'error',
  statusCode: 500,
  message: 'Database Error'
};

export function findPlayer(req, res) {
  let search = req.params.search;

  let query = '';
  let params = [];

  if (search.length === 17 && parseInt(search, 0)) {
    query = "SELECT * FROM players WHERE pid = ?";
    params = [ search ];
  } else {
    search = `%${search}%`;
    query = "SELECT * FROM players WHERE name LIKE ? OR aliases LIKE '%?%'";
    params = [ search, search ];
  }

  global.pool.getConnection()
    .then(conn => {

      conn.query(`${query}`, params)
      .then(results => {
        conn.release();

        if (results.length < 1) {
          return res.status(404).send({
            status: 'error',
            statusCode: 404,
            message: `No Players Found`
          });
        }

        res.status(200).send({
          status: 'success',
          statusCode: 200,
          data: results,
        });
      })
      .catch(err => {
        conn.release();
        return res.status(500).send(DBError);
      });

    });
}
