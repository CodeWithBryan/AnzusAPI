import { verifyJWTToken } from './jwt.mjs'

export function middleware (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(400).send({
      status: 'unauthorized',
      message: `Invalid Authentication Token`
    });
  }

  const authToken = req.headers.authorization.replace('Bearer ', '');

  verifyJWTToken(authToken)
    .catch(() => {
      return res.status(400).send({
        status: 'unauthorized',
        message: `Invalid Authentication Token`
      });
    })
    .then((token) => {
      let conn;

      if(token.exp - (Date.now() / 1000 | 0) < 1) {
        return res.status(400).send({
          status: 'unauthorized',
          message: `Invalid Authentication Token`
        });
      }

      global.pool.getConnection()
        .then(conn => {
          conn.query('SELECT * FROM admins WHERE username = ?', token.data.username)
            .then(results => {
              // Close our connection
              conn.release();

              // Return our results
              if(results.length < 1) {
                return res.status(400).send({
                  status: 'unauthorized',
                  message: `Invalid Authentication Token`
                });
              }

              next();
            })
            .catch(err => {
              conn.release();
              return res.status(500).send(err);
            });
        });
    });
}
