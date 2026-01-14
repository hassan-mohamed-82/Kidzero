// import { Router } from "express";
// import { getMySubscriptions ,getSubscriptionById,getAvailablePlans,getPaymentMethods,upgradeSubscription,subscribe
//    , renewSubscription
// } from "../../controllers/admin/subscribtion";
// import { catchAsync } from "../../utils/catchAsync";
// const router = Router();

// // ✅ GET Routes
// router.get("/", catchAsync(getMySubscriptions));

// router.get("/plans", catchAsync(getAvailablePlans));
// router.get("/payment-methods", catchAsync(getPaymentMethods));
// router.get("/:id", catchAsync(getSubscriptionById));

// // ✅ POST Routes
// router.post("/subscribe", catchAsync(subscribe));
// router.post("/renew", catchAsync(renewSubscription));
// router.post("/upgrade", catchAsync(upgradeSubscription));
// export default router;