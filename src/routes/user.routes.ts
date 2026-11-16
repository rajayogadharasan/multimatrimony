import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  searchUsers, 
  getAllUsers,
  createUser,
  updateUser,
  approveUser, 
  toggleUserStatus, 
  deleteUser,
  uploadPhotos,
  toggleVipStatus,
  getVipUsers,
  getMe,
  updateMe,
  changePassword,
  getViewedProfiles,
  viewProfile,
  getPublicProfile,
  advancedSearch,
  freeSearch,
  likeProfile,
  getLikedProfiles,
  getLikesReceived,
  getNotifications,
  markNotificationRead,
  printProfile
} from '../controllers/user.controller';
import { authenticateToken } from '../lib/auth.middleware';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'E:/storage/mm');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit per file

const router = Router();

// Search users
router.get('/search', searchUsers);
router.get('/advanced-search', authenticateToken, advancedSearch);
router.get('/free-search', freeSearch);

// Logged-in User Routes
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.post('/change-password', authenticateToken, changePassword);
router.get('/me/viewed-profiles', authenticateToken, getViewedProfiles);
router.post('/view-profile/:id', authenticateToken, viewProfile);
router.post('/print-profile/:id', authenticateToken, printProfile);
router.get('/public-profile/:id', authenticateToken, getPublicProfile);

// Likes & Notifications
router.post('/me/like/:id', authenticateToken, likeProfile);
router.get('/me/liked-profiles', authenticateToken, getLikedProfiles);
router.get('/me/likes-received', authenticateToken, getLikesReceived);
router.get('/me/notifications', authenticateToken, getNotifications);
router.put('/me/notifications/:id/read', authenticateToken, markNotificationRead);

// User Management CRUD
router.get('/vip', getVipUsers);
router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/approve', approveUser);
router.put('/:id/toggle-active', toggleUserStatus);
router.put('/:id/toggle-vip', toggleVipStatus);
router.delete('/:id', deleteUser);

// Upload photos
router.post('/upload-photos', upload.array('photos', 3), uploadPhotos);

export default router;
