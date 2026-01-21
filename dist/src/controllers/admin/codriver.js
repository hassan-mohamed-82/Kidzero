"use strict";
// src/controllers/admin/codriverController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCodriver = exports.updateCodriver = exports.getCodriverById = exports.getAllCodrivers = exports.createCodriver = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
// ✅ Create Codriver
const createCodriver = async (req, res) => {
    const { name, phone, email, password, avatar, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingCodriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.eq)(schema_1.codrivers.phone, phone))
        .limit(1);
    if (existingCodriver[0]) {
        throw new BadRequest_1.BadRequest("Phone number already registered");
    }
    const codriverId = (0, uuid_1.v4)();
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    let avatarUrl = null;
    let nationalIdImageUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `codrivers/${codriverId}`);
        avatarUrl = result.url;
    }
    if (nationalIdImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `codrivers/${codriverId}`);
        nationalIdImageUrl = result.url;
    }
    await db_1.db.insert(schema_1.codrivers).values({
        id: codriverId,
        organizationId,
        email,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        nationalId: nationalId || null,
        nationalIdImage: nationalIdImageUrl,
    });
    (0, response_1.SuccessResponse)(res, { message: "Codriver created successfully", codriverId }, 201);
};
exports.createCodriver = createCodriver;
// ✅ Get All Codrivers
const getAllCodrivers = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allCodrivers = await db_1.db
        .select({
        id: schema_1.codrivers.id,
        name: schema_1.codrivers.name,
        phone: schema_1.codrivers.phone,
        avatar: schema_1.codrivers.avatar,
        email: schema_1.codrivers.email,
        nationalId: schema_1.codrivers.nationalId,
        nationalIdImage: schema_1.codrivers.nationalIdImage,
        status: schema_1.codrivers.status,
        createdAt: schema_1.codrivers.createdAt,
        updatedAt: schema_1.codrivers.updatedAt,
    })
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { codrivers: allCodrivers }, 200);
};
exports.getAllCodrivers = getAllCodrivers;
// ✅ Get Codriver By ID
const getCodriverById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const codriver = await db_1.db
        .select({
        id: schema_1.codrivers.id,
        name: schema_1.codrivers.name,
        phone: schema_1.codrivers.phone,
        avatar: schema_1.codrivers.avatar,
        email: schema_1.codrivers.email,
        nationalId: schema_1.codrivers.nationalId,
        nationalIdImage: schema_1.codrivers.nationalIdImage,
        status: schema_1.codrivers.status,
        createdAt: schema_1.codrivers.createdAt,
        updatedAt: schema_1.codrivers.updatedAt,
    })
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, id), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId)))
        .limit(1);
    if (!codriver[0]) {
        throw new NotFound_1.NotFound("Codriver not found");
    }
    (0, response_1.SuccessResponse)(res, { codriver: codriver[0] }, 200);
};
exports.getCodriverById = getCodriverById;
// ✅ Update Codriver
const updateCodriver = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, password, avatar, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingCodriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, id), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId)))
        .limit(1);
    if (!existingCodriver[0]) {
        throw new NotFound_1.NotFound("Codriver not found");
    }
    if (phone && phone !== existingCodriver[0].phone) {
        const phoneExists = await db_1.db
            .select()
            .from(schema_1.codrivers)
            .where((0, drizzle_orm_1.eq)(schema_1.codrivers.phone, phone))
            .limit(1);
        if (phoneExists[0]) {
            throw new BadRequest_1.BadRequest("Phone number already registered");
        }
    }
    let hashedPassword = existingCodriver[0].password;
    if (password) {
        hashedPassword = await bcrypt_1.default.hash(password, 10);
    }
    let avatarUrl = existingCodriver[0].avatar;
    if (avatar !== undefined) {
        if (existingCodriver[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingCodriver[0].avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `codrivers/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    let nationalIdImageUrl = existingCodriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingCodriver[0].nationalIdImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingCodriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `codrivers/${id}`);
            nationalIdImageUrl = result.url;
        }
        else {
            nationalIdImageUrl = null;
        }
    }
    await db_1.db.update(schema_1.codrivers).set({
        name: name ?? existingCodriver[0].name,
        phone: phone ?? existingCodriver[0].phone,
        email: email ?? existingCodriver[0].email,
        password: hashedPassword,
        avatar: avatarUrl,
        nationalId: nationalId !== undefined ? nationalId : existingCodriver[0].nationalId,
        nationalIdImage: nationalIdImageUrl,
        status: status ?? existingCodriver[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.codrivers.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Codriver updated successfully" }, 200);
};
exports.updateCodriver = updateCodriver;
// ✅ Delete Codriver
const deleteCodriver = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingCodriver = await db_1.db
        .select()
        .from(schema_1.codrivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.codrivers.id, id), (0, drizzle_orm_1.eq)(schema_1.codrivers.organizationId, organizationId)))
        .limit(1);
    if (!existingCodriver[0]) {
        throw new NotFound_1.NotFound("Codriver not found");
    }
    if (existingCodriver[0].avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingCodriver[0].avatar);
    }
    if (existingCodriver[0].nationalIdImage) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingCodriver[0].nationalIdImage);
    }
    await db_1.db.delete(schema_1.codrivers).where((0, drizzle_orm_1.eq)(schema_1.codrivers.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Codriver deleted successfully" }, 200);
};
exports.deleteCodriver = deleteCodriver;
