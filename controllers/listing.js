const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.indexlistingsget = async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}

module.exports.showlistingsget =
    async(req, res) => {
        let { id } = req.params;
        let listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
        res.render("listings/show.ejs", { listing });
    }

module.exports.createlistingspost = async(req, res) => {

    const { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }

    if (!req.file) {
        throw new ExpressError(400, "Image is required");
    }
    let url = req.file.path;
    let filename = req.file.filename;


    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { filename, url };
    await newListing.save();
    console.log(req.file)
    req.flash("success", "New Listing Created")
    res.redirect("/listings");
}

module.exports.editlistingsget = async(req, res) => {

    let { id } = req.params;
    let listing = await Listing.findById(id);
    let originalurl = listing.image.url;
    originalurl = originalurl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalurl });
}
module.exports.editlistingspatch = async(req, res) => {

    const { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }

    const { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing });

    // Only update image if new file uploaded
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Edited Successfully");
    res.redirect("/listings");
};

module.exports.deletelistingsdelete = async(req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully")
    res.redirect("/listings");
}

module.exports.searchListings = async(req, res) => {
    const { search } = req.query;

    const listings = await Listing.find({
        title: { $regex: search, $options: "i" }
    });

    res.render("listings/index", { allListings: listings });
};