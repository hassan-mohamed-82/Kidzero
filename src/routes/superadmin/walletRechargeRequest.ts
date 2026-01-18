// / src/routes/superAdmin/walletRoutes.ts

import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import {
  getAllRechargeRequests,
  getRechargeRequestById,
  approveRechargeRequest,
  rejectRechargeRequest,
  getWalletStats,
 
} from "../../controllers/superadmin/walletRechargeRequest";

const router = Router();

// ✅ إحصائيات
router.get("/stats", catchAsync(getWalletStats));

// ✅ طلبات الشحن
router.get("/", catchAsync(getAllRechargeRequests));
router.get("/:requestId", catchAsync(getRechargeRequestById));
router.post("/:requestId/approve", catchAsync(approveRechargeRequest));
router.post("/:requestId/reject", catchAsync(rejectRechargeRequest));

export default router;
