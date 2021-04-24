const express = require("express");
const router = express.Router();
const {check, validationResult} = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require(__dirname + "/../../models/User.js");

// @ route   post api/users -endpoint
// @ desc    register       -decription
// @ access  Public         -accessing public or private

router.post("/", [
    check("name", "Name is required")      // data validation using express-validator = validation of data if it's correct or not
        .not()
        .isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters")
        .isLength({min: 6})

],async function(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        //found the errors
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email , password} = req.body;

    try{
        // see if the user exists
        let user = await User.findOne({ email });

        if(user){
            return res.status(400).json({errors: [{ msg: "User already exists"}] });
        }

        // Get users gravatar

        const avatar = gravatar.url(email, {
            s: "200",             // size
            r: "pg",              // reading
            d: "mm"               // default image(user icon)
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });
        
        //encrypt password

        const salt = await bcrypt.genSalt(10);  //we get a promise and 10 are the rounds and creating salt to do the hashing
        user.password = await bcrypt.hash(password, salt);

        await user.save();     

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

//token of a user = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjA1Y2I5NzYxNjAyNGQ2NzFjNjk2YmY0In0sImlhdCI6MTYxNjY4OTUyNywiZXhwIjoxNjE3MDQ5NTI3fQ.jstGVTFKu0QrfPb4_QMoIF9UMUNZuH-oEVr2j-jPdb8