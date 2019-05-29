var app = new Vue({
    el: "#main",
    data: {

    },
    methods: {
       pushNotification() {
            this.askPermission().then((value) => {
                var subscription = this.subscribe();
            });
        },
        async askPermission() {
            const permissionResult_1 = await new Promise(function (resolve, reject) {
                const permissionResult = Notification.requestPermission(function (result) {
                    resolve(result);
                });
                if (permissionResult) {
                    permissionResult.then(resolve, reject);
                }
            });
            if (permissionResult_1 !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            }
        },
        async subscribe() {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BP5Wp-o7o7OF8U9Act0Mmf7P8yEk95NI7V9FmthDCKPIxWD_LkOHIE8a4xyzSUjF8BwTPlQ9pHzK8nFFG9j6CYQ')
            };
            const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
            this.sendSubscription(pushSubscription);
            return pushSubscription;
        },
        async sendSubscription(subscription) {
            const response = await fetch('/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            if (!response.ok) {
                throw new Error('Bad status code from server.');
            }
            const responseData = await response.json();
            if (!(responseData.data && responseData.data.success)) {
                throw new Error('Bad response from server.');
            }
        }

    }
})

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    ;
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }