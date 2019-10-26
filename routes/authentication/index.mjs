import crypto from 'crypto';
import { createJWToken } from '../../middleware/jwt.mjs'

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function register(req, res) {
  const { username, password, secret } = req.body;

  if (!secret || secret !== 'supersecretkey') {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'Not Allowed'
    });
  }

  if (!username || !password) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'All Fields Required'
    });
  }

  global.pool.getConnection()
    .then(conn => {
      conn.query('SELECT * FROM admins WHERE username = ?', [ username ])
        .then(results => {
          if(results.length >= 1) {
            conn.release();
            return res.status(500).send({
              status: 'error',
              statusCode: 500,
              message: 'Username already registered'
            });
          }

          conn.query(
            'INSERT INTO admins (username, Password) VALUES (?, ?)',
            [ username, hashPassword(password) ]
          ).then(results => {
              conn.release();
              res.status(200).send({
                status: 'success',
                statusCode: 200,
                data: {
                  message: 'Account Successfully Created',
                }
              });
            })
            .catch(err => {
              conn.release();
              return res.status(500).send(err);
            });

        })
        .catch(err => {
          conn.release();
          return res.status(500).send(err);
        });
      });
}

export function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(500).send({
      status: 'error',
      statusCode: 500,
      message: 'All Fields Required'
    });
  }

  global.pool.getConnection()
    .then(conn => {
      conn.query('SELECT * FROM admins WHERE username = ? AND password = ?', [ username, hashPassword(password) ])
        .then(results => {
          conn.release();

          if(results.length < 1) {
            return res.status(400).send({
              status: 'unauthorized',
              statusCode: 400,
              message: `Invalid Authentication Token`
            });
          }

          // Authenticated Successfully, send token
          res.status(200).send({
            status: 'success',
            statusCode: 200,
            data: {
              token: createJWToken({ sessionData: { username }}),
            }
          });
        })
        .catch(err => {
          conn.release();
          // TODO: Don't send raw SQL Errors
          return res.status(500).send(err);
        });
    });
}
