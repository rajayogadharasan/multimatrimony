import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const validTypes = ['CASTE', 'EDUCATION', 'COUNTRY', 'OCCUPATION', 'BANK', 'CONTACT_ADDRESS'];

export const createMasterData = async (req: Request, res: Response) => {
  try {
    const { type, name, isActive, accountName, bankName, accountNo, ifscCode, bankImage, qrImage, contactName, address, city, phoneNo, emailId, pinCode } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid master data type' });
    }

    const newItem = await prisma.orm.public.MasterData.create({
      type,
      name,
      isActive: isActive !== undefined ? isActive : true,
      accountName,
      bankName,
      accountNo,
      ifscCode,
      bankImage,
      qrImage,
      contactName,
      address,
      city,
      phoneNo,
      emailId,
      pinCode,
    });

    return res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating master data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMasterDataByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!validTypes.includes(type as string)) {
      return res.status(400).json({ error: 'Invalid master data type' });
    }

    const items = await prisma.orm.public.MasterData
      .where({ type: type as 'CASTE' | 'EDUCATION' | 'COUNTRY' | 'OCCUPATION' | 'BANK' | 'CONTACT_ADDRESS' })
      .orderBy((m) => m.id.asc())
      .all();

    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching master data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMasterData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isActive, accountName, bankName, accountNo, ifscCode, bankImage, qrImage, contactName, address, city, phoneNo, emailId, pinCode } = req.body;

    const updatedItem = await prisma.orm.public.MasterData
      .where({ id: parseInt(id as string) })
      .update({
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(accountName !== undefined && { accountName }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNo !== undefined && { accountNo }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(bankImage !== undefined && { bankImage }),
        ...(qrImage !== undefined && { qrImage }),
        ...(contactName !== undefined && { contactName }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(phoneNo !== undefined && { phoneNo }),
        ...(emailId !== undefined && { emailId }),
        ...(pinCode !== undefined && { pinCode }),
      });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating master data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMasterData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.orm.public.MasterData
      .where({ id: parseInt(id as string) })
      .delete();

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting master data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
