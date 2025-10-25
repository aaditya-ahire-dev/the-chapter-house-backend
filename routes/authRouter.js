import express from 'express';
import {checkAuth} from '../middlewares/authMiddleware.js'
import {login,signOut,signup,createProfile, adminLogin, adminSignup } from '../controllers/authController.js'

const router = express.Router();


router.post("/login", login)
router.post("/signup", signup)
// router.post("/resetPasswordOtp", resetPasswordOtp)
// router.patch("/verify-otp-and-reset-password", verifyOTPandresetPassword)

router.post("/admin/login", adminLogin)
router.post("/admin/signup", adminSignup)
router.post("/create-profile", createProfile)
router.post("/signOut",checkAuth, signOut)

export default router