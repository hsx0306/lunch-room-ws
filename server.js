const express = require('express');
const fs = require('fs');
const WebSocket = require('ws');
const app = express();
app.use(express.static(__dirname));

function ensureFileExists() {
  const filePath = 'cnt.txt';
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 파일이 없으면 생성
      fs.writeFileSync(filePath, '0', { flag: 'wx' }, (err) => {
        if (err) {
          console.error('Error creating cnt.txt:', err);
        }
      });
    }
  });
}

ensureFileExists();

app.post('/increment', (req, res) => {
  fs.readFile('cnt.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading cnt.txt');
      return;
    }

    const count = Number(data) || 0;
    const incremented = count + 1;

    fs.writeFile('cnt.txt', incremented.toString(), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing cnt.txt');
        return;
      }

      res.status(200).send('Counter incremented');
    });
  });
});

app.post('/decrement', (req, res) => {
    fs.readFile('cnt.txt', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error reading cnt.txt');
        return;
      }
  
      const count = Number(data) || 0;
      const decremented = count - 1;
  
      fs.writeFile('cnt.txt', decremented.toString(), (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error writing cnt.txt');
          return;
        }
  
        res.status(200).send('Counter decremented');
      });
    });
});  

// app.get('/get-counter', (req, res) => {
//     fs.readFile('cnt.txt', 'utf8', (err, data) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send('Error reading cnt.txt');
//         return;
//       }
  
//       res.status(200).send(data);
//     });
// }); // 하단의 소켓코드로 대체함.
  

const socket = new WebSocket.Server({ 
  port:1080
});

fs.watch("cnt.txt", (eventType, filename) => {

  if (eventType == 'change') {
    fs.readFile('cnt.txt', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
  
      console.log(`cnt.txt changed: ${data}`);

      socket.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });
  }

});

socket.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
  });
  fs.readFile('cnt.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    ws.send(data);
  });
  
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
});
