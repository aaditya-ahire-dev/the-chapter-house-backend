import RazorpayInstance from "../services/razorpay.Service.js";
import Book from "../model/bookSchema.js";
import User from "../model/user.js";
import crypto from "crypto"

export async function createOrder(req,res) {
    try {
        const bookId = req.params.id 
        if(!bookId){
            const error = new Error("Book Id required")
            error.statusCode = 400
            throw error 
        }
        const book = await Book.findOne({_id:bookId})
        if(!book){
            const error = new Error("Book Not Found")
            error.statusCode = 404
            throw error 
        }
        const options = {
            amount:book.price * 100,
            currency:"INR",
            receipt: `receipt_order_${new Date().getTime()}`
        }
        const order = await RazorpayInstance.orders.create(options);
            if(!order){
                const error = new Error("Error while creating order")
                error.statusCode = 404
                throw error 
            }
       return res.status(200).json({message:"payment order successfull",order,success:true})


        
    } catch (error) {
      return res.status(error.statusCode || 500).json({message:error.message,success:false})
        
    }
}



export async function verifyOrderPayment(req,res){
try {
    const loggedInUser = req.user;
    const {bookId ,razorpay_order_id,razorpay_payment_id,razorpay_signature} = req.body.orderData

    const secret_key = process.env.RAZORPAY_KEY_SECRET
    const hashc = crypto.createHmac("sha256",secret_key)
    hashc.update(razorpay_order_id +"|"+ razorpay_payment_id)
    const genrateSignature = hashc.digest("hex")
    if(genrateSignature === razorpay_signature){
        const user = await User.findById(loggedInUser.uid)
        const book = await Book.findById(bookId)
        if(!user || !book) {

            const error = new Error("user or book not found")
            error.statusCode = 404
            throw error
        }

        user.buyedBooks.push({
            book: bookId
        });
        
        try {
            await user.save()
        } catch (saveError) {
            throw saveError;
        }

        return res.status(200).json({message:"payment successfull" , success:true})
    }else {
        return res.status(200).json({message:"payment failed" , success:false})
    }  
} catch (error) {
    return res.status(error.statusCode || 500).json({message:error.message,success:false})
    
}
}