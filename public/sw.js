self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "New Question Paper Uploaded!";
    const options = {
      body: data.body || "A new question paper for your course is now available.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: {
        url: data.url || "/?source=pwa",
      },
      vibrate: [150, 75, 150],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Push event error:", err);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
