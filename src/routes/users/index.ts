import { authenticated } from "../../middlewares/authenticated";
import { authorizeRoles } from "../../middlewares/authorized";
import VotesRoute from "./votes";
import SlidersRoute from "./sliders";
import PopUpsRoute from "./popUps";
import PostsRoute from "./posts";
import ProfileRoute from "./Profile";
import AuthRoute from "./auth";
import ComplaintsRoute from "./complaints";
import CompetitionsRoute from "./competitions";
import notificationRoute from "./Notification";
import BannerRouter from "./Banner";
import memberRouter from "./member";
import birthdayRouter  from "./checkBirthday";
import { Router } from "express";
import multer from "multer";
const upload = multer();
const route = Router();
route.use(upload.none());
route.use("/auth", AuthRoute);
route.use(
  authenticated,
  authorizeRoles("approved_member_user", "approved_guest_user")
);
route.use("/popups", PopUpsRoute);
route.use("/sliders", SlidersRoute);
route.use("/complaints", ComplaintsRoute);
route.use("/votes", VotesRoute);
route.use("/posts", PostsRoute);
route.use("/profile", ProfileRoute);
route.use("/complaints", ComplaintsRoute);
route.use("/competitions", CompetitionsRoute);
route.use("/notifications",notificationRoute); // Assuming Notification.ts is in the same directory
route.use("/birthday", birthdayRouter); // Assuming checkBirthday.ts is in the same directory
route.use("/banners", BannerRouter);
route.use("/members", memberRouter);
export default route;
