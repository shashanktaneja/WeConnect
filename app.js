const express = require("express");
const connectDB = require(__dirname + "/config/db.js");

const app = express();

//connect database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

app.get("/",function(req,res){
    res.send("API running");
});

//define routes
app.use("/api/users", require(__dirname + "/router/api/users.js"));
app.use("/api/auth", require(__dirname + "/router/api/auth.js"));
app.use("/api/posts", require(__dirname + "/router/api/posts.js"));
app.use("/api/profile", require(__dirname + "/router/api/profile.js"));


const port = process.env.PORT || 5000;

app.listen(port, function(){
    console.log("server successfully started");
});