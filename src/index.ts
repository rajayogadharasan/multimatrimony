import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

import masterDataRoutes from './routes/masterData.routes';
import planRoutes from './routes/plan.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static('E:/storage/mm'));

// Routes
app.use('/api/master-data', masterDataRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Matrimony API is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
