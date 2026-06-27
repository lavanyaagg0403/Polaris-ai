import express from 'express';
import cors from 'cors';
import { initDb } from './database/db.js';
import apiRouter from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API Route
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Polaris OS Backend is running smoothly.' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`🌌 Polaris OS Backend starting up...`);
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database and start server:', error);
    process.exit(1);
  }
};

startServer();
