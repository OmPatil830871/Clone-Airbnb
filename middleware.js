const Listing = require("./models/listing.js");
const Review = require("./models/reviews.js");

module.exports.islogged = (req, res, next) => {
    console.log(req.user);
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You are not logged!");
        return res.redirect("/login")
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}


module.exports.isOwner = async(req, res, next) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // If user not logged in
    if (!req.user) {
        req.flash("error", "You must be logged in!");
        return res.redirect("/login");
    }

    // Check owner
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.isAuthor = async(req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }

    // Use req.user directly, check authentication first
    if (!req.user) {
        req.flash("error", "You must be logged in!");
        return res.redirect("/login");
    }

    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You are not author of this review");
        return res.redirect(`/listings/${id}`);
    }

    next();
};