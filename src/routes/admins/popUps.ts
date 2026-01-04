import { Router } from "express";
import {
  createPopUp,
  deletePopUp,
  updatePopUp,
  getAllPopUps,
  getPopUpById,
  getAllAppPages,
  createAppPage,
  updateAppPage,
  deleteAppPage,
  getAppPageById,
} from "../../controllers/admin/popUps";
import { validate } from "../../middlewares/validation";
import { catchAsync } from "../../utils/catchAsync";
import {
  createPopUpSchema,
  updatePopUpSchema,
} from "../../validators/admin/popUps";
const router = Router();
router
  .route("/Apppages")
  .get(catchAsync(getAllAppPages))
  .post(catchAsync(createAppPage));
router
  .route("/Apppages/:id")
  .put(catchAsync(updateAppPage))
  .delete(catchAsync(deleteAppPage))
  .get(catchAsync(getAppPageById));
router
  .route("/")
  .post(validate(createPopUpSchema), catchAsync(createPopUp))
  .get(catchAsync(getAllPopUps));

router
  .route("/:id")
  .get(catchAsync(getPopUpById))
  .delete(catchAsync(deletePopUp))
  .put(validate(updatePopUpSchema), catchAsync(updatePopUp));

export default router;
