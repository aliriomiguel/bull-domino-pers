// Vercel routes /api/* requests (including the WebSocket upgrade at /api/ws)
// to this Function. The exported HTTP server is handled by Vercel's Node.js runtime.
import server from '../server.ts';

export default server;
