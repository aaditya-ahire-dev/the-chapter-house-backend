import express from "express";
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import {checkAuth} from "../middlewares/authMiddleware.js"
import {getAllbooks , getBookById,uploadBook,downloadBook,getbooksAnduserLength,getRatingDoneByUserToSpecificBook ,rateBook ,updateBook ,deleteBook ,buyBook , getUsersAllBooks,getBuyedBookById} from '../controllers/bookController.js'
const router = express.Router();

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/images'); 
//     },
//     filename: function (req, file, cb) {
//         crypto.randomBytes(16, (err, buf) => {
//             if (err) {
//                 return cb(err);
//             }
//             const uniqueSuffix = buf.toString('hex');
//             const filename = uniqueSuffix + path.extname(file.originalname);
//             cb(null, filename);
//         });
//     }
// });

const storage = multer.memoryStorage()

const upload = multer({ storage: storage });



router.get("/getbooks", getAllbooks)
router.get("/getbooks/:id", getBookById)
router.get("/buybook/:id",checkAuth, buyBook)
router.get("/buybookbyid/:id",checkAuth, getBuyedBookById)
router.get("/usersallbook",checkAuth, getUsersAllBooks)
router.get("/getrating/:id",checkAuth, getRatingDoneByUserToSpecificBook)
router.get("/downloadbook/:id",checkAuth, downloadBook)
router.get("/getlength",checkAuth, getbooksAnduserLength)

router.post("/uploadbook",upload.fields([{ name: 'coverImage', maxCount: 1 },{ name: 'fileUrl', maxCount: 1 }]), uploadBook)

router.put("/updatebook/:id",upload.fields([{ name: 'coverImage', maxCount: 1 },{ name: 'fileUrl', maxCount: 1 }]),updateBook)
router.post("/ratebook/:id",checkAuth,rateBook)

router.delete("/deletebook/:id",deleteBook)


export default router