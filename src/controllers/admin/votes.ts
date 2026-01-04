import { Response, Request } from "express";
import { db } from "../../models/db";
import {
  userVotes,
  userVotesItems,
  votes,
  votesItems,
} from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { v4 as uuidv4 } from "uuid";
import { eq, inArray } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { sql } from "drizzle-orm";

export const getAllVotes = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(votes)
    .leftJoin(votesItems, eq(votes.id, votesItems.voteId))
    .orderBy(votes.createdAt);

  const grouped: Record<string, any> = {};

  for (const row of data) {
    const vote = row.votes;
    const item = row.votes_items;

    if (!grouped[vote.id]) {
      grouped[vote.id] = {
        id: vote.id,
        name: vote.name,
        maxSelections: vote.maxSelections,
        startDate: vote.startDate
          ? new Date(vote.startDate).toISOString().substring(0, 10)
          : null,
        endDate: vote.endDate
          ? new Date(vote.endDate).toISOString().substring(0, 10)
          : null,
        createdAt: vote.createdAt
          ? new Date(vote.createdAt).toISOString().substring(0, 10)
          : null,
        options: [],
        votesCount: 0,
      };
    }

    if (item) {
      grouped[vote.id].options.push({
        id: item.id,
        text: item.item,
      });
      const [{ votesCount }] = await db
        .select({ votesCount: sql<number>`COUNT(*)` })
        .from(userVotes)
        .where(eq(userVotes.voteId, vote.id));
      grouped[vote.id].votesCount = votesCount;
    }
  }

  const result = Object.values(grouped);

  SuccessResponse(res, { votes: result }, 200);
};

export const getVote = async (req: Request, res: Response) => {
  const id = req.params.id;
  const vote = await db.query.votes.findFirst({ where: eq(votes.id, id) });
  if (!vote) {
    throw new NotFound("Vote not found");
  }
  const options = await db
    .select()
    .from(votesItems)
    .where(eq(votesItems.voteId, id));
  const formatVote = {
    ...vote,
    startDate: new Date(vote.startDate).toISOString().substring(0, 10),
    endDate: new Date(vote.endDate).toISOString().substring(0, 10),
    createdAt: new Date(vote.createdAt!).toISOString().substring(0, 10),
  };
  SuccessResponse(res, { vote: { ...formatVote, options } }, 200);
};

export const createVote = async (req: Request, res: Response) => {
  const { name, maxSelections, items, startDate, endDate } = req.body;
  const voteId = uuidv4();
  await db.transaction(async (tx) => {
    await tx.insert(votes).values({
      id: voteId,
      name,
      maxSelections,
      startDate: new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
      endDate: new Date(new Date(endDate).getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
      createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
    });
    if (items) {
      if (items.length) {
        items.forEach(async (item: any) => {
          await tx
            .insert(votesItems)
            .values({
              voteId: voteId,
              item:item,
              id: item.id || uuidv4(),
            })
             });
      }
    }
  });
  SuccessResponse(res, { message: "vote created successfully" }, 201);
};

export const updateVote = async (req: Request, res: Response) => {
  const id = req.params.id;

  const vote = await db.query.votes.findFirst({ where: eq(votes.id, id) });
  if (!vote) throw new NotFound("Vote not found");

  const { name, maxSelection, maxSelections, items, startDate, endDate } = req.body;

  await db.transaction(async (tx) => {
    // Prepare update object
    const updateData: any = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    // Handle maxSelections (accepts both names)
    if (maxSelection !== undefined || maxSelections !== undefined) {
      updateData.maxSelections = maxSelection ?? maxSelections;
    }

    // Handle dates if provided
    if (startDate) {
      updateData.startDate = new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000);
    }
    if (endDate) {
      updateData.endDate = new Date(new Date(endDate).getTime() + 3 * 60 * 60 * 1000);
    }

    // Update vote main data
    if (Object.keys(updateData).length > 0) {
      await tx.update(votes).set(updateData).where(eq(votes.id, id));
    }

    // Handle vote items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (typeof item === "string") {
          // Remove item from vote (unlink)
          await tx.update(votesItems)
            .set({ voteId: null })
            .where(eq(votesItems.id, item));
        } 
        else if (item.id) {
          // Update existing item
          await tx.update(votesItems)
            .set({
              voteId: id,
              item: item.item ?? item.value ?? item.name ?? "",
            })
            .where(eq(votesItems.id, item.id));
        } 
        else {
          // Insert new item
          await tx.insert(votesItems).values({
            voteId: id,
            item: item.item ?? item.value ?? item.name ?? "",
            id: uuidv4(),
          });
        }
      }
    }
  });

  SuccessResponse(res, { message: "Vote updated successfully" }, 200);
};


export const deleteVote = async (req: Request, res: Response) => {
  const id = req.params.id;
  const vote = await db.query.votes.findFirst({ where: eq(votes.id, id) });
  if (!vote) throw new NotFound("Vote not found");
  await db.transaction(async (tx) => {
    await tx
      .update(votesItems)
      .set({ voteId: null })
      .where(eq(votesItems.voteId, id));
    const userVotesList = await tx
      .select({ id: userVotes.id })
      .from(userVotes)
      .where(eq(userVotes.voteId, id));
    const userVoteIds = userVotesList.map((uv) => uv.id);
    if (userVoteIds.length > 0) {
      await tx
        .delete(userVotesItems)
        .where(inArray(userVotesItems.userVoteId, userVoteIds));

      await tx.delete(userVotes).where(eq(userVotes.voteId, id));
    }

    await tx.delete(votes).where(eq(votes.id, id));
  });
  SuccessResponse(res, { message: "vote deleted successfully" }, 200);
};

//options
// export const getAllOptions = async (req: Request, res: Response) => {
//   const options = await db.select().from(votesItems);

//   if (!options.length) {
//     throw new NotFound("No options found");
//   }
//   SuccessResponse(res, { options }, 200);
// };

// export const getOption = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const option = await db.query.votesItems.findFirst({
//     where: eq(votesItems.id, id),
//   });
//   if (!option) throw new NotFound("Option not found");
//   SuccessResponse(res, { option }, 200);
// };

// export const updateOption = async (req: Request, res: Response) => {
//   const { item } = req.body;
//   const id = req.params.id;
//   const [itemV] = await db
//     .select()
//     .from(votesItems)
//     .where(eq(votesItems.id, id));
//   if (!itemV) throw new NotFound("option not found");
//   await db.update(votesItems).set({ item }).where(eq(votesItems.id, id));
//   SuccessResponse(res, { message: "Option Updated Successfully" }, 200);
// };

// export const createOption = async (req: Request, res: Response) => {
//   const { item } = req.body;
//   const id = uuidv4();
//   await db.insert(votesItems).values({ id, item });
//   SuccessResponse(res, { message: "Option Updated Successfully" }, 200);
// };

// export const deleteOption = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const option = await db.query.votesItems.findFirst({
//     where: eq(votesItems.id, id),
//   });
//   if (!option) throw new NotFound("Option not found");
//   await db.delete(votesItems).where(eq(votesItems.id, id));
//   SuccessResponse(res, { message: "option deleted" }, 200);
// };
