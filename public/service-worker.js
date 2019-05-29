// This is the file that will be running in background in Chrome and deliver notification to server.


self.addEventListener('push', function(event) {
    sendNotification(self, event);  
  });

function sendNotification(context, event) {
  var value = event.data.json();

  const promiseChain = self.registration.showNotification(value.title, {
    body: value.body,
    icon: value.icon,
    image: value.image,
    badge: value.badge
  });

  event.waitUntil(promiseChain);
}