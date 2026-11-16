"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getDashboardMetrics = async (req, res) => {
    try {
        // 1. Total Users
        const totalUsers = (await prisma_1.default.orm.public.User
            .where({ role: 'USER' })
            .aggregate((a) => ({ total: a.count() }))).total;
        // 2. Premium Members
        const now = new Date();
        const premiumMembers = (await prisma_1.default.orm.public.UserSubscription
            .where((s) => s.endDate.gte(now))
            .aggregate((a) => ({ total: a.count() }))).total;
        // 3. Pending Verifications
        const pendingVerifications = (await prisma_1.default.orm.public.User
            .where({ role: 'USER', status: 'PENDING' })
            .aggregate((a) => ({ total: a.count() }))).total;
        // 4. Total Revenue
        const successfulTransactions = await prisma_1.default.orm.public.Transaction
            .where({ status: 'SUCCESS' })
            .select('amount')
            .all();
        const totalRevenue = successfulTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        // 5. Recent Registrations
        const recentRegistrations = await prisma_1.default.orm.public.User
            .where({ role: 'USER' })
            .include('profile', (p) => p.select('firstName', 'lastName'))
            .orderBy((u) => u.createdAt.desc())
            .limit(20)
            .all();
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
    }
    catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
