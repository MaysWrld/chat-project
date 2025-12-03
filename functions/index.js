// 导入根目录的 ChatRoom.js 文件
import { ChatRoom } from '../ChatRoom';

// Pages Functions 的入口，处理所有请求
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Pages Functions 自动将 /functions/index.js 映射到 /api/index
        if (url.pathname === "/api/index/websocket") {
            
            // 获取 Durable Object 实例。
            let id = env.CHAT_ROOM.idFromName("global-chat-room-instance");
            let stub = env.CHAT_ROOM.get(id);

            // 转发请求给 Durable Object
            return stub.fetch(new Request("http://do/websocket", request));
        }

        // 处理静态文件
        return env.ASSETS.fetch(request);
    }
};

// 必须导出 ChatRoom 类，以便 Pages Functions/Workers 能够识别并绑定它
export { ChatRoom };
