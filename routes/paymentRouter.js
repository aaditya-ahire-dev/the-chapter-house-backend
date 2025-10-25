import express from 'express';
import {checkAuth} from '../middlewares/authMiddleware.js'
import {createOrder,verifyOrderPayment} from "../controllers/paymentController.js"
const router = express.Router();

router.get("/oderPayment/:id",checkAuth,createOrder)
router.post("/verify-order-payment",checkAuth,verifyOrderPayment)
export default router