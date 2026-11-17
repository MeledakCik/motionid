import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server';

/**
 * Entry stdio untuk MCP client lokal (Claude Desktop, Cursor, VS Code, OpenCode).
 *
 *   npm run mcp:training
 *
 * Butuh SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_ACCESS_TOKEN.
 * Untuk koneksi remote tanpa install, gunakan endpoint /api/mcp.
 */
void serveStdio(createServer);
