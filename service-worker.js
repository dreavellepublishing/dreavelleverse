// Network-only service worker: intentionally does not cache chapters, accounts, or API data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
