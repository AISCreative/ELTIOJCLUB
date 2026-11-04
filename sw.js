// Solo cachea la estructura de la aplicación; los datos del catálogo vienen de Firestore.
const CACHE='eltioj-sync-v3';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
// No interceptamos peticiones de Firebase ni de la aplicación: prioridad a contenido actual.
