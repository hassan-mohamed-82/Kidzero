import { Router } from "express";
import {
  getAllComplaintsCategory,
  getComplaintsCategory,
  updateComplaintsCategory,
  deleteComplaintsCategory,
  createComplaintsCategory,
} from "../../controllers/admin/complaints";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../validators/admin/complaints";
import { validate } from "../../middlewares/validation";
const router = Router();

router
  .route("/")
  .get(getAllComplaintsCategory)
  .post(validate(createCategorySchema), createComplaintsCategory);
router
  .route("/:id")
  .get(getComplaintsCategory)
  .put(validate(updateCategorySchema), updateComplaintsCategory)
  .delete(deleteComplaintsCategory);

export default router;
