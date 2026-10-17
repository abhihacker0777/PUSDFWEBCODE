if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(function (regs) {
      for (const reg of regs) {
        if (!reg.active?.scriptURL?.endsWith("/sw.js")) {
          void reg.unregister();
        }
      }
    })
    .catch(function () {});
}
