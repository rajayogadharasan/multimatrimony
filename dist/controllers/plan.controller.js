"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignPlanToUser = exports.getTransactions = exports.deletePlan = exports.updatePlan = exports.createPlan = exports.getAllPlans = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
// Fetch all plans
const getAllPlans = async (req, res) => {
    try {
        const plans = await prisma_1.default.orm.public.MembershipPlan
            .orderBy((p) => p.price.asc())
            .all();
        // Prisma returns decimal text for price, convert to Number for frontend
        const serializedPlans = plans.map(p => ({
            ...p,
            price: Number(p.price)
        }));
        return res.json(serializedPlans);
    }
    catch (error) {
        console.error('Error fetching plans:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllPlans = getAllPlans;
// Create a new plan
const createPlan = async (req, res) => {
    try {
        const { name, price, durationMonths, contactsCount, features, isActive } = req.body;
        const plan = await prisma_1.default.orm.public.MembershipPlan.create({
            name,
            price,
            durationMonths,
            contactsCount,
            features,
            isActive
        });
        return res.status(201).json({ ...plan, price: Number(plan.price) });
    }
    catch (error) {
        console.error('Error creating plan:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createPlan = createPlan;
// Update an existing plan
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, durationMonths, contactsCount, features, isActive } = req.body;
        const plan = await prisma_1.default.orm.public.MembershipPlan
            .where({ id: id })
            .update({
            name,
            price,
            durationMonths,
            contactsCount,
            features,
            isActive
        });
        if (!plan)
            throw new Error('Plan not found');
        return res.json({ ...plan, price: Number(plan.price) });
    }
    catch (error) {
        console.error('Error updating plan:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updatePlan = updatePlan;
// Delete a plan
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        // Cannot delete if there are active subscriptions
        const activeSubscriptions = (await prisma_1.default.orm.public.UserSubscription
            .where({ planId: id })
            .aggregate((a) => ({ total: a.count() }))).total;
        if (activeSubscriptions > 0) {
            return res.status(400).json({ error: 'Cannot delete plan because it has active subscriptions.' });
        }
        await prisma_1.default.orm.public.MembershipPlan.where({ id: id }).delete();
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting plan:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deletePlan = deletePlan;
// Fetch payment history
const getTransactions = async (req, res) => {
    try {
        const transactions = await prisma_1.default.orm.public.Transaction
            .include('user')
            .include('plan')
            .orderBy((t) => t.createdAt.desc())
            .all();
        const serializedTransactions = transactions.map(t => ({
            id: t.id,
            userId: t.user.id,
            userName: t.user.email, // In a real app you might use UserProfile name
            planName: t.plan.name,
            amount: Number(t.amount),
            date: t.createdAt.toLocaleDateString(),
            status: t.status
        }));
        return res.json(serializedTransactions);
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTransactions = getTransactions;
// Assign a plan to a user
const assignPlanToUser = async (req, res) => {
    try {
        const { userId, planId } = req.body;
        const user = await prisma_1.default.orm.public.User.first({ id: userId });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const plan = await prisma_1.default.orm.public.MembershipPlan.first({ id: planId });
        if (!plan)
            return res.status(404).json({ error: 'Plan not found' });
        const transactionId = `txn_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}`;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.durationMonths);
        // Wrap in a transaction to ensure both records are created
        await prisma_1.default.transaction(async (tx) => {
            await tx.orm.public.Transaction.create({
                id: transactionId,
                userId,
                planId,
                amount: plan.price,
                status: 'SUCCESS'
            });
            await tx.orm.public.UserSubscription.create({
                userId,
                planId,
                startDate,
                endDate,
                remainingContacts: plan.contactsCount
            });
        });
        return res.json({ message: 'Plan successfully assigned to user' });
    }
    catch (error) {
        console.error('Error assigning plan:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignPlanToUser = assignPlanToUser;
