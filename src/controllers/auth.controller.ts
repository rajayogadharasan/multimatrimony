import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName,
      gender,
      religion,
      maritalStatus,
      caste,
      dateOfBirth,
      mobileNo,
      education
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // In a real app we might try to map religion/caste/education to MasterData,
    // but for now we create it with basic string mappings if needed or null if they don't map to IDs easily.
    // For this simple implementation, we'll assume they pass IDs if they select from dropdowns, or we just leave them null
    // since the original createUser required those IDs. Let's create it with defaults for now and let them update later.

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        status: 'PENDING',
        profile: {
          create: {
            firstName: firstName || '',
            lastName: lastName || '',
            gender: gender === 'female' ? 'FEMALE' : 'MALE',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
            mobileNo: mobileNo || '',
            caste: caste ? { connect: { id: Number(caste) } } : undefined,
            education: education ? { connect: { id: Number(education) } } : undefined,
          }
        }
      },
      include: { profile: true }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error in register:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { registrationId, password } = req.body; // Can be email or registrationId depending on frontend form

    // Support both email and registrationId for login
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: registrationId },
          { registrationId: registrationId }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, registrationId: user.registrationId } });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
