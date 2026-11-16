import { Router } from 'express';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getTransactions,
  assignPlanToUser
} from '../controllers/plan.controller';

const router = Router();

// Transactions
router.get('/transactions', getTransactions);

// Assign Plan
router.post('/assign', assignPlanToUser);

// CRUD
router.get('/', getAllPlans);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
