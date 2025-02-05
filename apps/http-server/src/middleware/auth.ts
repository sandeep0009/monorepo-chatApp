import jwt from "jsonwebtoken"
import { NextFunction, Request, Response } from "express"
import { JWT_KEY } from "../config";


export interface CustomRequest extends Request{
    userId?: string
}

export const auth=(req: CustomRequest, res: Response, next: NextFunction)=>{
    const token=req.headers.authorization;
    if(!token){
        res.status(401).json({
            message: "Unauthorized"
        })
        return;
    }

    const decoded=jwt.verify(token, JWT_KEY) as CustomRequest;
    if(decoded){
        req.userId=decoded.userId;
        next();
    }else{
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}