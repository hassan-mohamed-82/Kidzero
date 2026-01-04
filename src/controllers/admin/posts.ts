import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../models/db";
import { posts, postsCategory, postsImages } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { eq } from "drizzle-orm";
import { NotFound, ConflictError } from "../../Errors";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";

// Categories
export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  const categoryId = uuidv4();

  await db.insert(postsCategory).values({ id: categoryId, name });

  SuccessResponse(res, { message: "Category created", categoryId }, 201);
};

export const getAllCategories = async (req: Request, res: Response) => {
  const Categories = await db.select().from(postsCategory);
  SuccessResponse(res, { categories: Categories }, 200);
};

export const getCategory = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [category] = await db
    .select()
    .from(postsCategory)
    .where(eq(postsCategory.id, id));
  if (!category) throw new NotFound("Category not found");
  SuccessResponse(res, { category }, 200);
};

export const updateCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  const id = req.params.id;
  const [existingCategory] = await db
    .select()
    .from(postsCategory)
    .where(eq(postsCategory.id, id));
  if (!existingCategory) throw new NotFound("Category not found");

  await db.update(postsCategory).set({ name }).where(eq(postsCategory.id, id));
  SuccessResponse(res, { message: "Category updated" }, 200);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id;
  const [existingCategory] = await db
    .select()
    .from(postsCategory)
    .where(eq(postsCategory.id, id));
  if (!existingCategory) throw new NotFound("Category not found");

  await db.delete(postsCategory).where(eq(postsCategory.id, id));
  SuccessResponse(res, { message: "Category deleted" }, 200);
};

// Posts
export const createPost = async (req: Request, res: Response) => {
  const { title, categoryId, images } = req.body;
  const postId = uuidv4();

  await db.insert(posts).values({
    id: postId,
    title,
    categoryId,
    createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
  });

  if (images !== undefined && Object.keys(images).length > 0) {
    images.forEach(async (imagePath: any) => {
      const imageId = uuidv4();
      await db.insert(postsImages).values({
        id: imageId,
        postId: postId,
        imagePath: await saveBase64Image(imagePath, imageId, req, "posts"),
      });
    });
  }

  SuccessResponse(res, { message: "Post created", postId }, 201);
};

export const getAllPosts = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(posts)
    .leftJoin(postsImages, eq(posts.id, postsImages.postId))
    .leftJoin(postsCategory, eq(posts.categoryId, postsCategory.id)) // JOIN categories
    .orderBy(posts.createdAt);

  const groupedPosts = data.reduce((acc: any[], curr: any) => {
    const post = curr.posts;
    const image = curr.posts_images?.imagePath || null;
    const categoryName = curr.posts_category?.name || null; // get name

    const existing = acc.find((p) => p.id === post.id);

    if (existing) {
      if (image) existing.images.push(image);
    } else {
      acc.push({
        id: post.id,
        title: post.title,
        category: categoryName, // use name instead of id
        images: image ? [image] : [],
      });
    }

    return acc;
  }, []);

  SuccessResponse(res, { posts: groupedPosts }, 200);
};

export const getPost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));

  if (!post) throw new NotFound("Post not found");
  const images = await db
    .select()
    .from(postsImages)
    .where(eq(postsImages.postId, postId));
  SuccessResponse(res, { post, images }, 200);
};

export const updatePost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const { title, categoryId, images } = req.body;

  // Check if post exists
  const [existingPost] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId));
  if (!existingPost) throw new NotFound("Post not found");

  await db.transaction(async (tx) => {
    // Update title and category
    await tx
      .update(posts)
      .set({ title, categoryId })
      .where(eq(posts.id, postId));

    if (Array.isArray(images)) {
      // 1. Delete images that have { id, imagePath }
      const deletions = images.filter(
        (img: any) =>
          img.id && img.imagePath && !img.imagePath.startsWith("data:")
      );

      for (const img of deletions) {
        const success = await deletePhotoFromServer(
          new URL(img.imagePath).pathname
        );
        if (!success) {
          throw new ConflictError("Failed to delete post image from server");
        }
        await tx.delete(postsImages).where(eq(postsImages.id, img.id));
      }

      // 2. Add new base64 images (no id)
      const additions = images.filter(
        (img: any) =>
          !img.id && img.imagePath && img.imagePath.startsWith("data:")
      );

      for (const img of additions) {
        const imageId = uuidv4();
        const savedPath = await saveBase64Image(
          img.imagePath,
          imageId,
          req,
          "posts"
        );
        await tx.insert(postsImages).values({
          id: imageId,
          postId,
          imagePath: savedPath,
        });
      }
    }
  });

  SuccessResponse(res, { message: "Post updated" }, 200);
};

export const deletePost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const [existingPost] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId));
  if (!existingPost) throw new NotFound("Post not found");
  const images = await db
    .select()
    .from(postsImages)
    .where(eq(postsImages.postId, postId));
  if (images && images.length > 0) {
    images.forEach(async (img) => {
      const deleted = await deletePhotoFromServer(
        new URL(img.imagePath).pathname
      );
      if (!deleted)
        throw new ConflictError("Failed to delete post image from server");
    });
  }
  await db.delete(postsImages).where(eq(postsImages.id, postId));
  await db.delete(posts).where(eq(posts.id, postId));
  SuccessResponse(res, { message: "Post deleted" }, 200);
};
