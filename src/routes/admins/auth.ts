import { Router } from "express";
import { login } from "../../controllers/admin/auth";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { loginSchema } from "../../validators/admin/auth";

const route = Router();

route.post("/login",validate(loginSchema) ,catchAsync(login));
export default route;
