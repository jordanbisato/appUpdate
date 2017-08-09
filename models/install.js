module.exports = function (mongoose) {

    return new mongoose.Schema({
        device_id: String,
        app_id: String,
        date_install: { type: Date, default: Date.now }
    }, {collection: 'installs'}) ;
};

