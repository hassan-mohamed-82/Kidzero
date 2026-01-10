import { Router } from "express";
import superAdminAuthRoute from "./auth";
import PlanRoute from "./plan";
import promocodeRoute from "./promocodes";
import busTypeRoute from "./busTypes";
import {authorizeRoles} from "../../middlewares/authorized"
import { authenticated } from "../../middlewares/authenticated";
import organizationRoute from "./organization";
import profileRoute from "./profile";
import rolesRoute from "./superadminrole";
import subadminRouter from "./subadmins";
import paymentMethodRoute from "./paymentMethod";
import subscriptionRoute from "./subscription";
import invoiceRoute from "./Invoice";
import paymentRoute from "./payment";

const route = Router();
route.use("/auth", superAdminAuthRoute);
route.use(authenticated,authorizeRoles("superadmin","subadmin"));
route.use("/plans", PlanRoute);
route.use("/promocodes", promocodeRoute);
route.use("/bustypes", busTypeRoute);
route.use("/organizations", organizationRoute);
route.use("/profile", profileRoute);
route.use("/subadmins", subadminRouter);
route.use("/roles", rolesRoute);
route.use("/paymentmethods", paymentMethodRoute);
route.use("/subscriptions", subscriptionRoute);
route.use("/invoices", invoiceRoute);
route.use("/payments", paymentRoute);

export default route;                           