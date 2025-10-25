import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables within this module before they are used
dotenv.config();
const redis = new Redis(process.env.REDIS_URL)
// const redis = new Redis()

export async function deleteFolders(redis, folders) {
    for (const folder of folders) {
      const stream = redis.scanStream({ match: `${folder}:*` });
      for await (const keys of stream) {
        if (keys.length) {
          await redis.del(...keys);
        }
      }
    }
  }


export default redis;