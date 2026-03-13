const mongoose = require("mongoose");
const Review = require("./reviews");

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true

    },

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YmVhY2h8ZW58MHx8MHx8fDA%3D",
            set: (v) => v === "" ? "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YmVhY2h8ZW58MHx8MHx8fDA%3D" : v,
        },
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },


    reviews: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        }],
        default: []
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    category: {
        type: String,
        enum: ["mountain", "beach", "farm", "castle", "pool", "cities", "campain", "forest", "desert", "island"],
        required: true
    }

});

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } })
    }
})
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;