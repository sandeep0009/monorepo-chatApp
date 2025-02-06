import express from "express";
import router from "./router";
import dotenv from "dotenv";


dotenv.config();
const app=express();
const port=3000;
app.use(express.json());
app.use(router);
app.listen(port);
