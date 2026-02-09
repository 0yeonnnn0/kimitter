import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
