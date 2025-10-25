import express from 'express'
import { getAllUsers ,getAllAdmins, changeBookStatus,updateUser ,deleteUser ,getUserById} from "../controllers/userController.js"
const router = express.Router()
import {checkAuth} from "../middlewares/authMiddleware.js"
router.get("/getallusers", getAllUsers);
router.get("/getalladmins", getAllAdmins);
router.get("/getuserbyid/:id", getUserById);


// router.post("/create", createUser);

router.put("/update/book-status",checkAuth, changeBookStatus);
router.put("/update/:id", updateUser);

// router.patch("/update/patch/:id", async (req, res) => {
//   const id = req.params.id;
//   const { name } = req.body;
//   if (!id) {
//     return res.json({ mess: "user ID could not get" });
//   }

//   const updateUser = await User.findOneAndUpdate(
//     { _id: id },
//     { name },
//     { new: true }
//   );
//   if (!updateUser) {
//     return res.json({ mess: "user not found" });
//   }
//   res.json({ mess: "Users got Updated", updateUser });
// });

router.delete("/delete/:id", deleteUser);

export default router;