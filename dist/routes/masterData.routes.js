"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const masterData_controller_1 = require("../controllers/masterData.controller");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'E:/storage/mm');
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    }
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = (0, express_1.Router)();
// POST /api/master-data/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
    }
    return res.status(200).json({ filename: req.file.filename });
});
// POST /api/master-data
router.post('/', masterData_controller_1.createMasterData);
// GET /api/master-data/:type
router.get('/:type', masterData_controller_1.getMasterDataByType);
// PUT /api/master-data/:id
router.put('/:id', masterData_controller_1.updateMasterData);
// DELETE /api/master-data/:id
router.delete('/:id', masterData_controller_1.deleteMasterData);
exports.default = router;
