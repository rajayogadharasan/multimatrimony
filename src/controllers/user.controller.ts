import { Request, Response } from 'express';
// Triggering nodemon restart for Prisma client update 7
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

// Search users by email or ID
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { id: { equals: q } } // UUID exactly matches
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        isVip: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 10
    });
    
    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users with their current plan (Exclude Admins)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      include: {
        profile: {
          include: {
            caste: true,
            education: true,
            occupation: true,
            country: true
          }
        },
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: {
            endDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedUsers = users.map(user => {
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
        name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email.split('@')[0],
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        gender: user.profile?.gender,
        status: user.status === 'APPROVED' ? 'Approved' : 'Pending',
        isActive: user.isActive,
        isVip: user.isVip,
        date: user.createdAt.toLocaleDateString(),
        plan: currentPlan,
        // Extended fields
        casteId: user.profile?.casteId,
        casteName: user.profile?.caste?.name,
        educationId: user.profile?.educationId,
        educationName: user.profile?.education?.name,
        occupationId: user.profile?.occupationId,
        occupationName: user.profile?.occupation?.name,
        countryId: user.profile?.countryId,
        countryName: user.profile?.country?.name,
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.toISOString().split('T')[0] : undefined,
        height: user.profile?.height,
        weight: user.profile?.weight,
        fatherName: user.profile?.fatherName,
        fatherOccupation: user.profile?.fatherOccupation,
        motherName: user.profile?.motherName,
        motherOccupation: user.profile?.motherOccupation,
        fatherNative: user.profile?.fatherNative,
        motherNative: user.profile?.motherNative,
        nativePlace: user.profile?.nativePlace,
        birthPlace: user.profile?.birthPlace,
        brothers: user.profile?.brothers,
        brothersMarried: user.profile?.brothersMarried,
        sisters: user.profile?.sisters,
        sistersMarried: user.profile?.sistersMarried,
        familyDeity: user.profile?.familyDeity,
        properties: user.profile?.properties,
        expectations: user.profile?.expectations,
        income: user.profile?.income,
        workplace: user.profile?.workplace,
        horoscopeFile: user.profile?.horoscopeFile,
        photoFile: user.profile?.photoFile,
        photos: user.profile?.photos || [],
        address1: user.profile?.address1,
        address2: user.profile?.address2,
        city: user.profile?.city,
        mobileNo: user.profile?.mobileNo,
        specialCase: user.profile?.specialCase,
        profileFor: user.profile?.profileFor,
        rasiGrid: user.profile?.rasiGrid,
        amsamGrid: user.profile?.amsamGrid,
        rasi: user.profile?.rasi,
        natchathiram: user.profile?.natchathiram,
        lagnam: user.profile?.lagnam,
        padam: user.profile?.padam,
        dasaIruppu: user.profile?.dasaIruppu,
        dasaBalanceYear: user.profile?.dasaBalanceYear,
        dasaBalanceMonth: user.profile?.dasaBalanceMonth,
        dasaBalanceDay: user.profile?.dasaBalanceDay
      };
    });

    return res.json(serializedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            caste: true,
            education: true,
            occupation: true,
            country: true
          }
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user);
  } catch (error) {
    console.error('Error fetching me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { 
      firstName, lastName, dateOfBirth, gender, mobileNo, city, address1, address2,
      height, weight, income, workplace, fatherName, fatherOccupation, motherName, motherOccupation,
      fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations,
      casteId, educationId, occupationId, countryId, specialCase, profileFor,
      rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu,
      photos
    } = req.body;
    
    // We update only the profile
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            firstName, lastName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender, mobileNo, city, address1, address2,
            height: height ? Number(height) : undefined, 
            weight: weight ? Number(weight) : undefined, 
            income, workplace, fatherName, fatherOccupation, motherName, motherOccupation,
            fatherNative, motherNative, nativePlace, birthPlace, brothers, brothersMarried, sisters, sistersMarried, familyDeity, properties, expectations,
            caste: casteId ? { connect: { id: Number(casteId) } } : undefined,
            education: educationId ? { connect: { id: Number(educationId) } } : undefined,
            occupation: occupationId ? { connect: { id: Number(occupationId) } } : undefined,
            country: countryId ? { connect: { id: Number(countryId) } } : undefined,
            specialCase, profileFor, rasiGrid, amsamGrid, rasi, natchathiram, lagnam, padam, dasaIruppu,
            photos: photos || undefined
          }
        }
      },
      include: { profile: true }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getViewedProfiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const views = await prisma.profileView.findMany({
      where: { viewerId: userId },
      include: {
        viewed: {
          select: {
            id: true,
            email: true,
            profile: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    });
    
    return res.json(views);
  } catch (error) {
    console.error('Error fetching viewed profiles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const viewProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id: viewedId } = req.params;
    
    if (userId === viewedId) return res.status(400).json({ error: 'Cannot view own profile this way' });
    
    const view = await prisma.profileView.upsert({
      where: {
        viewerId_viewedId: { viewerId: userId, viewedId }
      },
      update: { viewedAt: new Date() },
      create: {
        viewerId: userId,
        viewedId
      }
    });
    
    return res.json(view);
  } catch (error) {
    console.error('Error recording profile view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const printProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id: printedUserId } = req.params;

    if (userId === printedUserId) return res.status(400).json({ error: 'Cannot print own profile this way' });

    // Check if the user has already printed this profile
    const existingPrint = await prisma.profilePrint.findUnique({
      where: {
        printerId_printedId: { printerId: userId, printedId: printedUserId }
      }
    });

    if (existingPrint) {
      // Already printed, just return success without deducting
      return res.json({ message: 'Already printed before, no plan count deducted' });
    }

    // Find an active subscription with remaining contacts > 0
    const activeSub = await prisma.userSubscription.findFirst({
      where: {
        userId,
        endDate: { gte: new Date() },
        remainingContacts: { gt: 0 }
      },
      orderBy: { endDate: 'asc' }
    });

    if (!activeSub) {
      return res.status(403).json({ error: 'Insufficient plan contacts or no active plan' });
    }

    // Decrement the plan count and record the print in a transaction
    await prisma.$transaction([
      prisma.userSubscription.update({
        where: { id: activeSub.id },
        data: { remainingContacts: activeSub.remainingContacts - 1 }
      }),
      prisma.profilePrint.create({
        data: {
          printerId: userId,
          printedId: printedUserId
        }
      })
    ]);

    return res.json({ message: 'Plan count reduced successfully', remainingContacts: activeSub.remainingContacts - 1 });
  } catch (error) {
    console.error('Error in printProfile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            caste: true,
            education: true,
            occupation: true,
            country: true
          }
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Optionally remove sensitive info here (like passwordHash, though it should be excluded generally, but it's not excluded automatically in prisma unless specified. Actually, passwordHash is returned. We should omit it.)
    const { passwordHash, ...safeUser } = user;
    return res.json(safeUser);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const advancedSearch = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { minAge, maxAge, educationId, occupationId, city, gender } = req.query;
    
    const minAgeNum = minAge ? parseInt(minAge as string) : undefined;
    const maxAgeNum = maxAge ? parseInt(maxAge as string) : undefined;
    
    const now = new Date();
    const minDate = maxAgeNum ? new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate()) : undefined;
    const maxDate = minAgeNum ? new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate()) : undefined;
    
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    let targetGender = gender ? (gender as any) : undefined;
    if (currentUser?.profile?.gender === 'MALE') {
      targetGender = 'FEMALE';
    } else if (currentUser?.profile?.gender === 'FEMALE') {
      targetGender = 'MALE';
    }
    
    const targetCasteId = currentUser?.profile?.casteId;
    
    const hasProfileFilters = !!(targetGender || targetCasteId || educationId || occupationId || city || minAge || maxAge);
    
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        status: 'APPROVED',
        isActive: true,
        id: { not: userId },
        ...(hasProfileFilters ? {
          profile: {
            gender: targetGender,
            casteId: targetCasteId ? targetCasteId : undefined,
            educationId: educationId ? parseInt(educationId as string) : undefined,
            occupationId: occupationId ? parseInt(occupationId as string) : undefined,
            city: city ? { contains: city as string, mode: 'insensitive' } : undefined,
            dateOfBirth: (minDate || maxDate) ? {
              gte: minDate,
              lte: maxDate
            } : undefined
          }
        } : {})
      },
      include: {
        profile: {
          include: { caste: true, occupation: true, education: true, country: true }
        }
      },
      take: 20
    });
    
    return res.json(users);
  } catch (error) {
    console.error('Error in advanced search:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};// Create a new user (Admin side)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName,
      gender,
      casteId,
      educationId,
      occupationId,
      countryId,
      dateOfBirth,
      height,
      weight,
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
      photos,
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
      dasaBalanceYear,
      dasaBalanceMonth,
      dasaBalanceDay
    } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER', // Hardcoded
        status: 'PENDING', // Hardcoded
        profile: {
          create: {
            firstName,
            lastName,
            gender: gender || 'MALE',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
            caste: casteId ? { connect: { id: Number(casteId) } } : undefined,
            education: educationId ? { connect: { id: Number(educationId) } } : undefined,
            occupation: occupationId ? { connect: { id: Number(occupationId) } } : undefined,
            country: countryId ? { connect: { id: Number(countryId) } } : undefined,
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
          }
        }
      },
      include: { profile: true }
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an existing user (Admin side)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName,
      gender,
      casteId,
      educationId,
      occupationId,
      countryId,
      dateOfBirth,
      height,
      weight,
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
      photos,
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
      dasaBalanceYear,
      dasaBalanceMonth,
      dasaBalanceDay
    } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        profile: {
          update: {
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
          }
        }
      },
      include: { profile: true }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve a user
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let registrationId = user.registrationId;
    if (!registrationId) {
      const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
      registrationId = `MAT${randomPart}`;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        registrationId 
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
    return res.json({ message: 'User status updated', user: updatedUser });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle user VIP status
export const toggleVipStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVip: !user.isVip }
    });
    return res.json({ message: 'User VIP status updated', user: updatedUser });
  } catch (error) {
    console.error('Error toggling VIP status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Safely delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Because Prisma lacks onDelete: Cascade by default for these schemas,
    // we must delete related records in a transaction first.
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.userSubscription.deleteMany({ where: { userId: id } }),
      prisma.userProfile.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadPhotos = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
    
    return res.json({ urls: fileUrls });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top VIP users for public view
export const getVipUsers = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        isVip: true,
        status: 'APPROVED',
        isActive: true
      },
      include: {
        profile: {
          include: {
            caste: true,
            occupation: true
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const serializedUsers = users.map(user => {
      let age = 25;
      if (user.profile?.dateOfBirth) {
        const diffMs = Date.now() - new Date(user.profile.dateOfBirth).getTime();
        age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      let image = 'https://via.placeholder.com/300';
      if (user.profile?.photos && user.profile.photos.length > 0) {
        image = user.profile.photos[0];
      } else if (user.profile?.photoFile) {
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
  } catch (error) {
    console.error('Error fetching VIP users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const freeSearch = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', minAge, maxAge, casteId, educationId, photoOption, registrationId } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const whereCondition: any = {
      role: 'USER',
      status: 'APPROVED',
      isActive: true,
    };
    
    if (registrationId) {
      whereCondition.registrationId = {
        contains: registrationId as string,
        mode: 'insensitive'
      };
    }
    
    const profileCondition: any = {};
    let hasProfileCondition = false;
    
    if (minAge || maxAge) {
      const now = new Date();
      const minAgeNum = minAge ? parseInt(minAge as string) : undefined;
      const maxAgeNum = maxAge ? parseInt(maxAge as string) : undefined;
      
      const maxDate = minAgeNum ? new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate()) : undefined;
      const minDate = maxAgeNum ? new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate() + 1) : undefined;
      
      profileCondition.dateOfBirth = {};
      if (minDate) profileCondition.dateOfBirth.gte = minDate;
      if (maxDate) profileCondition.dateOfBirth.lte = maxDate;
      hasProfileCondition = true;
    }
    
    if (casteId) {
      profileCondition.casteId = parseInt(casteId as string);
      hasProfileCondition = true;
    }
    
    if (educationId) {
      profileCondition.educationId = parseInt(educationId as string);
      hasProfileCondition = true;
    }
    
    if (photoOption === 'withPhoto') {
       profileCondition.OR = [
         { photos: { isEmpty: false } },
         { photoFile: { not: null } }
       ];
       hasProfileCondition = true;
    }
    
    if (hasProfileCondition) {
      whereCondition.profile = profileCondition;
    }
    
    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where: whereCondition }),
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limitNum,
        include: {
          profile: {
            include: {
              caste: true,
              education: true,
              occupation: true,
              country: true
            }
          },
          subscriptions: {
            include: { plan: true },
            orderBy: { endDate: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    const serializedUsers = users.map(user => {
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
        name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email.split('@')[0],
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        gender: user.profile?.gender,
        status: user.status === 'APPROVED' ? 'Approved' : 'Pending',
        isActive: user.isActive,
        isVip: user.isVip,
        date: user.createdAt.toLocaleDateString(),
        plan: currentPlan,
        casteId: user.profile?.casteId,
        casteName: user.profile?.caste?.name,
        educationId: user.profile?.educationId,
        educationName: user.profile?.education?.name,
        occupationId: user.profile?.occupationId,
        occupationName: user.profile?.occupation?.name,
        countryId: user.profile?.countryId,
        countryName: user.profile?.country?.name,
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.toISOString().split('T')[0] : undefined,
        height: user.profile?.height,
        weight: user.profile?.weight,
        fatherName: user.profile?.fatherName,
        motherName: user.profile?.motherName,
        income: user.profile?.income,
        workplace: user.profile?.workplace,
        horoscopeFile: user.profile?.horoscopeFile,
        photoFile: user.profile?.photoFile,
        photos: user.profile?.photos || [],
        address1: user.profile?.address1,
        address2: user.profile?.address2,
        city: user.profile?.city,
        mobileNo: user.profile?.mobileNo,
        specialCase: user.profile?.specialCase,
        profileFor: user.profile?.profileFor,
        rasiGrid: user.profile?.rasiGrid,
        amsamGrid: user.profile?.amsamGrid,
        rasi: user.profile?.rasi,
        natchathiram: user.profile?.natchathiram,
        lagnam: user.profile?.lagnam,
        padam: user.profile?.padam,
        dasaIruppu: user.profile?.dasaIruppu,
        dasaBalanceYear: user.profile?.dasaBalanceYear,
        dasaBalanceMonth: user.profile?.dasaBalanceMonth,
        dasaBalanceDay: user.profile?.dasaBalanceDay,
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

  } catch (error) {
    console.error('Error in freeSearch:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Like a profile
export const likeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id: likedId } = req.params;
    
    if (userId === likedId) return res.status(400).json({ error: 'Cannot like own profile' });
    
    // Check if already liked
    const existingLike = await prisma.profileLike.findUnique({
      where: {
        likerId_likedId: { likerId: userId, likedId }
      }
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Profile already liked' });
    }

    const liker = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    // Create the like
    const newLike = await prisma.profileLike.create({
      data: {
        likerId: userId,
        likedId
      }
    });

    // Create a notification for the liked user
    const likerName = liker?.profile ? `${liker.profile.firstName} ${liker.profile.lastName}` : 'Someone';
    await prisma.notification.create({
      data: {
        userId: likedId,
        message: `${likerName} liked your profile!`
      }
    });
    
    return res.status(201).json(newLike);
  } catch (error) {
    console.error('Error liking profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get profiles the current user has liked
export const getLikedProfiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const likes = await prisma.profileLike.findMany({
      where: { likerId: userId },
      include: {
        liked: {
          select: {
            id: true,
            email: true,
            profile: {
              include: {
                caste: true,
                occupation: true,
                education: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(likes);
  } catch (error) {
    console.error('Error fetching liked profiles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get profiles who have liked the current user
export const getLikesReceived = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const likes = await prisma.profileLike.findMany({
      where: { likedId: userId },
      include: {
        liker: {
          select: {
            id: true,
            email: true,
            profile: {
              include: {
                caste: true,
                occupation: true,
                education: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(likes);
  } catch (error) {
    console.error('Error fetching received likes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    return res.json(updated);
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
