// 내 할 일 앱(/todo.html) 서비스 워커: 푸시 알림 표시와 알림 클릭 시 앱 열기만 한다.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "내 할 일", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "내 할 일";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/app/todo-icon-192.png",
      badge: "/app/todo-badge-96.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      vibrate: [120, 60, 120],
      data: { url: data.url || "/todo.html" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/todo.html", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (new URL(c.url).pathname === "/todo.html") {
          await c.focus();
          c.postMessage({ type: "open", url });
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
