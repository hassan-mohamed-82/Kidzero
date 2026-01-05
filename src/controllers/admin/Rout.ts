// import { Request, Response } from "express";
// import { db } from "../../models/db";
// import { SuccessResponse } from "../../utils/response";
// import { BadRequest } from "../../Errors/BadRequest";
// import { Rout } from "../../models/schema";

// export const getAllRoutes = async (req: Request, res: Response) => {
//     const routes = await db.query.rout.findMany();
//     return SuccessResponse(res, { routes }, 200);
// };

// export const getRouteById = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     if (!id) {
//         throw new BadRequest("Please Enter Route Id");
//     }
//     const route = await db.query.routes.findFirst({
//         where: (routes, { eq }) => eq(routes.id, id)
//     });
//     if (!route) {
//         throw new BadRequest("Route not found");
//     }
//     return SuccessResponse(res, { route }, 200);
// };

// export const deleteRouteById = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     if (!id) {
//         throw new BadRequest("Please Enter Route Id");
//     }
//     const selectedRoute = await db.query.routes.findFirst({
//     });
// };