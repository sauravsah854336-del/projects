const express = require("express");
const { setupFirstAdmin } = require("../controllers/setupController");

const router = express.Router();

router.post('/setup', setupFirstAdmin);

module.exports = router;
