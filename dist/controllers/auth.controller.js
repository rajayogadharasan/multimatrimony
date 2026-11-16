"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const orm_client_1 = require("@prisma/orm-postgres/orm-client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const jwt_1 = require("../lib/jwt");
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, gender, religion, maritalStatus, caste, dateOfBirth, mobileNo, education } = req.body;
        const existingUser = await prisma_1.default.orm.public.User.where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        // In a real app we might try to map religion/caste/education to MasterData,
        // but for now we create it with basic string mappings if needed or null if they don't map to IDs easily.
        // For this simple implementation, we'll assume they pass IDs if they select from dropdowns, or we just leave them null
        // since the original createUser required those IDs. Let's create it with defaults for now and let them update later.
        const user = await prisma_1.default.orm.public.User.include('profile').create({
            email,
            passwordHash,
            role: 'USER',
            status: 'PENDING',
            profile: (p) => p.create({
                firstName: firstName || '',
                lastName: lastName || '',
                gender: gender === 'female' ? 'FEMALE' : 'MALE',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
                mobileNo: mobileNo || '',
                photos: [],
                casteId: caste ? Number(caste) : undefined,
                educationId: education ? Number(education) : undefined,
            }),
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwt_1.JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error('Error in register:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { registrationId, password } = req.body; // Can be email or registrationId depending on frontend form
        // Support both email and registrationId for login
        const user = await prisma_1.default.orm.public.User
            .where((u) => (0, orm_client_1.or)(u.email.eq(registrationId), u.registrationId.eq(registrationId)))
            .first();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwt_1.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user.id, email: user.email, role: user.role, registrationId: user.registrationId } });
    }
    catch (error) {
        console.error('Error in login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
