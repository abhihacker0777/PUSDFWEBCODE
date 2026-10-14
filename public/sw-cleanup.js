if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    for (var i = 0; i < regs.length; i++) {
      if (!regs[i].active || !regs[i].active.scriptURL.endsWith("/sw.js")) {
        regs[i].unregister();
      }
    }
  });
}
