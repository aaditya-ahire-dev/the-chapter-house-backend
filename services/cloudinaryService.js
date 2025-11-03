import dotenv from "dotenv";
dotenv.config(); 
import { v2 as cloudinary } from 'cloudinary';
import streamifier from "streamifier";



const cloudinaryUrl = process.env.CLOUDINARY_URL;
const [, api_key, api_secret, cloud_name] = cloudinaryUrl.match(
  /cloudinary:\/\/(\w+):([^@]+)@(.+)/
);

// ✅ Manually configure
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

/**
 * Uploads an image to Cloudinary.
 * @param {string} filePath The path or URL of the image to upload.
 * @param {string} publicId The desired public ID for the image (can include folder structure).
 * @param {object} [options={}] Additional upload options.
 * @returns {Promise<object>} The upload result from Cloudinary.
 */
// export async function uploadImage(filePath, publicId, options = {}) {
//   console.log("cloudinary in image")
//   try {
//     const uploadResult = await cloudinary.uploader.upload(filePath, {
//       public_id: publicId,
//     });
//     return uploadResult;
//   } catch (error) {
//     console.error("Cloudinary upload error:", error);
//     throw error;
//   }
// }



export async function uploadImage(file , type = "auto" , folder="") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: type,
        folder,
      },
      (error, result) => {

        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}



/**
 * Generates an optimized URL for a Cloudinary image.
 * @param {string} publicId The public ID of the image.
 * @param {object} [options={}] Transformation options.
 * @returns {string} The optimized image URL.
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options // Merge any additional options
  });
}

/**
 * Generates an auto-cropped URL for a Cloudinary image.
 * @param {string} publicId The public ID of the image.
 * @param {number} width The desired width.
 * @param {number} height The desired height.
 * @param {object} [options={}] Additional transformation options.
 * @returns {string} The auto-cropped image URL.
 */
export function getAutoCroppedImageUrl(publicId, width, height, options = {}) {
  return cloudinary.url(publicId, {
    crop: 'auto',
    gravity: 'auto',
    width: width,
    height: height,
    ...options // Merge any additional options
  });
}

// You can export other Cloudinary utility functions here if needed
// For example, to delete an image:
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

export default cloudinary;