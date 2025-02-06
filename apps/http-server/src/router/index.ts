import { Router } from "express";
import userRouter from "../controller"

const router:Router=Router();


router.use(userRouter);


export default router;