'use strict';
var mongoose = require('mongoose');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var express = require('express');
var router = express.Router();

mongoose.connect('mongodb://localhost/app_update');
var dbApp = mongoose.createConnection('mongodb://127.0.0.1/app_update');

var deviceSchema = require("./models/device")(mongoose);
var appSchema = require("./models/app")(mongoose);
var testSchema = require("./models/test")(mongoose);
var installSchema = require("./models/install")(mongoose);
var apkSchema = require("./models/apk")(mongoose);


io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('checkApps', function (device, fn) {
        //var deviceS = dbApp.model('device', deviceSchema);

        var deviceId = "";
        var status = false;

        insertDevice(device, function (dev) {
            if (dev.doc != null) {
                if (dev.doc.lastErrorObject.updatedExisting == true) {
                    deviceId = dev.doc.value._id.toString();
                }
                else {
                    deviceId = dev.doc.lastErrorObject.upserted;
                }
            }

            getApps(function (result) {
                var appId;
                var apps = [];
                var i = 0;
                result.forEach(function (apli) {
                    appId = apli._id.toString();

                    var devapp_ids = {};
                    devapp_ids.deviceId = deviceId;
                    devapp_ids.appId = appId;

                    var dateTest = null;
                    var dateInstall = null;

                    getDateTest(devapp_ids, function (dataTeste) {
                        dateTest = dataTeste;
                        console.log("DATATEST GET: " + dateTest);
                    });

                    getDateInstall(devapp_ids, function (dataInstalacao) {
                        dateInstall = dataInstalacao;
                        console.log("DATAINSTALL GET: " + dateInstall);
                    });

                    console.log("DATATEST FORA: " + dateTest);
                    console.log("DATAINSTALL FORA: " + dateInstall);

                    getApks(appId, function (apks) {

                        var apeka = [];
                        var j = 0;

                        apks.forEach(function (apk) {
                            apeka[j] = {
                                apk_name: apk.apks.apk_name,
                                apk_url: apk.apks.apk_url
                            };
                            j++;
                        });

                        apps[i] = {
                            app_id: apli._id,
                            date_install: dateInstall,
                            date_test: dateTest,
                            name: apli.name,
                            version: apli.version,
                            package: apli.package,
                            image_url: apli.image_url,
                            date: apli.date,
                            active: apli.active,
                            apks: apeka
                        };

                        i++;
                        if (i === result.length) {
                            var testVar = {
                                status: dev.status,
                                device_id: deviceId,
                                apps: apps
                            };
                            JSON.stringify(testVar);
                            console.dir("TESTVAR: " + JSON.stringify(testVar));
                            fn(testVar);
                        }
                    });
                });
            });
        });
    });

    socket.on('updateInstallApp', function (teste, fn) {
        var testS = dbApp.model('test', testSchema);

        testS.update({
                $and: [
                    {'device_id': teste.device_id},
                    {'app_id': teste.app_id}
                ]
            },
            teste, {
                upsert: true,
                new: true
            }
            , function (err) {
                if (err) {
                    fn(false);
                }
                else {
                    fn(true);
                }
            });
    });

    socket.on('updateTestApp', function (teste, fn) {
        var testS = dbApp.model('test', testSchema);

        testS.update({
                $and: [
                    {'device_id': teste.device_id},
                    {'app_id': teste.app_id}
                ]
            },
            teste, {
                upsert: true,
                new: true
            }
            , function (err) {
                if (err) {
                    fn(false);
                }
                else {
                    fn(true);
                }
            });
    });

    socket.on('addApp', function (obj) {
        insertApps(obj, function (inseriu) {
            if (inseriu) {
                socket.emit('appsNotification', {
                    status: true,
                    name: obj.name,
                    version: obj.version
                });
            }
        });
    });

    socket.on('addApk', function (obj) {
        console.log("ADDAPK socket");
        console.log("OBJ: " + JSON.stringify(obj));
        for(var i=0; i <= JSON.stringify(Object.keys(obj.apks).length)-1; i++) {
            console.log("NUM INSERT: " + i);
            insertApks({ app_id: obj.app_id, apks: obj.apks[i] });
        }
    });

    socket.on('getApps', function () {
        getApps(function (result) {
            socket.emit("sendApps", result);
        });
    });

    socket.on('getApks', function(id) {
        console.log("SOCKET GET APKS");
        getApks(id, function(apks) {
            console.log("GET APKS SEND APKS: " + apks);
            socket.emit('sendApks', apks);
        });
    });

    socket.on('removeApk', function(id) {
        deleteApk(id);
    });
});

