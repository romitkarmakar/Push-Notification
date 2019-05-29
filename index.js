const express = require('express')
var path = require('path');
const app = express()
const webpush = require('web-push');
var Datastore = require('nedb')
    , db = new Datastore({ filename: 'database/subscription.db', autoload: true });

const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded());
app.use(express.json());

const vapidKeys = {
    publicKey:
        'BP5Wp-o7o7OF8U9Act0Mmf7P8yEk95NI7V9FmthDCKPIxWD_LkOHIE8a4xyzSUjF8BwTPlQ9pHzK8nFFG9j6CYQ',
    privateKey: 'epu6FSph0KyQIj28nYen_2D5xjv4d5wdbR4WHKOd25A'
};

webpush.setVapidDetails(
    'mailto:web-push-book@gauntface.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/templates/index.html'));
});

app.post('/send', function (req, res) {
    if (!isValidSaveRequest(req, res)) {
        return;
    }
    console.log(req.body)
    return saveSubscriptionToDatabase(req.body)
        .then(function (subscriptionId) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ data: { success: true } }));
        })
        .catch(function (err) {
            res.status(500);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({
                error: {
                    id: 'unable-to-save-subscription',
                    message: 'The subscription was received but we were unable to save it to our database.'
                }
            }));
        });
});

app.get('/sendNotif', function (req, res) {
    getSubscriptionsFromDatabase();
    res.send("Sended Suceessfully");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))



const isValidSaveRequest = (req, res) => {
    // Check the request body has at least an endpoint.
    if (!req.body || !req.body.endpoint) {
        // Not a valid subscription.
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            error: {
                id: 'no-endpoint',
                message: 'Subscription must have an endpoint.'
            }
        }));
        return false;
    }
    return true;
};

function saveSubscriptionToDatabase(subscription) {
    console.log(subscription);
    return new Promise(function (resolve, reject) {
        db.insert(subscription, function (err, newDoc) {
            if (err) {
                reject(err);
                return;
            }

            resolve(newDoc._id);
        });
    });
};

function getSubscriptionsFromDatabase() {
    var data = {
        title: "hi",
        body: "hello",
        icon: "https://is4-ssl.mzstatic.com/image/thumb/Purple113/v4/72/31/50/72315059-ff3b-14e3-9a73-dd8f59b4e47a/AppIcon-0-1x_U007emarketing-0-0-GLES2_U002c0-512MB-sRGB-0-0-0-85-220-0-0-0-6.png/246x0w.jpg",
        image: "",
        badge: ""
    };
    db.find({}, function (err, docs) {
        console.log(docs);
        for (let i = 0; i < docs.length; i++) {
            var doc = docs[i];
            triggerPushMsg(doc, JSON.stringify(data));
        }
    });
}

const triggerPushMsg = function (subscription, dataToSend) {
    return webpush.sendNotification(subscription, dataToSend)
        .catch((err) => {
            if (err.statusCode === 410) {
                return deleteSubscriptionFromDatabase(subscription._id);
            } else {
                console.log('Subscription is no longer valid: ', err);
            }
        });
};