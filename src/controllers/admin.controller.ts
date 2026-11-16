import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count({
      where: { role: 'USER' },
    });

    // 2. Premium Members
    const now = new Date();
    const premiumMembers = await prisma.userSubscription.count({
      where: {
        endDate: { gte: now },
      },
    });

    // 3. Pending Verifications
    const pendingVerifications = await prisma.user.count({
      where: {
        role: 'USER',
        status: 'PENDING',
      },
    });

    // 4. Total Revenue
    const successfulTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalRevenue = successfulTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    // 5. Recent Registrations
    const recentRegistrations = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
    });

    const formattedRecentRegistrations = recentRegistrations.map((user) => ({
      id: user.registrationId || user.id.substring(0, 8).toUpperCase(),
      name: user.profile 
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : 'Unknown User',
      date: user.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: user.status === 'APPROVED' ? 'Verified' : 'Pending',
    }));

    res.status(200).json({
      totalUsers,
      premiumMembers,
      pendingVerifications,
      totalRevenue,
      recentRegistrations: formattedRecentRegistrations,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
