import ws from 'ws';

export function initWS() {

  const wss = new ws.Server({ port: 8574 });

  wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(message) {
      console.log('received: %s', message);

      ws.send('something');
    });
  });

}
