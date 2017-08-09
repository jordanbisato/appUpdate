module.exports = function (mongoose) {

    return mongoose.Schema({
        android_id: String,
        imei: String,
        imsi: String,
        iccid: String,
        sim_operator: String,
        rooted: String,
        model: String,
        manufacturer: String,
        version_sdk: String,
        version_os: String
    }, {collection: 'devices'}) ;

};