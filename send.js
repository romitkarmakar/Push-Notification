const webpush = require('web-push');

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

var Datastore = require('nedb')
    , db = new Datastore({ filename: 'database/subscription.db', autoload: true });

function getSubscriptionsFromDatabase() {
    var data = {title: "hi", game: "hello"};
    db.find({}, function (err, docs) {
        console.log(docs);
        for(let i = 0; i < docs.length; i++) {
            var doc = docs[i];
            triggerPushMsg(doc, JSON.stringify(data));
        }
    });
}

getSubscriptionsFromDatabase()

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