import User from "../model/user.js";
import {decodeUser} from "../services/jwtService.js"
import admin from "../config/firebase-admin.js";


// export async function checkAuth(req,res,next) {
//     try {
//         const id = req.cookies?.token;
//         if(!id){
//             const error = new Error("token is missing")
//             error.statusCode = 401
//             throw error
//         }
//         const decodedUser = decodeUser(id)
//         req.user = decodedUser
//         next()
//     } catch (error) {
//         return res.status(error.statusCode || 500).json({message:error.message,success:false})
//     }
// }


export async function checkAuth(req, res, next) {
    const sessionCookie = req.cookies.session || req.cookies.admin_session ||'';

    if (!sessionCookie) {
        return res.status(401).json({ message: 'Not authorized, no session cookie' });
    }

    try {
        const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
      
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Not authorized, session cookie invalid' });
    }
}