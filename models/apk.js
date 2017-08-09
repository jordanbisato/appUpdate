module.exports = function (mongoose) {

    return new mongoose.Schema({
        app_id : String,
        apks: {
            apk_name: String,
            apk_url: String
        }
    }, {collection: 'apks'}) ;
};

