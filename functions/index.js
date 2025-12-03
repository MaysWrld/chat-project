// 🚨 关键修改：直接从同目录导入 ChatRoom
import { ChatRoom } from './ChatRoom';

// Pages Functions 的入口，处理所有请求
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === "/api/index/websocket") {
            
            let id = env.CHAT_ROOM.idFromName("global-chat-room-instance");
            let stub = env.CHAT_ROOM.get(id);

            return stub.fetch(new Request("http://do/websocket", request));
        }

        return env.ASSETS.fetch(request);
    }
};

// 必须导出 ChatRoom 类
export { ChatRoom };
