import {config} from "@repo/backend-common";
import {client} from "@repo/db";
import jwt from "jsonwebtoken";
import {WebSocketServer,WebSocket} from "ws";

const wss=new WebSocketServer({port:config.WS_PORT});

type User={
    ws:WebSocket,
    room:string[],
    userId:string
}

const users:User[]=[];
const checkUser=(token:string):string | null=>{
    try {
        const decoded=jwt.verify(token,config.SECRET_KEY);
        if(typeof decoded=="string"|| !decoded.userId) return null;
        return decoded.userId; 
        
    } catch (error) {
        return null;
    }

}


wss.on('connection',function connection(ws,req){
    const url=req.url;
    if(!url)return;
    const queryParams=new URLSearchParams(url?.split("?")[1])
    const token=queryParams.get("token")||"";
    const userId=checkUser(token); 
    if(userId==null){
        ws.close();
        return;
    }
    users.push({
        userId,
        room:[],
        ws
    });

    ws.on('message',async function message(data:any){
        let parseData;
        if(typeof data !=="stirng"){
            parseData=JSON.parse(data.toString());
        }
        else{
            parseData=JSON.parse(data);
        }

        if (parseData.type=='join_room'){
            const user=users.find(x=>x.ws===ws);
            user?.room?.push(parseData.roomId);
        }

        if (parseData.type=="leave_room"){
            const user=users.find(x=>x.ws==ws);
            if(!user)return;
            user.room=user.room.filter(room=>room!==parseData.roomId);
        }
        if(parseData.type==="chat"){
            const roomId=parseData.roomId;
            const message=parseData.message;
            await client.chat.create({
                data:{
                    roomId,
                    message,
                    userId
                }
            });
            users.forEach(user=>{
                if(user.room.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        userId: roomId
                    }));
                }
            });
        }
    })
    

})