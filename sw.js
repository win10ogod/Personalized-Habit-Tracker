// sw.js
const swLogStyle = 'background: navy; color: white; padding: 2px 4px; border-radius: 2px;';
function styledLog(message, ...args) {
    console.log(`%c[sw.js]`, swLogStyle, message, ...args);
}

const CACHE_NAME = 'habit-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  './sounds/bell.mp3', // Ensure sounds are cached for offline playback if SW handles sound
  './sounds/chime.mp3'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  styledLog('Install event triggered.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        styledLog('Caching app shell');
        return cache.addAll(urlsToCache)
          .then(() => {
            styledLog('Core assets cached successfully.');
          });
      })
      .catch(error => {
        console.error('[sw.js] Caching failed during install:', error);
      })
  );
});

// Message event: Receive data from client and show notification
// TEST_CASE_POINT: Verify this listener receives messages from script.js and calls self.registration.showNotification.
self.addEventListener('message', event => {
  styledLog('Message received in SW:', event.data);
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, habitId, reminderSound } = event.data.payload; // Ensure reminderSound is destructured
    styledLog(`SHOW_NOTIFICATION message received for habitId: ${habitId}`);
    // TEST_POINT: Manually verify notification appearance and actions (snooze button).
    styledLog(`Calling self.registration.showNotification for: ${title}`);
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: './icon.png', // Optional: ensure you have an icon.png
        data: { habitId: habitId }, // Pass habitId to notification data
        actions: [{ action: 'snooze', title: 'Snooze (5 min)' }],
        silent: reminderSound && reminderSound !== 'default' // Make notification silent if custom sound will be played by client
      })
      .then(() => {
        styledLog('Notification shown successfully.');
        // If a custom sound is selected, tell the client to play it
        // TEST_CASE_POINT: Verify correct sound file name is sent to client if reminderSound is not 'default'.
        if (reminderSound && reminderSound !== 'default') {
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
              styledLog(`Sending PLAY_SOUND message to client for ${reminderSound}`);
              clientList[0].postMessage({ // Send to the first available client
                type: 'PLAY_SOUND',
                soundFile: reminderSound
              });
            } else {
              styledLog('No clients found to send PLAY_SOUND message.');
            }
          }).catch(error => {
            console.error('[sw.js] Error matching clients for PLAY_SOUND:', error);
          });
        }
      })
      .catch(error => {
        console.error('[sw.js] Error showing notification:', error);
      })
    );
  }
});

// Notificationclick event: Handle notification click
self.addEventListener('notificationclick', event => {
  styledLog('notificationclick event triggered. Action:', event.action, 'HabitId:', event.notification.data.habitId);
  
  // TEST_POINT: Manually verify notification closes on click/snooze.
  const habitId = event.notification.data.habitId;
  event.notification.close(); // Close the notification in all cases

  if (event.action === 'snooze') {
    // TEST_CASE_POINT: Verify 'snooze' action posts 'SNOOZE_HABIT' message to client.
    styledLog(`Snooze action triggered for habit ID: ${habitId}`);
    const snoozeMinutes = 5;
    const newSnoozeTimestamp = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          clientList.forEach(client => {
            styledLog(`Posting SNOOZE_HABIT to clients for habitId: ${habitId}`);
            client.postMessage({
              type: 'SNOOZE_HABIT',
              habitId: habitId,
              snoozeUntil: newSnoozeTimestamp
            });
          });
        } else {
          styledLog('No clients found to send SNOOZE_HABIT message.');
        }
      })
    );
  } else {
    // Default action (if notification body is clicked, or for other actions in future)
    styledLog(`Default click action for habit ID: ${habitId}`);
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
            styledLog('Focused client window.');
          } else {
            clients.openWindow('/');
            styledLog('Opened new client window.');
          }
        } else {
           clients.openWindow('/'); 
           styledLog('No clients found, opened new window.');
        }
      })
    );
  }
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  styledLog('Activate event triggered.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            styledLog('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        styledLog('Old caches cleaned.');
      });
    })
  );
  return self.clients.claim(); // Ensure new service worker takes control immediately
});

// Fetch event: Serve assets from cache first, then network
self.addEventListener('fetch', event => {
  styledLog(`Fetch event for: ${event.request.url}`);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          // styledLog(`Serving from cache -> ${event.request.url}`); // Can be too verbose
          return response;
        }

        // Not in cache - fetch from network
        // styledLog(`Fetching from network -> ${event.request.url}`); // Can be too verbose
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
                // styledLog(`Caching new resource -> ${event.request.url}`); // Can be too verbose
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error(`[sw.js] Fetch failed for ${event.request.url};`, error);
          // Optionally, return a fallback offline page:
          // return caches.match('/offline.html'); 
        });
      })
  );
});
