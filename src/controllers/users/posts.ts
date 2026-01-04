import { Request, Response } from "express";
import { db } from "../../models/db";
import { posts, postsImages, reacts } from "../../models/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors";
import { v4 as uuidv4 } from "uuid";

const CATEGORY_IDS = {
  cultural: "63b99a53-60b3-11f0-908d-0050564dafeb",
  sport: "63b9af5e-60b3-11f0-908d-0050564dafeb",
  social: "779a5031-60b3-11f0-908d-0050564dafeb", // looks same as social? Check if typo
};

export const getPostsWithReactsByCategory = async (
  req: Request,
  res: Response
) => {
  const { type } = req.params;
  const userId = req.user?.id;

  const categoryId = CATEGORY_IDS[type as keyof typeof CATEGORY_IDS];
  if (!categoryId) throw new NotFound("Category Not Found");

  // Get posts
  const postsData = await db
    .select()
    .from(posts)
    .where(eq(posts.categoryId, categoryId));

  const postIds = postsData.map((p) => p.id);

  // Get all images for these posts
  const images = await db
    .select()
    .from(postsImages)
    .where(inArray(postsImages.postId, postIds));

  // Group images by postId
  const imagesByPost: Record<string, (typeof postsImages.$inferSelect)[]> = {};

  for (const img of images) {
    if (!imagesByPost[img.postId]) imagesByPost[img.postId] = [];
    imagesByPost[img.postId].push(img);
  }

  // Get react counts
  const reactsData = await db
    .select({
      postId: reacts.postId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(reacts)
    .where(inArray(reacts.postId, postIds))
    .groupBy(reacts.postId);

  // Get user reacts
  const userReacts = userId
    ? await db
        .select({ postId: reacts.postId })
        .from(reacts)
        .where(and(inArray(reacts.postId, postIds), eq(reacts.userId, userId)))
    : [];

  const postsWithExtras = postsData.map((post: any) => {
    const postImages = imagesByPost[post.id] || [];
    const reactData = reactsData.find((r) => r.postId === post.id);
    const hasReacted = userReacts.some((r) => r.postId === post.id);

    return {
      ...post,
      images: postImages,
      reactsCount: reactData?.count || 0,
      reacted: hasReacted,
    };
  });

  SuccessResponse(res, { posts: postsWithExtras }, 200);
};

export const reactPost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = req.user!.id;
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new NotFound("Post not found");
  const [liked] = await db
    .select()
    .from(reacts)
    .where(and(eq(reacts.postId, postId), eq(reacts.userId, userId)));
  if (liked)
    await db
      .delete(reacts)
      .where(and(eq(reacts.postId, postId), eq(reacts.userId, userId)));
  else await db.insert(reacts).values({ id: uuidv4(), postId, userId });
  SuccessResponse(res, { messafe: "User Liked Success" }, 200);
};
