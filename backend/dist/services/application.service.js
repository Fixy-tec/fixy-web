"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplications = getApplications;
exports.createApplication = createApplication;
const prisma_1 = __importDefault(require("../prisma"));
async function getApplications() {
    return prisma_1.default.application.findMany({
        include: {
            applicant: true,
            request: true,
        },
    });
}
async function createApplication(data) {
    return prisma_1.default.application.create({
        data,
    });
}
