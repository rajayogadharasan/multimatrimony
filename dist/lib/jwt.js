"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
const service_mjs_1 = __importDefault(require("../service.mjs"));
const { jwtSecret } = service_mjs_1.default.input();
exports.JWT_SECRET = jwtSecret.expose();
