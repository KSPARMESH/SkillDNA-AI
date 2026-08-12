import { app } from './app';
import { config } from './config';

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(
    `🚀 SkillDNA AI Backend REST API server running on port ${config.port} (${config.env})`,
  );
  console.log(`🔗 API Base Endpoint: http://localhost:${config.port}${config.apiPrefix}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
