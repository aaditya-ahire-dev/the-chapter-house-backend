import User from "../model/user.js";
import redis from '../services/redisServices.js';

export async function getAllUsers(req, res) {
  const cacheUsers = await redis.get("accounts:allUsers")
  if(cacheUsers){
    const users = JSON.parse(cacheUsers)
    return res.status(200).json({message:"got the user (from cache)" , users,success:true})
  }
  const users = await User.find({role:"user"});
  await redis.set("accounts:allUsers",JSON.stringify(users))
  return res.status(200).json({message:"got the user database" , users,success:true})
}
export async function getAllAdmins(req, res) {
  const cacheAdmins = await redis.get("accounts:allAdmins")
  if(cacheAdmins){
    const admins = JSON.parse(cacheAdmins)
    return res.status(200).json({message:"got the admins (from cache)" , admins,success:true})
  }
  const admins = await User.find({role:"admin"});
  await redis.set("accounts:allAdmins",JSON.stringify(admins))
  return res.status(200).json({message:"got the admins database" , admins,success:true})
}

export async function getUserById(req, res) {
  try {
    const userId = req.params?.id;
    if(!userId){
      const error = new Error("needed the Id")
      const statusCode = 401
      throw error
    }
    const cacheuser = await redis.get(`user:Id:${userId}`)
    if(cacheuser){
      const user = JSON.parse(cacheuser)
      return res.status(200).json({message:"got the user (from cache)" ,user,success:true})

    }
    const user = await User.findOne({_id:userId});
    if(!user){
     return res.status(404).json({message:"user not exist" ,success:false})
    }
    await redis.set(`user:Id:${userId}`,JSON.stringify(user))
    return res.status(200).json({message:"got the user database" , user,success:true})
  } catch (error) {
    return res.status(error.statusCode || 500).json({message:error.message,success:false})
  }
}

export async function updateUser(req, res) {
  const id = req.params.id;
  if(!id){
    const error = new Error("needed the Id")
    const statusCode = 401
    throw error
  }
  const { name, email } = req.body;
  if (!id) {
    return res.json({ mess: "user ID could not get" });
  }

  const user = await User.findOneAndUpdate(
    { _id: id },
    { name, email }
  );
  if (!user) {
    return res.status(404).json({ message: "user not found" ,success:false});
  }
  const cacheus = await redis.get(`user:Id:${id}`)

  await redis.del(`user:email:${user.email}`)
  await redis.del(`user:Id:${user._id}`)
  await redis.del("accounts:allUsers")
  res.cookie(user.role == "user" ? "token" :"admin_token","", {
    httpOnly: true,
    expires: new Date(0), // Set expiry to a past date
    path: '/', // IMPORTANT: Path must match the path of the original cookie
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ mess: "Users got Updated", updateUser , success:true});
}

export async function deleteUser(req, res) {
  const id = req.params.id;
  if (!id) {
    return res.json({ mess: "user ID could not get" });
  }

  const deletedUser = await User.findOneAndDelete({ _id: id });
  if (!deletedUser) {
    return res.json({ mess: "user not found" });
  }
  await redis.del(`user:email:${deletedUser.email}`)
  await redis.del(`user:Id:${deletedUser._id}`)
  await redis.del("accounts:allUsers")
  return res.status(200).json({ mess: "Users got deleted", deletedUser });
}


export async function changeBookStatus(req,res) {
  try {
    const {buyedBookEntryId , newStatus }= req.body
    const userId = req.user.uid
    if (!buyedBookEntryId || !newStatus) {
      return res.status(400).json({ message: "Entry ID and new status are required." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { "buyedBooks.$[element].bookStatus": newStatus } },
      {
        arrayFilters: [{ "element._id": buyedBookEntryId }],
        new: true,
      }
    );

    if (!updatedUser) {
      const error = new Error("user not found")
      error.statusCode = 404
      throw error
    }

    await redis.del(`userOwnedBooks:${req.user.email}`)
    await redis.del(`userBoughtBookById:${req.user.email}-${buyedBookEntryId}`)

    return res.status(200).json({message:"updated the status",success:true})


  } catch (error) {
    return res.status(error.statusCode || 500).json({message:error.message || "Server Error",success:false})
  }
}
