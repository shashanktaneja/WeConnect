const express = require("express");
const router = express.Router();
const auth = require(__dirname + "/../../middleware/auth.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const {check, validationResult} = require("express-validator");

const User = require(__dirname + "/../../models/User.js");

// @ route   Get api/auth
// @ desc    Test route
// @ access  Public

router.get("/", auth, async function(req,res){
    try{
        const user = await User.findById(req.user.id).select("-password");  // we dont want to send the password
        res.json(user);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}); 

// @ route   post api/auth 
// @ desc    authenticate user & get token       
// @ access  Public 

router.post("/", [
    
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required")
        .exists()

],async function(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        //found the errors
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try{
        // see if the user exists
        let user = await User.findOne({ email });

        if(!user){
            return res.status(400).json({errors: [{ msg: "Invalid Credentials"}] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({errors: [{ msg: "Invalid Credentials"}] });
        }   

        //return jsonwebtoken

        const payload = {
            user:{
                id: user.id
            }
        };

        //sign the token - parameter = payload, secret, options, callback
        jwt.sign(payload, config.get("jwtSecret"), {expiresIn: 360000}, function(err, token){
            if(err){
                throw err;
            }
            res.json({token});
        });
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }

}); 

module.exports = router;