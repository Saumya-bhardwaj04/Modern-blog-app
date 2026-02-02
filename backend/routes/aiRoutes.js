const express = require("express");
const { aiBlogAssist } = require("../controllers/aiController");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/blog-assist", auth, aiBlogAssist);

module.exports = router;