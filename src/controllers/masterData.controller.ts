import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MasterDataType } from '@prisma/client';

export const createMasterData = async (req: Request, res: Response) => {
  try {
    const { type, name, isActive, accountName, bankName, accountNo, ifscCode, bankImage, qrImage, contactName, address, city, phoneNo, emailId, pinCode } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    const validTypes: MasterDataType[] = ['CASTE', 'EDUCATION', 'COUNTRY', 'OCCUPATION', 'BANK', 'CONTACT_ADDRESS'];
    if (!validTypes.includes(type as MasterDataType)) {
      return res.status(400).json({ error: 'Invalid master data type' });
    }

    const newItem = await prisma.masterData.create({
      data: {
        type: type as MasterDataType,
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
      },
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

    const validTypes: MasterDataType[] = ['CASTE', 'EDUCATION', 'COUNTRY', 'OCCUPATION', 'BANK', 'CONTACT_ADDRESS'];
    if (!validTypes.includes(type as MasterDataType)) {
      return res.status(400).json({ error: 'Invalid master data type' });
    }

    const items = await prisma.masterData.findMany({
      where: {
        type: type as MasterDataType,
      },
      orderBy: {
        id: 'asc',
      },
    });

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

    const updatedItem = await prisma.masterData.update({
      where: { id: parseInt(id) },
      data: {
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
      },
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

    await prisma.masterData.delete({
      where: { id: parseInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting master data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
