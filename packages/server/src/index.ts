import express from 'express';
import expressWs from 'express-ws';
import { RealtimeServer } from './realtime/server';
import { WebhookManager } from './webhooks/manager';
import { JobScheduler } from './jobs/scheduler';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize real-time server
const realtime = new RealtimeServer(app);

// Initialize webhooks
const webhooks = new WebhookManager();

// Initialize job scheduler
const scheduler = new JobScheduler();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket endpoint for real-time sync
app.ws('/ws', (ws, req) => {
  realtime.handleConnection(ws, req);
});

// Webhook endpoints
app.post('/webhooks/register', (req, res) => {
  const { event, url, retryPolicy } = req.body;
  webhooks.register(event, url, retryPolicy);
  res.json({ success: true });
});

app.delete('/webhooks/:id', (req, res) => {
  webhooks.unregister(req.params.id);
  res.json({ success: true });
});

app.post('/events', (req, res) => {
  const event = req.body;
  webhooks.emit(event.type, event);
  res.json({ success: true });
});

// Job endpoints
app.post('/jobs/schedule', (req, res) => {
  const { name, cron, handler } = req.body;
  scheduler.schedule(name, cron, handler);
  res.json({ success: true });
});

// Start server
const server = app.listen(port, () => {
  console.log(`VereinsKalender server listening on port ${port}`);
  scheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  scheduler.stop();
  realtime.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
