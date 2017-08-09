module.exports = function (mongoose) {

    return new mongoose.Schema({
        device_id: String,
        app_id: String,
        date_test: { type: Date, default: Date.now },
        status: String,
        obs: String
    }, {collection: 'tests'}) ;

};