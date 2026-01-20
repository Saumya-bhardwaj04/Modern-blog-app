const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { JWT_SECRET } = require("../config/dotenv.config");
dotenv.config();
async function generateJWT(payload) {
    let token = await jwt.sign(payload, JWT_SECRET,{ expiresIn: '15m' });
    
    return token
}
async function verifyJWT(token) {
    try {
        let data = await jwt.verify(token, JWT_SECRET);
        return data;
    }
    catch (error) {
        return false;
    }
}
async function decodedJWT(token) {
    let decoded = await jwt.decode(token);
    return decoded
}

module.exports = { generateJWT, verifyJWT, decodedJWT };