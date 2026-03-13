const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");


main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
};

const initDB = async() => {
    await Listing.deleteMany({});
    initdata.data = initdata.data.map((obj) => ({...obj, owner: "69955d304a98ba823c5ef549", category: "mountain" }))
    await Listing.insertMany(initdata.data); //initdata obh ke andr data object ko access karne ke liye 
    console.log("data initialized successfully")
}

initDB(); //calling initdb