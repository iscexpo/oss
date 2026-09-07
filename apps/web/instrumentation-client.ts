if (process.env.NODE_ENV === "production") {
  void import("botid/client/core").then(({ initBotId }) => {
    initBotId({
      protect: [
        {
          path: "/api/chat",
          method: "POST",
        },
      ],
    });
  });
}
