import { Router } from 'express';
import { 
  createMasterData, 
  getMasterDataByType, 
  updateMasterData, 
  deleteMasterData 
} from '../controllers/masterData.controller';

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'E:/storage/mm');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const router = Router();

// POST /api/master-data/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  return res.status(200).json({ filename: req.file.filename });
});

// POST /api/master-data
router.post('/', createMasterData as any);

// GET /api/master-data/:type
router.get('/:type', getMasterDataByType as any);

// PUT /api/master-data/:id
router.put('/:id', updateMasterData as any);

// DELETE /api/master-data/:id
router.delete('/:id', deleteMasterData as any);

export default router;
