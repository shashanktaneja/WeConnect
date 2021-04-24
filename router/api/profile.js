const express = require("express");
const router = express.Router();
const auth = require(__dirname + "/../../middleware/auth.js");
const {check, validationResult} = require("express-validator");
const request = require("request");
const config = require("config");

const Profile = require(__dirname + "/../../models/Profile.js");
const User = require(__dirname + "/../../models/User.js");
const Post = require(__dirname + "/../../models/Post.js");

// @ route   Get api/profile/me
// @ desc    Get current users profile
// @ access  Private

router.get("/me", auth, async function(req,res){
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ["name", "avatar"]);
        if(!profile){
            return res.status(400).json({ msg: "There is no profile for this user"});
        }
        res.json(profile);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}); 

// @ route   POST api/profile
// @ desc    Create or update user profile
// @ access  Private

router.post("/", [auth, [
    check("status", "status is required")
        .not()
        .isEmpty(),                             //if we want it to be there and not empty
    check("skills", "skills is required")
        .not()
        .isEmpty()
    ]
] , async function(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,        
        instagram,
        linkedin
    } = req.body;

    //build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;

    if(skills){
        //split to turn the string to array using , as deliminiter
        //map through the array and trim each skill to ignore spaces 
        profileFields.skills = skills.split(",").map(function(skill){
            return skill.trim();
        });
    }
        
    //build social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(twitter) profileFields.social.twitter = twitter;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;

    try{
        //user is the id field and req.user.id comes from token
        let profile = await Profile.findOne({ user: req.user.id });

        //if profile is found then update it
        if(profile){
            //update
            profile = await Profile.findOneAndUpdate( 
                {user: req.user.id},
                {$set: profileFields},
                {new: true}
            );

            return res.json(profile);
        }
        //create
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
        
});

// @ route   Get api/profile
// @ desc    Get all the profiles
// @ access  Public

router.get("/", async function(req, res){
    try {
        const profiles = await Profile.find().populate("user", ["name", "avatar"]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// @ route   Get api/profile/user/:user_id
// @ desc    Get profile by user_id
// @ access  Public

router.get("/user/:user_id", async function(req, res){
    try {
        const profile = await Profile.findOne( {user: req.params.user_id} ).populate("user", ["name", "avatar"]);
        
        if(!profile){
            return res.status(400).json({ msg: "Profile not found"});
        }
        
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @ route   Delete api/profile
// @ desc    Delete profile, user and posts
// @ access  Private

router.delete("/", auth, async function(req, res){
    try {

        //remove user posts
        await Post.deleteMany({ user: req.user.id });

        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //remove user
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: "User deleted"});
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @ route   Put api/profile/experience
// @ desc    Add profile experience
// @ access  Private

router.put("/experience", [auth, [
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
]], async function(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    // new experience variable
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);  // pushing the elements at the beginning

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send( "Server Error" );
    }

});


// @ route   Delete api/profile/experience/:exp_id
// @ desc    delete experience from profile
// @ access  Private

router.delete("/experience/:exp_id", auth, async function(req, res){
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index- map through the profile experience and chain to it, the index you want
        const removeIndex = profile.experience.map(function(item){
            return item.id;
        }).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send( "Server Error" );
    }
});


// @ route   Put api/profile/education
// @ desc    Add profile education
// @ access  Private

router.put("/education", [auth, [
    check("school", "School is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
]], async function(req,res){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    // new experience variable
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);  // pushing the elements at the beginning

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send( "Server Error" );
    }

});


// @ route   Delete api/profile/education/:edu_id
// @ desc    delete education from profile
// @ access  Private

router.delete("/education/:edu_id", auth, async function(req, res){
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index- map through the profile education and chain to it, the index you want
        const removeIndex = profile.education.map(function(item){
            return item.id;
        }).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send( "Server Error" );
    }
});

// @ route   Get api/profile/github/:username
// @ desc    Get user repos from github
// @ access  Public

router.get("/github/:username", function(req, res){
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id:${config.get(
                "githubClientId"
            )}&client_secret:${config.get("githubSecret")}`,
            method: "GET",
            headers: {"user-agent": "node.js"}
        };

        request(options, function(error, response, body){
            if(error){
                console.error(error);
            }

            if(response.statusCode !==200){
                return res.status(404).json({ msg: "No github profile found"});
            }

            res.json(JSON.parse(body));
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


module.exports = router;