function insertApps(app, callback) {
    var appS = mongoose.model('apps', appSchema);

    var apepe = new appS({
        name: app.name,
        version: app.version,
        package: app.package,
        image_url: app.image_url,
        date: app.date,
        active: app.active
    });

    var upsertData = apepe.toObject();

    delete upsertData._id;

    appS.update({
            $and: [
                {'name': app.name},
                {'version': app.version}
            ]
        },
        upsertData, {
            upsert: true,
            new: true
        }
        , function (err) {
            if (err) {
                console.log("ERR INSERT APP : " + err);
            }
            else {
                callback(true);
            }
        });
}

function insertApks(apk) {
    console.log("INSERT APKS");
    console.log("APK: " + JSON.stringify(apk));
    var apkS = mongoose.model('apkS', apkSchema);

    apkS.update({
            $and: [
                {"apks.apk_name" : apk.apks.apk_name },
                { app_id : apk.app_id}
            ]},
        apk, {
            upsert: true
        }
        , function (err) {
            if (err) {
                console.log("ERR INSERT APP : " + err);
            }
        });
}

function findApk(apk, callback) {
    var apkS = mongoose.model('apkS', apkSchema);
    apkS.find({
        $and: [
            {"apks.apk_name" : apk.apks.apk_name },
            { app_id : apk.app_id}
        ]}, function (err, doc) {
            if(err) {
                console.log("APKS FIND ERR: " + err);
            }
            else {
                callback(doc);
            }
        });
}

function deleteApk(id) {
    var apkS = mongoose.model('apkS', apkSchema);
    apkS.remove({ _id : id }, function (err) {
        if (err) {
            console.log("REMOVE ERR: " + err);
        }
    });
}

function getApks(id, callback) {
    var apkS = dbApp.model('apk', apkSchema);
    console.log("ENTROU GETAPKS");

    apkS.find({app_id: id}, function (err, result) {
        if (err) {
            console.log(err);
            callback(null);
            console.log("ERR GET APKS: " + err);
        } else if (result.length > 0) {
            console.log("Result getAPK: " + result);
            callback(result);
        }
        else {
            console.log("Result null getapk");
            callback(null);
        }
    });
}

function getApps(callback) {
    var appS = dbApp.model('app', appSchema);

    appS.find({active: true}, function (err, result) {
        if (err) {
            console.log("ERR GETAPP: " + err);
        } else if (result.length > 0) {
            callback(result);
        }
    });
}

function insertDevice(device, callback) {
    var deviceS = dbApp.collection('devices');

    deviceS.findOneAndUpdate({
            $or: [
                {'android_id': device.android_id},
                {'imei': device.imei},
                {'imsi': device.imsi},
                {'iccid': device.iccid}
            ]
        },
        device, {
            upsert: true,
            returnNewDocument: true,
            new: true
        }, function (err, doc) {

            var status = false;
            if (err) {
                console.log("err findandmodify: " + err);
                status = false;
            }
            else {
                status = true;
            }

            var result = {};
            result.status = status;
            result.doc = doc;
            callback(result);
        });
}

function getDateTest(ids, callback) {
    var testS = dbApp.model('test', testSchema);

    testS.findOne({device_id: ids.deviceId.toString(), app_id: ids.appId.toString()}, function (err, res) {
        if (err) {
            console.log("ERR GetDateTest: " + err);
        }
        var dateTest = null;
        if (res) {
            dateTest = res.date_test;
        }
        callback(dateTest);
    });
}

function getDateInstall(ids, callback) {
    var installS = dbApp.model('install', installSchema);

    installS.findOne({device_id: ids.deviceId.toString(), app_id: ids.appId.toString()}, function (err, res) {
        if (err) {
            console.log("ERR GetDateInstall: " + err);
        }
        var dateInstall = null;
        if (res) {
            dateInstall = res.date_install;
        }
        callback(dateInstall);
    });
}


app.use(bodyParser.urlencoded({extended: true}));

//app.use('/apks', express.static(__dirname + '/apks'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/addApks', function (req, res) {
    res.sendFile(__dirname + '/views/addApks.html');
});

app.get('/addApps', function (req, res) {
    res.sendFile(__dirname + '/views/addApps.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

router.post('/acra/store', function (req, res) {
    console.log(req.body.error);
    addLog(req.body.error, 'error', 'ACRA');
    res.json({'status': true});
});