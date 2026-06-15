require("dotenv").config();
const express = require('express');
const PORT = process.env.PORT ||  5000;
const connectDB  = require('./config/db')
const app = express();

connectDB();

app.get("/", (req,res) => {
res.send("Server is running")
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`)
})