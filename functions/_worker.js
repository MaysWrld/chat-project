// ===========================================
// 1. Durable Object 类定义 (ChatRoom)
// ===========================================
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env; // 包含 KV 绑定
    this.sessions = [];
  }

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

    socket.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== socket);
    });
  }
}

// ===========================================
// 2. Worker 入口逻辑 (新的 fetch 函数)
// ===========================================
export default {
    async fetch(request, env, ctx) {
        // 🚨 关键：Worker 直接检查 WebSocket 升级请求，忽略路径检查
        if (request.headers.get("Upgrade") === "websocket") {
            let id = env.CHAT_ROOM.idFromName("global-chat-room-instance");
            let stub = env.CHAT_ROOM.get(id);

            // 转发请求给 Durable Object
            return stub.fetch(new Request("http://do/websocket", request));
        }
        
        // 任何非 WebSocket 请求都返回 404
        return new Response("Not Found (Use the Pages URL for the site)", { status: 404 });
    }
};

// ⚠️ 注意：没有多余的 export { ChatRoom } 语句
