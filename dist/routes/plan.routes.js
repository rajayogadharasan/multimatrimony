"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plan_controller_1 = require("../controllers/plan.controller");
const router = (0, express_1.Router)();
// Transactions
router.get('/transactions', plan_controller_1.getTransactions);
// Assign Plan
router.post('/assign', plan_controller_1.assignPlanToUser);
// CRUD
router.get('/', plan_controller_1.getAllPlans);
router.post('/', plan_controller_1.createPlan);
router.put('/:id', plan_controller_1.updatePlan);
router.delete('/:id', plan_controller_1.deletePlan);
exports.default = router;
