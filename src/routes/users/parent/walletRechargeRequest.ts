// src/routes/users/parent/wallet.ts

import { Router } from "express";
import { authorizeRoles } from "../../../middlewares/authorized";
import { catchAsync } from "../../../utils/catchAsync";
import {
  getWalletSelection,
  requestRecharge,
  getMyRechargeRequests,
  getChildWallet,
} from "../../../controllers/users/parent/walletRechargeRequest";

const router = Router();

router.use(authorizeRoles("parent"));

// طرق الدفع
router.get("/selection", catchAsync(getWalletSelection));

router.get("/recharge/:childId", catchAsync(getChildWallet));
// طلب شحن
router.post("/recharge", catchAsync(requestRecharge));
// طلباتي
router.get("/requests", catchAsync(getMyRechargeRequests));
// محفظة طفل
router.get("/child/:childId", catchAsync(getChildWallet));

export default router;
