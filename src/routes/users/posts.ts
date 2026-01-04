import { Router } from "express";
import {
  reactPost,
  getPostsWithReactsByCategory,
} from "../../controllers/users/posts";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();
router.get("/:type", catchAsync(getPostsWithReactsByCategory));
router.post("/:id", catchAsync(reactPost));

export default router;
