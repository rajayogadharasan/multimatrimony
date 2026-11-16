"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getNotifications = exports.getLikesReceived = exports.getLikedProfiles = exports.likeProfile = exports.freeSearch = exports.getVipUsers = exports.uploadPhotos = exports.deleteUser = exports.toggleVipStatus = exports.toggleUserStatus = exports.approveUser = exports.updateUser = exports.createUser = exports.advancedSearch = exports.getPublicProfile = exports.printProfile = exports.viewProfile = exports.getViewedProfiles = exports.changePassword = exports.updateMe = exports.getMe = exports.getAllUsers = exports.searchUsers = void 0;
// Triggering nodemon restart for Prisma client update 7
const bcrypt_1 = __importDefault(require("bcrypt"));
const orm_client_1 = require("@prisma/orm-postgres/orm-client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const profile_1 = require("../lib/profile");
// Search users by email or ID
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const users = await prisma_1.default.orm.public.User
            .where((u) => (0, orm_client_1.or)(u.email.ilike(`%${q}%`), u.id.eq(q)))
            .select('id', 'email', 'role', 'status', 'isActive', 'isVip')
            .include('profile', (p) => p.select('firstName', 'lastName'))
            .limit(10)
            .all();
        return res.json(users);
    }
    catch (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.searchUsers = searchUsers;
// Get all users with their current plan (Exclude Admins)
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.orm.public.User
            .where({ role: 'USER' })
            .include('subscriptions', (s) => s.include('plan').orderBy((sub) => sub.endDate.desc()).limit(1))
            .orderBy((u) => u.createdAt.desc())
            .all();
        const profilesByUser = await (0, profile_1.findProfilesForUsers)(users.map((u) => u.id));
        const serializedUsers = users.map(user => {
            const profile = profilesByUser.get(user.id) ?? null;
            // Determine the active plan name if they have a valid subscription
            let currentPlan = 'Free';
            if (user.subscriptions.length > 0) {
                const sub = user.subscriptions[0];
                if (new Date(sub.endDate) > new Date()) {
                    currentPlan = sub.plan.name;
                }
            }
            return {
                id: user.id,
                registrationId: user.registrationId,
                email: user.email,
                name: profile ? `${profile.firstName} ${profile.lastName}` : user.email.split('@')[0],
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                gender: profile?.gender,
                status: user.status === 'APPROVED' ? 'Approved' : 'Pending',
                isActive: user.isActive,
                isVip: user.isVip,
                date: user.createdAt.toLocaleDateString(),
                plan: currentPlan,
                // Extended fields
                casteId: profile?.casteId,
                casteName: profile?.caste?.name,
                educationId: profile?.educationId,
                educationName: profile?.education?.name,
                occupationId: profile?.occupationId,
                occupationName: profile?.occupation?.name,
                countryId: profile?.countryId,
                countryName: profile?.country?.name,
                dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : undefined,
                height: profile?.height,
                weight: profile?.weight,
                fatherName: profile?.fatherName,
                fatherOccupation: profile?.fatherOccupation,
                motherName: profile?.motherName,
                motherOccupation: profile?.motherOccupation,
                fatherNative: profile?.fatherNative,
                motherNative: profile?.motherNative,
                nativePlace: profile?.nativePlace,
                birthPlace: profile?.birthPlace,
                brothers: profile?.brothers,
                brothersMarried: profile?.brothersMarried,
                sisters: profile?.sisters,
                sistersMarried: profile?.sistersMarried,
                familyDeity: profile?.familyDeity,
                properties: profile?.properties,
                expectations: profile?.expectations,
                income: profile?.income,
                workplace: profile?.workplace,
                horoscopeFile: profile?.horoscopeFile,
                photoFile: profile?.photoFile,
                photos: profile?.photos || [],
                address1: profile?.address1,
                address2: profile?.address2,
                city: profile?.city,
                mobileNo: profile?.mobileNo,
                specialCase: profile?.specialCase,
                profileFor: profile?.profileFor,
                rasiGrid: profile?.rasiGrid,
                amsamGrid: profile?.amsamGrid,
                rasi: profile?.rasi,
                natchathiram: profile?.natchathiram,
                lagnam: profile?.lagnam,
                padam: profile?.padam,
                dasaIruppu: profile?.dasaIruppu,
                dasaBalanceYear: profile?.dasaBalanceYear,
                dasaBalanceMonth: profile?.dasaBalanceMonth,
                dasaBalanceDay: profile?.dasaBalanceDay
            };
        });
        return res.json(serializedUsers);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.orm.public.User
            .include('subscriptions', (s) => s.include('plan').orderBy((sub) => sub.endDate.desc()).limit(1))
            .first({ id: userId });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const profile = await (0, profile_1.findProfileForUser)(userId);
        return res.json({ ...user, profile: profile ?? null });
    }
    catch (error) {
        console.error('Error fetching me:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, dateOfBirth, gender, mobileNo, city, address1, address2, height, weight, income, workplace, fatherName, fatherOccupation, motherName, motherOccupation, fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations, casteId, educationId, occupationId, countryId, specialCase, profileFor, rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu, photos } = req.body;
        // We update only the profile
        await prisma_1.default.orm.public.UserProfile
            .where({ userId })
            .update({
            firstName, lastName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender, mobileNo, city, address1, address2,
            height: height ? Number(height) : undefined,
            weight: weight ? Number(weight) : undefined,
            income, workplace, fatherName, fatherOccupation, motherName, motherOccupation,
            fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations,
            casteId: casteId ? Number(casteId) : undefined,
            educationId: educationId ? Number(educationId) : undefined,
            occupationId: occupationId ? Number(occupationId) : undefined,
            countryId: countryId ? Number(countryId) : undefined,
            specialCase, profileFor, rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu,
            photos: photos || undefined
        });
        const user = await prisma_1.default.orm.public.User.first({ id: userId });
        const profile = user ? await prisma_1.default.orm.public.UserProfile.where({ userId: user.id }).first() : null;
        return res.json(user ? { ...user, profile: profile ?? null } : null);
    }
    catch (error) {
        console.error('Error updating me:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateMe = updateMe;
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await prisma_1.default.orm.public.User.first({ id: userId });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch)
            return res.status(400).json({ error: 'Incorrect current password' });
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(newPassword, salt);
        await prisma_1.default.orm.public.User
            .where({ id: userId })
            .update({ passwordHash });
        return res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.changePassword = changePassword;
const getViewedProfiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const views = await prisma_1.default.orm.public.ProfileView
            .where({ viewerId: userId })
            .orderBy((v) => v.viewedAt.desc())
            .all();
        const viewedUsers = await prisma_1.default.orm.public.User
            .where((u) => u.id.in(views.map((v) => v.viewedId)))
            .select('id', 'email')
            .all();
        const profilesByUser = await (0, profile_1.findProfilesForUsers)(viewedUsers.map((u) => u.id));
        return res.json(views.map((view) => {
            const viewed = viewedUsers.find((u) => u.id === view.viewedId) ?? null;
            return {
                ...view,
                viewed: viewed ? { ...viewed, profile: profilesByUser.get(viewed.id) ?? null } : null,
            };
        }));
    }
    catch (error) {
        console.error('Error fetching viewed profiles:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getViewedProfiles = getViewedProfiles;
const viewProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: viewedId } = req.params;
        if (userId === viewedId)
            return res.status(400).json({ error: 'Cannot view own profile this way' });
        const existingView = await prisma_1.default.orm.public.ProfileView
            .where({ viewerId: userId, viewedId })
            .first();
        const view = existingView
            ? await prisma_1.default.orm.public.ProfileView
                .where({ id: existingView.id })
                .update({ viewedAt: new Date() })
            : await prisma_1.default.orm.public.ProfileView.create({
                viewerId: userId,
                viewedId
            });
        return res.json(view);
    }
    catch (error) {
        console.error('Error recording profile view:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.viewProfile = viewProfile;
const printProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: printedUserId } = req.params;
        if (userId === printedUserId)
            return res.status(400).json({ error: 'Cannot print own profile this way' });
        // Check if the user has already printed this profile
        const existingPrint = await prisma_1.default.orm.public.ProfilePrint
            .where({ printerId: userId, printedId: printedUserId })
            .first();
        if (existingPrint) {
            // Already printed, just return success without deducting
            return res.json({ message: 'Already printed before, no plan count deducted' });
        }
        // Find an active subscription with remaining contacts > 0
        const activeSub = await prisma_1.default.orm.public.UserSubscription
            .where((s) => (0, orm_client_1.and)(s.userId.eq(userId), s.endDate.gte(new Date()), s.remainingContacts.gt(0)))
            .orderBy((s) => s.endDate.asc())
            .first();
        if (!activeSub) {
            return res.status(403).json({ error: 'Insufficient plan contacts or no active plan' });
        }
        // Decrement the plan count and record the print in a transaction
        await prisma_1.default.transaction(async (tx) => {
            await tx.orm.public.UserSubscription
                .where({ id: activeSub.id })
                .update({ remainingContacts: activeSub.remainingContacts - 1 });
            await tx.orm.public.ProfilePrint.create({
                printerId: userId,
                printedId: printedUserId
            });
        });
        return res.json({ message: 'Plan count reduced successfully', remainingContacts: activeSub.remainingContacts - 1 });
    }
    catch (error) {
        console.error('Error in printProfile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.printProfile = printProfile;
const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.orm.public.User
            .include('subscriptions', (s) => s.include('plan').orderBy((sub) => sub.endDate.desc()).limit(1))
            .first({ id });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const profile = await (0, profile_1.findProfileForUser)(id);
        // Optionally remove sensitive info here (like passwordHash, though it should be excluded generally, but it's not excluded automatically in prisma unless specified. Actually, passwordHash is returned. We should omit it.)
        const { passwordHash, ...safeUser } = { ...user, profile: profile ?? null };
        return res.json(safeUser);
    }
    catch (error) {
        console.error('Error fetching public profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPublicProfile = getPublicProfile;
const advancedSearch = async (req, res) => {
    try {
        const userId = req.user.id;
        const { minAge, maxAge, educationId, occupationId, city, gender } = req.query;
        const minAgeNum = minAge ? parseInt(minAge) : undefined;
        const maxAgeNum = maxAge ? parseInt(maxAge) : undefined;
        const now = new Date();
        const minDate = maxAgeNum ? new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate()) : undefined;
        const maxDate = minAgeNum ? new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate()) : undefined;
        const currentUser = await prisma_1.default.orm.public.User
            .include('profile', (p) => p.select('gender', 'casteId'))
            .first({ id: userId });
        let targetGender = gender ? gender : undefined;
        if (currentUser?.profile?.gender === 'MALE') {
            targetGender = 'FEMALE';
        }
        else if (currentUser?.profile?.gender === 'FEMALE') {
            targetGender = 'MALE';
        }
        const targetCasteId = currentUser?.profile?.casteId;
        const hasProfileFilters = !!(targetGender || targetCasteId || educationId || occupationId || city || minAge || maxAge);
        const base = prisma_1.default.orm.public.User.where((u) => (0, orm_client_1.and)(u.role.eq('USER'), u.status.eq('APPROVED'), u.isActive.eq(true), u.id.neq(userId), ...(hasProfileFilters ? [u.profile.some((p) => (0, orm_client_1.and)(...(targetGender ? [p.gender.eq(targetGender)] : []), ...(targetCasteId ? [p.casteId.eq(targetCasteId)] : []), ...(educationId ? [p.educationId.eq(parseInt(educationId))] : []), ...(occupationId ? [p.occupationId.eq(parseInt(occupationId))] : []), ...(city ? [p.city.ilike(`%${city}%`)] : []), ...(minDate ? [p.dateOfBirth.gte(minDate)] : []), ...(maxDate ? [p.dateOfBirth.lte(maxDate)] : [])))] : [])));
        const users = await base
            .limit(20)
            .all();
        const profilesByUser = await (0, profile_1.findProfilesForUsers)(users.map((u) => u.id));
        return res.json(users.map((u) => ({ ...u, profile: profilesByUser.get(u.id) ?? null })));
    }
    catch (error) {
        console.error('Error in advanced search:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}; // Create a new user (Admin side)
exports.advancedSearch = advancedSearch;
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, gender, casteId, educationId, occupationId, countryId, dateOfBirth, height, weight, fatherName, fatherOccupation, motherName, motherOccupation, fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations, income, workplace, horoscopeFile, photoFile, photos, address1, address2, city, mobileNo, specialCase, profileFor, rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu, dasaBalanceYear, dasaBalanceMonth, dasaBalanceDay } = req.body;
        // Check if user already exists
        const existingUser = await prisma_1.default.orm.public.User.where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        const user = await prisma_1.default.orm.public.User.include('profile').create({
            email,
            passwordHash,
            role: 'USER', // Hardcoded
            status: 'PENDING', // Hardcoded
            profile: (p) => p.create({
                firstName,
                lastName,
                gender: gender || 'MALE',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
                casteId: casteId ? Number(casteId) : undefined,
                educationId: educationId ? Number(educationId) : undefined,
                occupationId: occupationId ? Number(occupationId) : undefined,
                countryId: countryId ? Number(countryId) : undefined,
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                fatherName,
                fatherOccupation,
                motherName,
                motherOccupation,
                fatherNative,
                motherNative,
                nativePlace,
                birthPlace,
                brothers,
                brothersMarried,
                sisters,
                sistersMarried,
                familyDeity,
                properties,
                expectations,
                income,
                workplace,
                horoscopeFile,
                photoFile,
                photos: photos || [],
                address1,
                address2,
                city,
                mobileNo,
                specialCase,
                profileFor,
                rasiGrid,
                amsamGrid,
                rasi,
                natchathiram,
                lagnam,
                padam,
                dasaIruppu,
                dasaBalanceYear: dasaBalanceYear ? Number(dasaBalanceYear) : undefined,
                dasaBalanceMonth: dasaBalanceMonth ? Number(dasaBalanceMonth) : undefined,
                dasaBalanceDay: dasaBalanceDay ? Number(dasaBalanceDay) : undefined
            })
        });
        return res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createUser = createUser;
// Update an existing user (Admin side)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, gender, casteId, educationId, occupationId, countryId, dateOfBirth, height, weight, fatherName, fatherOccupation, motherName, motherOccupation, fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations, income, workplace, horoscopeFile, photoFile, photos, address1, address2, city, mobileNo, specialCase, profileFor, rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu, dasaBalanceYear, dasaBalanceMonth, dasaBalanceDay } = req.body;
        const user = await prisma_1.default.orm.public.User.first({ id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await prisma_1.default.orm.public.UserProfile
            .where({ userId: id })
            .update({
            firstName,
            lastName,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            casteId: casteId ? Number(casteId) : null,
            educationId: educationId ? Number(educationId) : null,
            occupationId: occupationId ? Number(occupationId) : null,
            countryId: countryId ? Number(countryId) : null,
            height: height ? Number(height) : null,
            weight: weight ? Number(weight) : null,
            fatherName,
            fatherOccupation,
            motherName,
            motherOccupation,
            fatherNative,
            motherNative,
            nativePlace,
            birthPlace,
            brothers,
            brothersMarried,
            sisters,
            sistersMarried,
            familyDeity,
            properties,
            expectations,
            income,
            workplace,
            horoscopeFile,
            photoFile,
            photos: photos || [],
            address1,
            address2,
            city,
            mobileNo,
            specialCase,
            profileFor,
            rasiGrid,
            amsamGrid,
            rasi,
            natchathiram,
            lagnam,
            padam,
            dasaIruppu,
            dasaBalanceYear: dasaBalanceYear ? Number(dasaBalanceYear) : null,
            dasaBalanceMonth: dasaBalanceMonth ? Number(dasaBalanceMonth) : null,
            dasaBalanceDay: dasaBalanceDay ? Number(dasaBalanceDay) : null
        });
        const updatedUser = await prisma_1.default.orm.public.User.first({ id });
        const updatedProfile = updatedUser ? await prisma_1.default.orm.public.UserProfile.where({ userId: updatedUser.id }).first() : null;
        return res.json(updatedUser ? { ...updatedUser, profile: updatedProfile ?? null } : null);
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUser = updateUser;
// Approve a user
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.orm.public.User.first({ id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let registrationId = user.registrationId;
        if (!registrationId) {
            const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
            registrationId = `MAT${randomPart}`;
        }
        const updated = await prisma_1.default.orm.public.User
            .where({ id })
            .update({
            status: 'APPROVED',
            registrationId
        });
        return res.json(updated);
    }
    catch (error) {
        console.error('Error approving user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.approveUser = approveUser;
// Toggle user active status
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.orm.public.User.first({ id });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const updatedUser = await prisma_1.default.orm.public.User
            .where({ id })
            .update({ isActive: !user.isActive });
        return res.json({ message: 'User status updated', user: updatedUser });
    }
    catch (error) {
        console.error('Error toggling user status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleUserStatus = toggleUserStatus;
// Toggle user VIP status
const toggleVipStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.orm.public.User.first({ id });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const updatedUser = await prisma_1.default.orm.public.User
            .where({ id })
            .update({ isVip: !user.isVip });
        return res.json({ message: 'User VIP status updated', user: updatedUser });
    }
    catch (error) {
        console.error('Error toggling VIP status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleVipStatus = toggleVipStatus;
// Safely delete a user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Because Prisma lacks onDelete: Cascade by default for these schemas,
        // we must delete related records in a transaction first.
        await prisma_1.default.transaction(async (tx) => {
            await tx.orm.public.Transaction.where({ userId: id }).deleteAll();
            await tx.orm.public.UserSubscription.where({ userId: id }).deleteAll();
            await tx.orm.public.UserProfile.where({ userId: id }).deleteAll();
            await tx.orm.public.User.where({ id }).delete();
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteUser = deleteUser;
const uploadPhotos = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
        return res.json({ urls: fileUrls });
    }
    catch (error) {
        console.error('Error uploading photos:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.uploadPhotos = uploadPhotos;
// Get top VIP users for public view
const getVipUsers = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 12;
        const users = await prisma_1.default.orm.public.User
            .where({ role: 'USER', isVip: true, status: 'APPROVED', isActive: true })
            .include('profile', (p) => p
            .select('firstName', 'lastName', 'dateOfBirth', 'photos', 'photoFile', 'city')
            .include('caste', (c) => c.select('name'))
            .include('occupation', (o) => o.select('name')))
            .limit(limit)
            .orderBy((u) => u.createdAt.desc())
            .all();
        const serializedUsers = users.map(user => {
            let age = 25;
            if (user.profile?.dateOfBirth) {
                const diffMs = Date.now() - new Date(user.profile.dateOfBirth).getTime();
                age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
            }
            let image = 'https://via.placeholder.com/300';
            if (user.profile?.photos && user.profile.photos.length > 0) {
                image = user.profile.photos[0];
            }
            else if (user.profile?.photoFile) {
                image = user.profile.photoFile;
            }
            return {
                id: user.id,
                name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email.split('@')[0],
                age,
                caste: user.profile?.caste?.name || 'Not Specified',
                location: user.profile?.city || 'Not Specified',
                image,
                profession: user.profile?.occupation?.name || 'Not Specified'
            };
        });
        return res.json(serializedUsers);
    }
    catch (error) {
        console.error('Error fetching VIP users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getVipUsers = getVipUsers;
const freeSearch = async (req, res) => {
    try {
        const { page = '1', limit = '10', minAge, maxAge, casteId, educationId, photoOption, registrationId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        let hasProfileCondition = false;
        let minDate;
        let maxDate;
        if (minAge || maxAge) {
            const now = new Date();
            const minAgeNum = minAge ? parseInt(minAge) : undefined;
            const maxAgeNum = maxAge ? parseInt(maxAge) : undefined;
            maxDate = minAgeNum ? new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate()) : undefined;
            minDate = maxAgeNum ? new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate() + 1) : undefined;
            hasProfileCondition = true;
        }
        if (casteId) {
            hasProfileCondition = true;
        }
        if (educationId) {
            hasProfileCondition = true;
        }
        if (photoOption === 'withPhoto') {
            hasProfileCondition = true;
        }
        const base = prisma_1.default.orm.public.User.where((u) => (0, orm_client_1.and)(u.role.eq('USER'), u.status.eq('APPROVED'), u.isActive.eq(true), ...(registrationId ? [u.registrationId.ilike(`%${registrationId}%`)] : []), ...(hasProfileCondition ? [u.profile.some((p) => (0, orm_client_1.and)(...(minDate ? [p.dateOfBirth.gte(minDate)] : []), ...(maxDate ? [p.dateOfBirth.lte(maxDate)] : []), ...(casteId ? [p.casteId.eq(parseInt(casteId))] : []), ...(educationId ? [p.educationId.eq(parseInt(educationId))] : []), ...(photoOption === 'withPhoto' ? [(0, orm_client_1.or)(p.photos.neq([]), p.photoFile.isNotNull())] : [])))] : [])));
        const [totalCount, users] = await Promise.all([
            base.aggregate((a) => ({ total: a.count() })).then((r) => r.total),
            base
                .include('profile', (p) => p
                .include('caste', (c) => c.select('name'))
                .include('education', (e) => e.select('name'))
                .include('occupation', (o) => o.select('name'))
                .include('country', (co) => co.select('name'))
                .select('firstName', 'lastName', 'gender', 'casteId', 'educationId', 'occupationId', 'countryId', 'dateOfBirth', 'height', 'weight', 'fatherName', 'motherName', 'income', 'workplace', 'horoscopeFile', 'photoFile', 'photos', 'address1', 'address2', 'city', 'mobileNo', 'specialCase', 'profileFor', 'rasiGrid', 'amsamGrid', 'rasi', 'natchathiram', 'lagnam', 'padam', 'dasaIruppu', 'dasaBalanceYear', 'dasaBalanceMonth', 'dasaBalanceDay'))
                .include('subscriptions', (s) => s.include('plan').orderBy((sub) => sub.endDate.desc()).limit(1))
                .orderBy((u) => u.createdAt.desc())
                .offset(skip)
                .limit(limitNum)
                .all()
        ]);
        const serializedUsers = users.map(user => {
            const profile = user.profile;
            let currentPlan = 'Free';
            if (user.subscriptions.length > 0) {
                const sub = user.subscriptions[0];
                if (new Date(sub.endDate) > new Date()) {
                    currentPlan = sub.plan.name;
                }
            }
            return {
                id: user.id,
                registrationId: user.registrationId,
                email: user.email,
                name: profile ? `${profile.firstName} ${profile.lastName}` : user.email.split('@')[0],
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                gender: profile?.gender,
                status: user.status === 'APPROVED' ? 'Approved' : 'Pending',
                isActive: user.isActive,
                isVip: user.isVip,
                date: user.createdAt.toLocaleDateString(),
                plan: currentPlan,
                casteId: profile?.casteId,
                casteName: profile?.caste?.name,
                educationId: profile?.educationId,
                educationName: profile?.education?.name,
                occupationId: profile?.occupationId,
                occupationName: profile?.occupation?.name,
                countryId: profile?.countryId,
                countryName: profile?.country?.name,
                dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : undefined,
                height: profile?.height,
                weight: profile?.weight,
                fatherName: profile?.fatherName,
                motherName: profile?.motherName,
                income: profile?.income,
                workplace: profile?.workplace,
                horoscopeFile: profile?.horoscopeFile,
                photoFile: profile?.photoFile,
                photos: profile?.photos || [],
                address1: profile?.address1,
                address2: profile?.address2,
                city: profile?.city,
                mobileNo: profile?.mobileNo,
                specialCase: profile?.specialCase,
                profileFor: profile?.profileFor,
                rasiGrid: profile?.rasiGrid,
                amsamGrid: profile?.amsamGrid,
                rasi: profile?.rasi,
                natchathiram: profile?.natchathiram,
                lagnam: profile?.lagnam,
                padam: profile?.padam,
                dasaIruppu: profile?.dasaIruppu,
                dasaBalanceYear: profile?.dasaBalanceYear,
                dasaBalanceMonth: profile?.dasaBalanceMonth,
                dasaBalanceDay: profile?.dasaBalanceDay,
            };
        });
        return res.json({
            data: serializedUsers,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error in freeSearch:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.freeSearch = freeSearch;
// Like a profile
const likeProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: likedId } = req.params;
        if (userId === likedId)
            return res.status(400).json({ error: 'Cannot like own profile' });
        // Check if already liked
        const existingLike = await prisma_1.default.orm.public.ProfileLike
            .where({ likerId: userId, likedId })
            .first();
        if (existingLike) {
            return res.status(400).json({ error: 'Profile already liked' });
        }
        const liker = await prisma_1.default.orm.public.User
            .include('profile', (p) => p.select('firstName', 'lastName'))
            .first({ id: userId });
        // Create the like
        const newLike = await prisma_1.default.orm.public.ProfileLike.create({
            likerId: userId,
            likedId
        });
        // Create a notification for the liked user
        const likerName = liker?.profile ? `${liker.profile.firstName} ${liker.profile.lastName}` : 'Someone';
        await prisma_1.default.orm.public.Notification.create({
            userId: likedId,
            message: `${likerName} liked your profile!`
        });
        return res.status(201).json(newLike);
    }
    catch (error) {
        console.error('Error liking profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.likeProfile = likeProfile;
// Get profiles the current user has liked
const getLikedProfiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const likes = await prisma_1.default.orm.public.ProfileLike
            .where({ likerId: userId })
            .orderBy((l) => l.createdAt.desc())
            .all();
        const likedUsers = await prisma_1.default.orm.public.User
            .where((u) => u.id.in(likes.map((l) => l.likedId)))
            .select('id', 'email')
            .all();
        const profilesByUser = await (0, profile_1.findProfilesForUsers)(likedUsers.map((u) => u.id));
        return res.json(likes.map((like) => {
            const liked = likedUsers.find((u) => u.id === like.likedId) ?? null;
            return {
                ...like,
                liked: liked ? { ...liked, profile: profilesByUser.get(liked.id) ?? null } : null,
            };
        }));
    }
    catch (error) {
        console.error('Error fetching liked profiles:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLikedProfiles = getLikedProfiles;
// Get profiles who have liked the current user
const getLikesReceived = async (req, res) => {
    try {
        const userId = req.user.id;
        const likes = await prisma_1.default.orm.public.ProfileLike
            .where({ likedId: userId })
            .orderBy((l) => l.createdAt.desc())
            .all();
        const likerUsers = await prisma_1.default.orm.public.User
            .where((u) => u.id.in(likes.map((l) => l.likerId)))
            .select('id', 'email')
            .all();
        const profilesByUser = await (0, profile_1.findProfilesForUsers)(likerUsers.map((u) => u.id));
        return res.json(likes.map((like) => {
            const liker = likerUsers.find((u) => u.id === like.likerId) ?? null;
            return {
                ...like,
                liker: liker ? { ...liker, profile: profilesByUser.get(liker.id) ?? null } : null,
            };
        }));
    }
    catch (error) {
        console.error('Error fetching received likes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLikesReceived = getLikesReceived;
// Get unread notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma_1.default.orm.public.Notification
            .where({ userId, isRead: false })
            .orderBy((n) => n.createdAt.desc())
            .all();
        return res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await prisma_1.default.orm.public.Notification.first({ id });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        const updated = await prisma_1.default.orm.public.Notification
            .where({ id })
            .update({ isRead: true });
        return res.json(updated);
    }
    catch (error) {
        console.error('Error marking notification read:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.markNotificationRead = markNotificationRead;
