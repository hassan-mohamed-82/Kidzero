import { Router } from "express";
import { getMyInvoices } from "../../controllers/admin/Invoice";
import { catchAsync } from "../../utils/catchAsync";
import { checkPermission } from "../../middlewares/checkpermission";
const router = Router();

router.get("/",checkPermission("invoices","View"), catchAsync(getMyInvoices));

export default router;
