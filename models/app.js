module.exports = function (mongoose) {

    return new mongoose.Schema({
        name: String,
        version: String,
        package: String,
        image_url: String,
        date: { type: Date, default: Date.now },
        active: Boolean
    }, {collection: 'apps'}) ;
};