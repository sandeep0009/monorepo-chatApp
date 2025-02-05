import { Router } from "express";
import argon2 from "argon2";
import {client} from "@repo/db/client";
import {CreateUserSchema, SigninSchema} from "@repo/common/types";
import { JWT_KEY } from "../config";
import jwt from "jsonwebtoken";
const router:Router=Router();

router.post('/signin',async(req,res)=>{
    try {
        const parseData=await CreateUserSchema.safeParse(req.body);
        if(!parseData.success){
            res.status(401).json({message:"error in data you are sending"});
            return;
        }
        const hashedPassword=await argon2.hash(parseData.data.password);
        const createUser= await client.user.create({
            data:{
                email: parseData.data.username,
                password: hashedPassword,
                name: parseData.data.username
            }

        })
        res.json({
            userId: createUser.id
        })
        
    } catch (error) {
        console.log("error in signin logic",error);
        
    }
});

router.post('/signup',async(req,res)=>{
    try {
        const parseData=await SigninSchema.safeParse(req.body);
        if(!parseData.success){
            res.status(401).json({message:"error in data you are sending"});
            return;
        }
        const userExist=await client.user.findFirst({
            where:{
                email:parseData.data.username
            }
        });

        if(!userExist){
            res.status(401).json({
                message: "User not found, invalid"
            })
        }
        const isValidPassword=await argon2.verify(userExist.password, parseData.data.password);

        if(isValidPassword){
            const token=jwt.sign({
                userId: userExist.id
            }, JWT_KEY)
            res.json({
                token: token
            })
        }else{
            res.status(401).json({
                message : "Invalid credentials, password not correct"
            })
        }
        
    } catch (error) {
        console.log("error in signup ",error);
        
    }
});

export default router;







