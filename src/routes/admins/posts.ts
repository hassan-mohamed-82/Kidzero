import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPost,
} from "../../controllers/admin/posts";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();
router
  .route("/categories")
  .get(catchAsync(getAllCategories))
  .post(catchAsync(createCategory));
router
  .route("/categories/:id")
  .get(catchAsync(getCategory))
  .put(catchAsync(updateCategory))
  .delete(catchAsync(deleteCategory));

router.route("/").get(catchAsync(getAllPosts)).post(catchAsync(createPost));
router
  .route("/:id")
  .get(catchAsync(getPost))
  .delete(catchAsync(deletePost))
  .put(catchAsync(updatePost));
export default router;
