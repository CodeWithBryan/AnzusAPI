import { verifyJWTToken } from './jwt.mjs'

export function middleware (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({
      status: 'unauthorized',
      statusCode: 401,
      message: `Invalid Authentication Token`
    });
  }

  const authToken = req.headers.authorization.replace('Bearer ', '');

  verifyJWTToken(authToken)
    .catch(() => {
      return res.status(401).send({
        status: 'unauthorized',
        statusCode: 401,
        message: `Invalid Authentication Token`
      });
    })
    .then((token) => {

      if (!token || !token.data || !token.data.username || !token.exp) {
        return res.status(401).send({
          status: 'unauthorized',
          statusCode: 401,
          message: `Invalid Authentication Token`
        });
      }

      if (token.exp - (Date.now() / 1000 | 0) < 1) {
        return res.status(401).send({
          status: 'unauthorized',
          statusCode: 401,
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
                return res.status(401).send({
                  status: 'unauthorized',
                  statusCode: 401,
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
