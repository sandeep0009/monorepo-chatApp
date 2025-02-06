import { Router } from "express";
import argon2 from "argon2";
import {client} from "@repo/db/client";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import { JWT_KEY } from "../config";
import jwt from "jsonwebtoken";
import { auth, CustomRequest } from "../middleware/auth";
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

router.post('/room',async(req:CustomRequest,res)=>{
    try {
        const parseData=CreateRoomSchema.safeParse(req.body);
        if(!parseData.success){
            res.status(401).json({message:"error in data you are sending"});
            return;
        }
        const userId=req.userId;
        if(!userId){
            res.status(403).json({
                message : "Unauthorized"
            })
            return;
        }
        const room = await client.room.create({
            data:{
                slug: parseData.data.name,
                adminId: userId
            }
        })
        res.json({
            roomId: room.id
        })
        
    } catch (error) {
        console.log("error in room creation",error);
        
    }
});



router.get('/chats/:roomId',auth,async(req,res)=>{
    try {
        const roomId=Number(req.body.roomId);
        const messages=await client.chats.findMany({
            where:{
                roomId
            },
            orderBy:{
                id:"desc"
            },
            take:50
        })
        res.json({
            messages: messages
        })
        
    } catch (error) {
        console.log("error in fetching chats",error);
        res.status(411).json({
            message:[]
        })
        
    }

});


router.get('/room/:slug',auth,async(req,res)=>{
    try {
        const slug=req.params.slug;
        const room=await client.findFirst({
            where: {slug}
        });
        res.json({
            message: room
        })
        
    } catch (error) {
        res.status(411).json({
            message: "Error getting slug"
        })
        
    }
})

export default router;







