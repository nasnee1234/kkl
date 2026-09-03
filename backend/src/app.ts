import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

export default app;
