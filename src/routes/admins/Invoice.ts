import { Router } from "express";
import { getMyInvoices } from "../../controllers/admin/Invoice";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

router.get("/", catchAsync(getMyInvoices));

export default router;
