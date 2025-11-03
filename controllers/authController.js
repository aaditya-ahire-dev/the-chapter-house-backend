import User from '../model/user.js';
import redis from '../services/redisServices.js';
import admin from '../config/firebase-admin.js';


export async function login(req,res) {
    try {
        const { idToken } = req.body;
        if(!idToken){
          const error = new Error("ID Token not provided.")
          error.statusCode = 401
          throw error
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        let existingUser;
        const cacheUser = await redis.get(`user:email:${decodedToken.email}`)
        if(cacheUser){
          existingUser = JSON.parse(cacheUser)
        }else{
          existingUser = await User.findById(uid);
            if(!existingUser){
                const error = new Error("user not found in mongoDB");
                error.statusCode = 404;
                throw error;
            }
        }
        const expiresIn = 60 * 60 * 24 * 14 * 1000;
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
        const options = { 
          httpOnly: true, 
          sameSite: 'None', 
          secure: true,     
          path:"/",
          maxAge: expiresIn,
       };
        await redis.set(`user:email:${decodedToken.email}`,JSON.stringify(existingUser))
        res.cookie('session', sessionCookie, options);
        res.status(200).json({ message: 'Successfully logged in'  , success:true});

    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message,success:false})
    }
}


export async function signup(req,res) {
  const { idToken , name} = req.body;
  const decodedToken = await admin.auth().verifyIdToken(idToken)
  const {uid , email} = decodedToken
  try {
    const existingUser = await User.findById(uid);
    if (existingUser) {
      return res.status(409).json({ message: "User profile already exists." });
    }

    const newUser = await User.create({
      _id: uid,
      name: name,
      email: email,
    });
    await admin.auth().setCustomUserClaims(uid, { role:"user" });

    res.status(201).json({ message: "User profile created", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error during profile creation." });
  }
}



// export async function resetPasswordOtp(req,res) {
//   try {
//     const {email} = req.body.email;
//     if(!email){
//       const error = new Error("Email Required")
//       error.statusCode = 401
//       throw error
//     }
//     const otp = Math.floor(100000 + Math.random()*900000).toString()
//     await redis.set(`otp:${email}`,otp,"EX",300)
//     const otpurl = await sendEmail(email,otp)
//     return res.json({message:`Send the OTP on ${email}`,url:otpurl})
//   } catch (error) {
//     return res.status(error.statusCode || 500).json({message:error.message || "Server Error",success:false})
    
//   }
// }


// export async function verifyOTPandresetPassword(req,res) {
//   try {
//       const {email , otp , newPassword} = req.body;
//       if(!email || otp=="" || !newPassword){
//         const error = new Error("Email , otp , new Password is Required")
//         error.statusCode = 401
//         throw error
//       }
//       const cacheOTP = await redis.get(`otp:${email}`)

//       if(cacheOTP !== String(otp)){
//         return res.json({message:"Wrong OTP" ,success:false})
//       }
//       const hash = await bcrypt.hash(newPassword,10)
//       const user = await User.findOneAndUpdate({email:email},{password:hash},{new:true})
//       if (!user) {
//         return res.status(404).json({ message: "User not found with that email address.", success: false });
//      }

//     await redis.del(`otp:${email}`)
//     await redis.del(`users:email:${email}`)
//     await redis.del(`users:Id:${user._id}`)
//     await redis.del(`allUsers`)

//     return res.json({message:"Successfully reset the password" ,success:true})
//   } catch (error) {
//     return res.status(error.statusCode || 500).json({message:error.message || "Server Error",success:false})
    
//   }
// }



export const createProfile = async (req, res) => {};



export async function adminSignup(req,res) {
  try {
        const {idToken, secretKey , name} = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken)
        const {uid , email} = decodedToken
        if(secretKey !== process.env.ADMIN_VERIFY_SECRET_KEY){
          await admin.auth().deleteUser(uid)
          const error = new Error("Invalid secret key");
          error.statusCode = 401;
          throw error;
        }
        const existingUser = await User.findOne({email:decodedToken.email});
        if(existingUser){
          const error = new Error("Admin already exists");
          error.statusCode = 409;
          throw error;
        }
        const user = await User.create({
          _id:uid,
          name:name,
          email:email,
          role: "admin"
        })  
        await admin.auth().setCustomUserClaims(uid, { role:"admin" });
        res.status(200).json({ message: "Signup successful!", user,success:true });
  } catch (error) {
      return res.status(error.statusCode || 500 ).json({message:error.message || "Server Error",success:false})
      
  }
}


export async function adminLogin(req,res) {
  try {
      const { idToken } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      const cacheUser = await redis.get(`user:email:${decodedToken.email}`)
      let existingUser;
      if(cacheUser){
        existingUser = JSON.parse(cacheUser)
      }else{
          existingUser = await User.findOne({email:decodedToken.email});
          if(!existingUser){
              const error = new Error("Admin not found");
              error.statusCode = 404;
              throw error;
          }
      }
      if(existingUser.role !== "admin"){
        const error = new Error("You are not authorized to access this resource");
        error.statusCode = 401;
        throw error;
      }


      const expiresIn = 60 * 60 * 24 * 14 * 1000;
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
        const options = { 
          httpOnly: true, 
          sameSite: 'None', 
          secure: true,     
          path:"/",
          maxAge: expiresIn,
       };
      await redis.set(`user:email:${decodedToken.email}`,JSON.stringify(existingUser))
      res.cookie('session', sessionCookie, options);
      res.status(200).json({ message: 'Successfully logged in'  , success:true});


  } catch (error) {
    return res.status(error.statusCode || 500 ).json({message:error.message || "Server Error",success:false})

      
  }
}

export async function signOut(req,res) {
  res.clearCookie('session');
  res.status(200).json({ message: 'Successfully logged out' });
}
