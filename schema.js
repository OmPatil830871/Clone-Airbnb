const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        country: Joi.string().required(),
        image: Joi.object({
            url: Joi.string().allow("", null),
            filename: Joi.string().allow("", null)
        }),
        category: Joi.string()
            .valid("mountain", "beach", "farm", "castle", "pool", "cities", "campain", "forest", "desert", "island")
            .required()
    }).required()

});

module.exports = { listingSchema };