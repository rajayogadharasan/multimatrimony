import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Fetch all plans
export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: 'asc' }
    });
    
    // Prisma returns Decimal for price, convert to Number for frontend
    const serializedPlans = plans.map(p => ({
      ...p,
      price: p.price.toNumber()
    }));
    
    return res.json(serializedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new plan
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, price, durationMonths, contactsCount, features, isActive } = req.body;
    
    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price,
        durationMonths,
        contactsCount,
        features,
        isActive
      }
    });
    
    return res.status(201).json({ ...plan, price: plan.price.toNumber() });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an existing plan
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, durationMonths, contactsCount, features, isActive } = req.body;
    
    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name,
        price,
        durationMonths,
        contactsCount,
        features,
        isActive
      }
    });
    
    return res.json({ ...plan, price: plan.price.toNumber() });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a plan
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Cannot delete if there are active subscriptions
    const activeSubscriptions = await prisma.userSubscription.count({
      where: { planId: id }
    });
    
    if (activeSubscriptions > 0) {
      return res.status(400).json({ error: 'Cannot delete plan because it has active subscriptions.' });
    }
    
    await prisma.membershipPlan.delete({ where: { id } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch payment history
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const serializedTransactions = transactions.map(t => ({
      id: t.id,
      userId: t.user.id,
      userName: t.user.email, // In a real app you might use UserProfile name
      planName: t.plan.name,
      amount: t.amount.toNumber(),
      date: t.createdAt.toLocaleDateString(),
      status: t.status
    }));
    
    return res.json(serializedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign a plan to a user
export const assignPlanToUser = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    
    const transactionId = `txn_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    
    // Wrap in a transaction to ensure both records are created
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          id: transactionId,
          userId,
          planId,
          amount: plan.price,
          status: 'SUCCESS'
        }
      }),
      prisma.userSubscription.create({
        data: {
          userId,
          planId,
          startDate,
          endDate,
          remainingContacts: plan.contactsCount
        }
      })
    ]);
    
    return res.json({ message: 'Plan successfully assigned to user' });
  } catch (error) {
    console.error('Error assigning plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
