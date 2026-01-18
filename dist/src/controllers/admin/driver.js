"use strict";
// src/controllers/admin/driverController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDriver = exports.updateDriver = exports.getDriverById = exports.getAllDrivers = exports.createDriver = void 0;
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
// ✅ Create Driver
const createDriver = async (req, res) => {
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    // Check subscription limit
    //   await checkDriverLimit(organizationId);
    // Check if phone already exists
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
        .limit(1);
    if (existingDriver[0]) {
        throw new BadRequest_1.BadRequest("Phone number already registered");
    }
    const driverId = (0, uuid_1.v4)();
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // Handle images
    let avatarUrl = null;
    let licenseImageUrl = null;
    let nationalIdImageUrl = null;
    if (avatar) {
        const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `drivers/${driverId}`);
        avatarUrl = result.url;
    }
    if (licenseImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, `drivers/${driverId}`);
        licenseImageUrl = result.url;
    }
    if (nationalIdImage) {
        const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `drivers/${driverId}`);
        nationalIdImageUrl = result.url;
    }
    await db_1.db.insert(schema_1.drivers).values({
        id: driverId,
        organizationId,
        email,
        name,
        phone,
        password: hashedPassword,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        licenseImage: licenseImageUrl,
        nationalId: nationalId || null,
        nationalIdImage: nationalIdImageUrl,
    });
    (0, response_1.SuccessResponse)(res, { message: "Driver created successfully", driverId }, 201);
};
exports.createDriver = createDriver;
// ✅ Get All Drivers
const getAllDrivers = async (req, res) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const allDrivers = await db_1.db
        .select({
        id: schema_1.drivers.id,
        name: schema_1.drivers.name,
        phone: schema_1.drivers.phone,
        avatar: schema_1.drivers.avatar,
        licenseExpiry: schema_1.drivers.licenseExpiry,
        licenseImage: schema_1.drivers.licenseImage,
        nationalId: schema_1.drivers.nationalId,
        nationalIdImage: schema_1.drivers.nationalIdImage,
        status: schema_1.drivers.status,
        createdAt: schema_1.drivers.createdAt,
        updatedAt: schema_1.drivers.updatedAt,
    })
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId));
    (0, response_1.SuccessResponse)(res, { drivers: allDrivers }, 200);
};
exports.getAllDrivers = getAllDrivers;
// ✅ Get Driver By ID
const getDriverById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const driver = await db_1.db
        .select({
        id: schema_1.drivers.id,
        name: schema_1.drivers.name,
        phone: schema_1.drivers.phone,
        avatar: schema_1.drivers.avatar,
        licenseExpiry: schema_1.drivers.licenseExpiry,
        licenseImage: schema_1.drivers.licenseImage,
        nationalId: schema_1.drivers.nationalId,
        nationalIdImage: schema_1.drivers.nationalIdImage,
        status: schema_1.drivers.status,
        createdAt: schema_1.drivers.createdAt,
        updatedAt: schema_1.drivers.updatedAt,
    })
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!driver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    (0, response_1.SuccessResponse)(res, { driver: driver[0] }, 200);
};
exports.getDriverById = getDriverById;
// ✅ Update Driver
const updateDriver = async (req, res) => {
    const { id } = req.params;
    const { name, phone, password, email, avatar, licenseExpiry, licenseImage, nationalId, nationalIdImage, status } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!existingDriver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    // Check if phone is being changed and already exists
    if (phone && phone !== existingDriver[0].phone) {
        const phoneExists = await db_1.db
            .select()
            .from(schema_1.drivers)
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.phone, phone))
            .limit(1);
        if (phoneExists[0]) {
            throw new BadRequest_1.BadRequest("Phone number already registered");
        }
    }
    // Handle password
    let hashedPassword = existingDriver[0].password;
    if (password) {
        hashedPassword = await bcrypt_1.default.hash(password, 10);
    }
    // Handle avatar
    let avatarUrl = existingDriver[0].avatar;
    if (avatar !== undefined) {
        if (existingDriver[0].avatar) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].avatar);
        }
        if (avatar) {
            const result = await (0, handleImages_1.saveBase64Image)(req, avatar, `drivers/${id}`);
            avatarUrl = result.url;
        }
        else {
            avatarUrl = null;
        }
    }
    // Handle license image
    let licenseImageUrl = existingDriver[0].licenseImage;
    if (licenseImage !== undefined) {
        if (existingDriver[0].licenseImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].licenseImage);
        }
        if (licenseImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, licenseImage, `drivers/${id}`);
            licenseImageUrl = result.url;
        }
        else {
            licenseImageUrl = null;
        }
    }
    // Handle national ID image
    let nationalIdImageUrl = existingDriver[0].nationalIdImage;
    if (nationalIdImage !== undefined) {
        if (existingDriver[0].nationalIdImage) {
            await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].nationalIdImage);
        }
        if (nationalIdImage) {
            const result = await (0, handleImages_1.saveBase64Image)(req, nationalIdImage, `drivers/${id}`);
            nationalIdImageUrl = result.url;
        }
        else {
            nationalIdImageUrl = null;
        }
    }
    await db_1.db.update(schema_1.drivers).set({
        name: name ?? existingDriver[0].name,
        phone: phone ?? existingDriver[0].phone,
        password: hashedPassword,
        email: email ?? existingDriver[0].email,
        avatar: avatarUrl,
        licenseExpiry: licenseExpiry !== undefined
            ? (licenseExpiry ? new Date(licenseExpiry) : null)
            : existingDriver[0].licenseExpiry,
        licenseImage: licenseImageUrl,
        nationalId: nationalId !== undefined ? nationalId : existingDriver[0].nationalId,
        nationalIdImage: nationalIdImageUrl,
        status: status ?? existingDriver[0].status,
    }).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Driver updated successfully" }, 200);
};
exports.updateDriver = updateDriver;
// ✅ Delete Driver
const deleteDriver = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest_1.BadRequest("Organization ID is required");
    }
    const existingDriver = await db_1.db
        .select()
        .from(schema_1.drivers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.drivers.id, id), (0, drizzle_orm_1.eq)(schema_1.drivers.organizationId, organizationId)))
        .limit(1);
    if (!existingDriver[0]) {
        throw new NotFound_1.NotFound("Driver not found");
    }
    // Delete images
    if (existingDriver[0].avatar) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].avatar);
    }
    if (existingDriver[0].licenseImage) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].licenseImage);
    }
    if (existingDriver[0].nationalIdImage) {
        await (0, deleteImage_1.deletePhotoFromServer)(existingDriver[0].nationalIdImage);
    }
    await db_1.db.delete(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Driver deleted successfully" }, 200);
};
exports.deleteDriver = deleteDriver;
