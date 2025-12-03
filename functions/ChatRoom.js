// 注意：这个类会被 Workers 绑定，不需要 default export
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env; // 包含 KV 绑定 (env.CHAT_KV)
    this.sessions = []; // 存储所有 WebSocket 连接
  }

  // DO 的入口方法
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/websocket") {
      return new Response("Not Found", { status: 404 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleSession(socket) {
    socket.accept();
    this.sessions.push(socket);
    
    // --- 发送历史记录 ---
    const history = await this.env.CHAT_KV.list({ limit: 20, reverse: true });
    const historyDataPromises = history.keys.map(key => this.env.CHAT_KV.get(key.name));
    const historyData = await Promise.all(historyDataPromises);
    
    const initialMessage = historyData.filter(d => d).reverse().join('\n');
    if (initialMessage) {
        socket.send(`--- 历史记录 ---\n${initialMessage}`);
    }
    
    // 监听客户端消息
    socket.addEventListener('message', async (event) => {
      const message = String(event.data).trim();
      if (!message) return;

      const timestamp = new Date().toISOString();
      const timeStr = timestamp.substring(0, 19).replace('T', ' ');
      const chatEntry = `[${timeStr}] User: ${message}`;

      await this.env.CHAT_KV.put(timestamp, chatEntry);

      this.sessions.forEach(s => {
        if (s.readyState === WebSocket.READY_STATE_OPEN) {
          s.send(chatEntry);
        }
      });
    });

    // 监听连接关闭
    socket.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== socket);
    });
  }
}
