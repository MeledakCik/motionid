import type { Metadata } from 'next';
import McpConnector from '@/components/admin/McpConnector';

export const metadata: Metadata = {
  title: 'MCP Connector — Training MotionID',
  description: 'Hubungkan Claude, Cursor, VS Code, atau OpenCode ke bank training MotionID.',
  robots: { index: false, follow: false },
};

export default function AdminMcpPage() {
  return <McpConnector />;
}
