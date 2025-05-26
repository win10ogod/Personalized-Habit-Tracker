// sw.js

const CACHE_NAME = 'habit-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  // Add other important assets here, e.g., icons, manifest.json
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Message event: Receive data from client and show notification
// TEST_CASE_POINT: Verify this listener receives messages from script.js and calls self.registration.showNotification.
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, habitId } = event.data.payload;
    // TEST_POINT: Manually verify notification appearance and actions (snooze button).
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: './icon.png', // Optional: ensure you have an icon.png
        data: { habitId: habitId }, // Pass habitId to notification data
        actions: [{ action: 'snooze', title: 'Snooze (5 min)' }],
        silent: event.data.payload.reminderSound && event.data.payload.reminderSound !== 'default' // Make notification silent if custom sound will be played by client
      })
      .then(() => {
        console.log('Service Worker: Notification shown for habitId:', habitId);
        // If a custom sound is selected, tell the client to play it
        // TEST_CASE_POINT: Verify correct sound file name is sent to client if reminderSound is not 'default'.
        if (event.data.payload.reminderSound && event.data.payload.reminderSound !== 'default') {
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
              console.log(`Service Worker: Sending PLAY_SOUND message to client for ${event.data.payload.reminderSound}`);
              clientList[0].postMessage({ // Send to the first available client
                type: 'PLAY_SOUND',
                soundFile: event.data.payload.reminderSound
              });
            } else {
              console.log('Service Worker: No clients found to send PLAY_SOUND message.');
            }
          }).catch(error => {
            console.error('Service Worker: Error matching clients for PLAY_SOUND:', error);
          });
        }
      })
      .catch(error => {
        console.error('Service Worker: Error showing notification:', error);
      })
    );
  }
});

// Notificationclick event: Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked. Action:', event.action);
  console.log('Service Worker: Notification data:', event.notification.data);
  
  // TEST_POINT: Manually verify notification closes on click/snooze.
  const habitId = event.notification.data.habitId;
  event.notification.close(); // Close the notification in all cases

  if (event.action === 'snooze') {
    // TEST_CASE_POINT: Verify 'snooze' action posts 'SNOOZE_HABIT' message to client.
    console.log(`Service Worker: Snooze action triggered for habit ID: ${habitId}`);
    const snoozeMinutes = 5;
    const newSnoozeTimestamp = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          clientList.forEach(client => {
            console.log(`Service Worker: Sending SNOOZE_HABIT message to client ${client.id} for habit ${habitId}`);
            client.postMessage({
              type: 'SNOOZE_HABIT',
              habitId: habitId,
              snoozeUntil: newSnoozeTimestamp
            });
          });
        } else {
          console.log('Service Worker: No clients found to send SNOOZE_HABIT message.');
          // If no clients are open, the snooze state might not be saved in LocalStorage via script.js.
          // This is a limitation if the app is not open when snooze is clicked.
          // For a more robust solution, the SW might need to manage snoozed states itself (e.g., via IndexedDB).
        }
      })
    );
  } else {
    // Default action (if notification body is clicked, or for other actions in future)
    console.log(`Service Worker: Default click action for habit ID: ${habitId}`);
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
              break;
            }
          }
          if (client) {
            client.focus();
            console.log('Service Worker: Focused client window.');
          } else {
            clients.openWindow('/');
            console.log('Service Worker: Opened new client window.');
          }
        } else {
           clients.openWindow('/'); 
           console.log('Service Worker: No clients found, opened new window.');
        }
      })
    );
  }
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new service worker takes control immediately
});

// Fetch event: Serve assets from cache first, then network
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetch event for ->', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('Service Worker: Serving from cache ->', event.request.url);
          return response;
        }

        // Not in cache - fetch from network
        console.log('Service Worker: Fetching from network ->', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('Service Worker: Caching new resource ->', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Service Worker: Fetch failed; returning offline page if available or error', error);
          // Optionally, return a fallback offline page:
          // return caches.match('/offline.html'); 
        });
      })
  );
});
