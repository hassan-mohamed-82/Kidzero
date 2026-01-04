// // src/middlewares/checkPermission.ts

// import { Request, Response, NextFunction } from "express";
// import { db } from "../models/db";
// import { users, roles } from "../models/superadmin/superadmin";
// import { eq } from "drizzle-orm";
// import { ModuleName, ActionName } from "../types/constant";

// type Permission = {
//   module: string;
//   actions: string[];
// };

// export const checkPermission = (module: ModuleName, action: ActionName) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.user?.id;
      
//       // جيب اليوزر مع الـ Role
//       const user = await db.query.users.findFirst({
//         where: eq(users.id, userId),
//         with: {
//           role: true,
//         },
//       });

//       if (!user) {
//         return res.status(401).json({ message: "غير مصرح" });
//       }

//       // 1. أولاً شيك على صلاحيات اليوزر الخاصة (override)
//       const userPermissions = user.permissions as Permission[];
//       const userModulePermission = userPermissions?.find(p => p.module === module);
      
//       if (userModulePermission?.actions.includes(action)) {
//         return next();
//       }

//       // 2. لو مفيش، شيك على صلاحيات الـ Role
//       const rolePermissions = user.role?.permissions as Permission[];
//       const roleModulePermission = rolePermissions?.find(p => p.module === module);
      
//       if (roleModulePermission?.actions.includes(action)) {
//         return next();
//       }

//       return res.status(403).json({ message: "ليس لديك صلاحية لهذا الإجراء" });
      
//     } catch (error) {
//       return res.status(500).json({ message: "خطأ في السيرفر" });
//     }
//   };
// };
