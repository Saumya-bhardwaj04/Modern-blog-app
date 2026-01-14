const { verifyJWT } = require("../utils/generateToken");

const verifyUser = async (req, res, next) => {
    try {
        let token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Please sign in"
            })
        }
        try {
            let user = await verifyJWT(token);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Please sign in"
                })
            }
            req.user = user.id;
            next();
        } catch (err) { }
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "token missing"
        })
    }
}
module.exports = verifyUser;