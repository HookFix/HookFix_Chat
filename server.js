const express = require('express');
const { randomUUID } = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./chat.db');
const wss = new WebSocket.Server({ port: 3001 });

// 初始化数据库
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      role TEXT CHECK(role IN ('user', 'assistant')),
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// WebSocket 消息广播
function broadcastMessage(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 获取历史消息（用户端）
app.get('/api/messages', (req, res) => {
  db.all(
    'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50',
    (err, rows) => res.json(rows.reverse())
  );
});

// 用户发送消息
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: '消息内容不能为空' });
  }

  const userMessage = {
    id: randomUUID(),
    role: 'user',
    content: message
  };

  db.run(
    'INSERT INTO messages (id, role, content) VALUES (?, ?, ?)',
    [userMessage.id, userMessage.role, userMessage.content],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      broadcastMessage(userMessage);
      res.json({ success: true });
    }
  );
});

// 管理员发送回复
app.post('/api/admin/reply', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: '回复内容不能为空' });
  }

  const adminMessage = {
    id: randomUUID(),
    role: 'assistant',
    content: content
  };

  db.run(
    'INSERT INTO messages (id, role, content) VALUES (?, ?, ?)',
    [adminMessage.id, adminMessage.role, adminMessage.content],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      broadcastMessage(adminMessage);
      res.json({ success: true });
    }
  );
});

// 流式响应接口（用于用户端接收管理员的回复）
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // 获取最新的消息时间戳
  let lastTimestamp = null;
  db.get('SELECT timestamp FROM messages WHERE role = "assistant" ORDER BY timestamp DESC LIMIT 1', (err, row) => {
    if (row) {
      lastTimestamp = row.timestamp;
    }
  });

  // 每隔一段时间检查是否有新的管理员回复
  const interval = setInterval(() => {
    db.get(
      'SELECT * FROM messages WHERE role = "assistant" AND timestamp > ? ORDER BY timestamp DESC LIMIT 1',
      [lastTimestamp],
      (err, row) => {
        if (err) {
          res.end();
          clearInterval(interval);
          return;
        }

        if (row) {
          res.write(`data: ${JSON.stringify(row)}\n\n`);
          res.end();
          clearInterval(interval);
        }
      }
    );
  }, 1000); // 每秒检查一次
});

// WebSocket 服务器
wss.on('connection', ws => {
  console.log('客户端连接成功');
  ws.on('message', message => {
    console.log('收到消息:', message);
  });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));