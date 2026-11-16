"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const service_mjs_1 = __importDefault(require("./service.mjs"));
const app = (0, express_1.default)();
const port = service_mjs_1.default.port();
const masterData_routes_1 = __importDefault(require("./routes/masterData.routes"));
const plan_routes_1 = __importDefault(require("./routes/plan.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Serve static files from uploads folder
app.use('/uploads', express_1.default.static('E:/storage/mm'));
// Routes
app.use('/api/master-data', masterData_routes_1.default);
app.use('/api/plans', plan_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Matrimony API is running smoothly!',
        timestamp: new Date().toISOString()
    });
});
// Basic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});
// Start Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
