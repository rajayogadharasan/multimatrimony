import express from 'express';
import { getDashboardMetrics } from '../controllers/admin.controller';

const router = express.Router();

router.get('/dashboard', getDashboardMetrics);

export default router;
