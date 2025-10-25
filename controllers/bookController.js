import axios from "axios"
import Book from "../model/bookSchema.js"
import User from "../model/user.js"
import redis from '../services/redisServices.js';
import { uploadImage } from "../services/cloudinaryService.js"
import {deleteFolders} from "../services/redisServices.js"

export async function getAllbooks(req,res) {
    try {

        const cachedBooks = await redis.get("allbooks")
        if(cachedBooks){
        const books = JSON.parse(cachedBooks);
        return res.status(200).json({message:"Got all the books (from cache)",books,success:true})
        }
        const books = await Book.find({})
        await redis.set("allbooks",  JSON.stringify(books))
        return res.status(200).json({message:"Got all the books",books,success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}
export async function getbooksAnduserLength(req,res) {
    try {
        const [cachedUserCount, cachedBookCount] = await redis.mget("length:usersLength", "length:booksLength");
        let finalUserCount = cachedUserCount ? parseInt(cachedUserCount, 10) : null;
        let finalBookCount = cachedBookCount ? parseInt(cachedBookCount, 10) : null;

        if (finalUserCount === null) {
            finalUserCount = await User.countDocuments({});
            await redis.set("length:usersLength", JSON.stringify(finalUserCount));
        }

        if (finalBookCount === null) {
            finalBookCount = await Book.countDocuments({});
            await redis.set("length:booksLength", JSON.stringify(finalBookCount));
        } 

        const length={
            users:finalUserCount,
            books:finalBookCount
        }

        return res.status(200).json({message:"Successfully retrieved site statistics",length,success:true})
    } catch (error) {
        console.error("!!! AN ERROR OCCURRED IN getSiteStats !!!:", error);
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}

export async function getBookById(req,res) {
    try {
        const id = req.params.id;
        const cachedBook = await redis.get(`book:${id}`)
        if(cachedBook){
            const book =JSON.parse(cachedBook)
            return res.status(200).json({message:"Got the book (from cache)",book,success:true})
        }
        const book = await Book.findOne({_id:id})
        if(!book) {
            // const error = new Error("book not found");
            // error.statusCode = 404;
            // throw error;
            return res.status(404).json({message:"Book Not Found or Might be Deleted",success:true})
        }
        const bookKey = `book:${book._id.toString()}`
        await redis.set(bookKey,JSON.stringify(book))
        return res.status(200).json({message:"Got the book",book,success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}

export async function getUsersAllBooks(req,res) {
    try {
        if(!req.user){
            const error = new Error("can't recognise the user plz login again")
            error.statusCode = 401
            throw error
        }
        const cachedUserownedBooks = await redis.get(`userOwnedBooks:${req.user.email}`)
        if(cachedUserownedBooks){
            const books = JSON.parse(cachedUserownedBooks)
            return res.status(200).json({message:"Got the books (from cache)",success:true,books})
        }
        const findUser = await User.findOne({email:req.user?.email}).populate({path: "buyedBooks.book"})
        if(!findUser){
            const error = new Error("can't found the user")
            error.statusCode = 401
            throw error
        }
        if (findUser.buyedBooks.length === 0) {
            const error = new Error("No books found in user's library");
            error.statusCode = 400;
            throw error;
          }
        await redis.set(`userOwnedBooks:${req.user?.email}`,JSON.stringify(findUser.buyedBooks))
        return res.status(200).json({message:"Got the books",success:true,books:findUser.buyedBooks})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message,success:false})
    }
}

export async function uploadBook(req,res,file) {
    try {
        const body = req.body
        const files = req.files
        if(!body && !files) {
            const error = new Error("body and files are required");
            error.statusCode = 400;
            throw error;
        }
        const {title,author,description,price,category,publisher,publishedYear,language,format} = body
        
        const coverImage = files.coverImage[0];
        const fileUrl = files.fileUrl[0];

        const coverImageUrl = await uploadImage(coverImage,"image" , "/books/images");
        const fileUrlUrl = await uploadImage(fileUrl,"raw","/books/files");

        const book = await Book.create({
            title,
            author,
            description,
            price,
            category,
            publishedYear,
            publisher,
            language,
            coverImage:coverImageUrl,
            fileUrl:fileUrlUrl,
            format
        })

        if(!book) {
            const error = new Error("problem while creating book");
            error.statusCode = 400;
            throw error;
        }
        await redis.del("allbooks");

     return res.status(200).json({message:"Book uploaded",book,success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}

export async function updateBook(req,res,files) {
    try {
        const id = req.params.id
        let newBody = { ...req.body };
   
        if(req.files){

            const coverImageArray = req.files.coverImage;
            if (coverImageArray && coverImageArray.length > 0) {
                const coverImageFile = coverImageArray[0];
                const coverImageUrl = await uploadImage(coverImageFile, "image", "/books/images");
                newBody.coverImage = coverImageUrl;
            }

            const fileUrlArray = req.files.fileUrl;
            if (fileUrlArray && fileUrlArray.length > 0) {
                const fileUrlFile = fileUrlArray[0];
                const fileUrlUrl = await uploadImage(fileUrlFile, "raw", "/books/files");
                newBody.fileUrl = fileUrlUrl;
            }

        }
        const { createdAt , updatedAt , ...bookBody}= newBody

         const book = await Book.findOneAndUpdate({_id:id},bookBody,{new:true})
         if(!book) {
            const error = new Error("problem while creating book");
            error.statusCode = 404;
            throw error;
        }

        await redis.del(`book:${id}`)
        await redis.del(`allbooks`)
        return res.status(200).json({message:"request received and book updated",book,success:true})
    } catch (error) {
          return res.status(error.statusCode || 500).json({message:error.message,success:false})
    }
}

export async function deleteBook(req,res) {
    try {
         const id = req.params.id
          const book = await Book.findOneAndDelete({_id:id})
         if(!book) {
            const error = new Error("book not found");
            error.statusCode = 404;
            throw error;
         }
         await redis.del(`book:${id}`)
         await redis.del("allbooks")
        //  await redis.del("userOwnedBooks") 
        //  await redis.del("userBoughtBookById") 
         await redis.del("length:booksLength") 
         await deleteFolders(redis,["userOwnedBooks","userBoughtBookById"])
        return res.status(200).json({message:"Successfully Deleted the Book",book,success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error"   ,success:false})
    }
}


export async function buyBook(req,res) {
    try {
        const bookId = req.params.id
        const findBook = await Book.findOne({_id:bookId})
        if(!findBook){
            const error = new Error("Book dose not exists")
            error.statusCode = 404
            throw error
        }
        const findUser = await User.findOne({email:req.user.email})
        if(!findUser){
            const error = new Error("can't find the user")
            error.statusCode = 404
            throw error
        }

        findUser.buyedBooks.push({
            book: bookId
        });
        
        try {
            await findUser.save()
        } catch (saveError) {
            throw saveError;
        }
       
         await redis.del(`userOwnedBooks:${req?.user.email}`)
        
        return res.status(200).json({message:"payment successfull" , success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message,success:false})
    }
}


export async function getBuyedBookById(req,res) {
    try {
        const bookId = req.params.id;
        const cacheBook = await redis.get(`userBoughtBookById:${req.user?.email}-${bookId}`)
        if(cacheBook){
            const flattenedBook = JSON.parse(cacheBook)
            return res.status(200).json({message:"Got the book (from cache)",flattenedBook,success:true})
        }
        const user = await User.findOne({ email: req.user.email }).populate("buyedBooks.book");

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        const boughtBook = user.buyedBooks.find(b => b._id.toString() === bookId);
        
        if (!boughtBook) {
            const error = new Error("Book not found in user's bought books");
            error.statusCode = 404;
            throw error;
        }
        if(boughtBook.book == null){
            return res.status(200).json({message:"This Book Got Deleted (from database)",flattenedBook:null,success:true})
        }


        const flattenedBook = {
            ...boughtBook.book._doc,
            bookStatus: boughtBook.bookStatus
        };

        await redis.set(`userBoughtBookById:${req.user?.email}-${bookId}`,JSON.stringify(flattenedBook))
        return res.status(200).json({message:"Got the book",flattenedBook,success:true})
    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}


export async function rateBook(req,res) {
    try {
        const bookId  = req.params.id;
        const { rating } = req.body;
        const userId = req.user.uid; 


       const book = await Book.findOne({_id:bookId})
       if(!book){
        const error = new Error("book not found")
        error.statusCode = 404
        throw error
       }
       
       const existingRating = book.ratings.find(r => r.user.toString() === userId);
       if (existingRating) {
         existingRating.rating = rating;
       } else {

         book.ratings.push({ user: userId, rating });
       }
       book.avrrating = book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length;
     
       try {
        await book.save();
      } catch (saveError) {
        throw saveError;
      }
    await redis.del(`rating:${req.user?.email}-${bookId}`)
    await redis.del(`book:${bookId}`)
    await redis.del("allbooks")
    await deleteFolders(redis,["userOwnedBooks","userBoughtBookById"])
    return res.status(200).json({message:"reated the book",success:true ,book})

    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}


export async function getRatingDoneByUserToSpecificBook(req,res) {
    try {
        const bookId  = req.params.id;
        const userId = req.user.uid; 
        const cacheRating = await redis.get(`rating:${req.user?.email}-${bookId}`)
        if(cacheRating){
            const existingRating = JSON.parse(cacheRating)
            return res.status(200).json({message:"User have reated this book (from cache)",existingRating,success:true})
        }

       const book = await Book.findOne({_id:bookId})
       if(!book){
        const error = new Error("book not found")
        error.statusCode = 404
        throw error
       }
       let existingRating; 
       existingRating = book.ratings.find(r => r.user.toString() === userId.toString());
       if(!existingRating){
        existingRating={
            rating:0,
            user:userId
        }
        return res.status(200).json({message:"User Haven't reated it yet",existingRating,success:true})
       }

       await redis.set(`rating:${req.user?.email}-${bookId}`,JSON.stringify(existingRating))

       return res.status(200).json({message:"User have reated this book",existingRating,success:true})

    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}



export async function downloadBook(req,res) {
    try {
        const book = await Book.findOne({_id:bookId})

         const fileUrl = book.fileUrl; 
         const fileName = `${book.title}.pdf`;
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
         res.setHeader("Content-Type", "application/pdf");
         const response = await axios.get(fileUrl, { responseType: "stream" });

         try {
            response.data.pipe(res);
        } catch (err) {
            console.error("Error streaming file:", err);
            res.status(500).send("Failed to stream file");
        }

    } catch (error) {
        return res.status(error.statusCode || 500).json({message:error.message || "Internal server error",success:false})
    }
}
