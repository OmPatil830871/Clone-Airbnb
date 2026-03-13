const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const { listingSchema } = require("../schema.js");

module.exports.createreviewpost = async(req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id
    listing.reviews.push(newReview._id); // Push ID, not objec
    await newReview.save();
    await listing.save();
    req.flash("success", "New review created!");
    res.redirect(`/listings/${listing._id}`);
}

module.exports.deletereviewdelete = async(req, res) => {
    const { id, reviewId } = req.params; // Fix param name consistency
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted!");
    res.redirect(`/listings/${id}`);
}