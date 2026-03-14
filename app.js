if (process.env.NODE_ENV != "production") {
    require('dotenv').config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const port = 8080;

const { title } = require("process");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const Listing = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");
const Review = require("./models/reviews.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { islogged, isOwner, isAuthor } = require("./middleware.js");
const ListingController = require("./controllers/listing.js");
const ReviewController = require("./controllers/reviews.js")
const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage })

const dburl = process.env.ATLASDB_URL;


const flash = require("connect-flash");
const { saveRedirectUrl } = require("./middleware.js");

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(dburl);
}

console.log("User authenticate:", typeof User.authenticate);

app.listen(port, () => {

    console.log("APP IS working")
});
app.engine("ejs", ejsMate)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));

const store = MongoStore.create({ //ye local host ka db nahi he isko hm internet se connect kr rhe he (mongo Atlas)
    mongoUrl: dburl, //connect session to db
    crypto: {
        secret: process.env.SECRET, //encryption
    },
    touchAfter: 24 * 3600, //store session for 24 hr kyu ki hme bar bar login na krna pde after refresh
})
store.on("error", (err) => {
    console.log("Error in Mongo session store", err)
})

const sessionOption = {
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}


app.use(session(sessionOption))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// app.get("/", (req, res) => {
//     res.send("Welcome to Home Page");
// });

app.get("/listings", wrapAsync(ListingController.indexlistingsget));
app.get("/listings/search", wrapAsync(ListingController.searchListings));

app.get("/listings/category/:category", async(req, res) => {

    const { category } = req.params;

    const allowedCategories = Listing.schema.path("category").enumValues;

    if (!allowedCategories.includes(category)) {
        return res.redirect("/listings");
    }

    const listings = await Listing.find({ category });
    res.render("listings/index", { allListings: listings });
});

app.get("/listings/new", islogged, (req, res) => {
    res.render("listings/new.ejs");
});

app.get("/listings/:id", wrapAsync(ListingController.showlistingsget));




app.post("/listings", islogged, upload.single("image"), wrapAsync(ListingController.createlistingspost));


app.get("/listings/:id/edit", islogged, isOwner, wrapAsync(ListingController.editlistingsget));

app.patch("/listings/:id", islogged, isOwner, upload.single("image"), wrapAsync(ListingController.editlistingspatch));


app.delete("/listings/:id", islogged, isOwner, wrapAsync(ListingController.deletelistingsdelete));


//review post route
// Review POST route (add wrapAsync if needed)
app.post("/listings/:id/reviews", islogged, wrapAsync(ReviewController.createreviewpost));

// Review DELETE route
app.delete("/listings/:id/reviews/:reviewId", isAuthor, wrapAsync(ReviewController.deletereviewdelete));



app.get("/signup", (req, res) => {
    res.render("user/signup.ejs")
})
app.post("/signup", async(req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newuser = new User({ email, username })
        const registerduser = await User.register(newuser, password);
        console.log(registerduser);
        req.login(registerduser, ((err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to wanderlust")
            console.log("Signup POST hit");
            res.redirect("/listings")
        }))
    } catch (e) {
        console.log("ERROR:", e);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
})

app.get("/login", (req, res) => {
    res.render("user/login.ejs");
});

app.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async(req, res) => {
    req.flash("success", "Welcome back to Wanderlust");
    let redirecturl = res.locals.redirectUrl || "/listings"

    res.redirect(redirecturl);

});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!")
        res.redirect("/listings")
    });
})

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});




app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    res.status(status).render("error.ejs", { message })
});