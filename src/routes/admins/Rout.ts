import { Router } from "express";
import { getAllRoutes, getRouteById, createRoute, deleteRouteById, updateRouteById } from "../../controllers/admin/Rout";

const router = Router();

router.get("/", getAllRoutes);
router.post("/", createRoute);
router.get("/:id", getRouteById);
router.delete("/:id", deleteRouteById);
router.put("/:id", updateRouteById);

export default router;