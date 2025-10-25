import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectMongoDB } from "./connection.js";
import UserRouter from "./routes/user.js"
import bookRouter from './routes/bookRouter.js'
import authRouter from './routes/authRouter.js'
import paymentRouter from './routes/paymentRouter.js'
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 8000;

try {
  await connectMongoDB(process.env.MONGODB_URL);
  console.log("Database Connect");
} catch (err) {
  console.error("Error while connecting the Database", err);
  process.exit(1); 
}

app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

app.get('/health',(req,res)=>{ return res.json({message:'server is healty'})})
app.use("/auth",authRouter)
app.use("/api/user",UserRouter)
app.use("/api/book",bookRouter)
app.use("/api/payment",paymentRouter)

app.listen(PORT, () => console.log("Server Started..." , PORT))
