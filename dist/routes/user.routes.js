"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../lib/auth.middleware");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'E:/storage/mm');
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    }
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit per file
const router = (0, express_1.Router)();
// Search users
router.get('/search', user_controller_1.searchUsers);
router.get('/advanced-search', auth_middleware_1.authenticateToken, user_controller_1.advancedSearch);
router.get('/free-search', user_controller_1.freeSearch);
// Logged-in User Routes
router.get('/me', auth_middleware_1.authenticateToken, user_controller_1.getMe);
router.put('/me', auth_middleware_1.authenticateToken, user_controller_1.updateMe);
router.post('/change-password', auth_middleware_1.authenticateToken, user_controller_1.changePassword);
router.get('/me/viewed-profiles', auth_middleware_1.authenticateToken, user_controller_1.getViewedProfiles);
router.post('/view-profile/:id', auth_middleware_1.authenticateToken, user_controller_1.viewProfile);
router.post('/print-profile/:id', auth_middleware_1.authenticateToken, user_controller_1.printProfile);
router.get('/public-profile/:id', auth_middleware_1.authenticateToken, user_controller_1.getPublicProfile);
// Likes & Notifications
router.post('/me/like/:id', auth_middleware_1.authenticateToken, user_controller_1.likeProfile);
router.get('/me/liked-profiles', auth_middleware_1.authenticateToken, user_controller_1.getLikedProfiles);
router.get('/me/likes-received', auth_middleware_1.authenticateToken, user_controller_1.getLikesReceived);
router.get('/me/notifications', auth_middleware_1.authenticateToken, user_controller_1.getNotifications);
router.put('/me/notifications/:id/read', auth_middleware_1.authenticateToken, user_controller_1.markNotificationRead);
// User Management CRUD
router.get('/vip', user_controller_1.getVipUsers);
router.get('/', user_controller_1.getAllUsers);
router.post('/', user_controller_1.createUser);
router.put('/:id', user_controller_1.updateUser);
router.put('/:id/approve', user_controller_1.approveUser);
router.put('/:id/toggle-active', user_controller_1.toggleUserStatus);
router.put('/:id/toggle-vip', user_controller_1.toggleVipStatus);
router.delete('/:id', user_controller_1.deleteUser);
// Upload photos
router.post('/upload-photos', upload.array('photos', 3), user_controller_1.uploadPhotos);
exports.default = router;
