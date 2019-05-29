const express = require('express')
var path = require('path');
const app = express()

const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded());
app.use(express.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/templates/index.html'));
});

app.post('/send', function (req, res) {
    // if (!isValidSaveRequest(req, res)) {
    //     return;
    // }
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

var Datastore = require('nedb')
    , db = new Datastore({ filename: 'database/subscription.db', autoload: true });

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