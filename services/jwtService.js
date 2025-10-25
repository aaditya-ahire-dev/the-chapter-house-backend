import jwt from "jsonwebtoken";

export function genrateToken(payload) {
    let token = jwt.sign(payload,process.env.JWT_SECRET)
    return token
}

export function decodeUser(token) {
    let decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
}