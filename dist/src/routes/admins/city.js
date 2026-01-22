"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_1 = require("../../controllers/admin/city");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const city_2 = require("../../validators/admin/city");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
// ✅ Create City
router.post("/", (0, checkpermission_1.checkPermission)("City", "Add"), (0, validation_1.validate)(city_2.createCitySchema), (0, catchAsync_1.catchAsync)(city_1.createCity));
// ✅ Get All Cities
router.get("/", (0, checkpermission_1.checkPermission)("City", "View"), (0, catchAsync_1.catchAsync)(city_1.getCities));
// ✅ Get All Cities With Zones
// (Must come before /:id to prevent "zones" being treated as an ID)
router.get("/zones", (0, checkpermission_1.checkPermission)("City", "View"), (0, catchAsync_1.catchAsync)(city_1.getCitiesWithZones));
// ✅ Get City By ID
router.get("/:id", (0, checkpermission_1.checkPermission)("City", "View"), (0, catchAsync_1.catchAsync)(city_1.getCityById));
// ✅ Update City
router.put("/:id", (0, checkpermission_1.checkPermission)("City", "Edit"), (0, validation_1.validate)(city_2.updateCitySchema), (0, catchAsync_1.catchAsync)(city_1.updateCity));
// ✅ Delete City
router.delete("/:id", (0, checkpermission_1.checkPermission)("City", "Delete"), (0, catchAsync_1.catchAsync)(city_1.deleteCity));
// ✅ Get City With Zones
router.get("/zones/:id", (0, checkpermission_1.checkPermission)("City", "View"), (0, catchAsync_1.catchAsync)(city_1.getCityWithZones));
exports.default = router;
