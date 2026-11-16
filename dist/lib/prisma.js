"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_mjs_1 = __importDefault(require("../service.mjs"));
const { db } = service_mjs_1.default.load();
exports.default = db.client;
