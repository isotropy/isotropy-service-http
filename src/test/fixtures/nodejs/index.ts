import Server from "isotropy-webserver";

export default async function() {
  const app = new Server();
  app.addRoutes([
    [
      "GET",
      "/hello",
      async ctx => {
        ctx.body = "hello, world";
      }
    ]
  ]);
  return app;
}
