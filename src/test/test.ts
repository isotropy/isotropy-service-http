import "mocha";
import "should";
import Server from "isotropy-webserver";
import * as path from "path";
import request = require("supertest");
import service from "../";

const projectDir = path.join(__dirname);

describe("isotropy-service-http", async () => {
  ["", "/static"].forEach(url => {
    it(`mounts a static directory as ${url}`, async () => {
      const config = {
        name: "server",
        type: "http",
        locations: [
          {
            type: "static",
            location: url || "/",
            path: "./fixtures/static"
          }
        ],
        listen: false
      };
      const app = await service(projectDir, config);

      const server = app.listen();
      const response = await request(server)
        .get(`${url}/hello.txt`)
        .expect(200);

      response.text.should.equal("hello, world!");
      server.close();
    });
  });

  ["", "/app"].forEach(url => {
    it(`mounts an isotropy app as ${url}`, async () => {
      const config = {
        name: "server",
        type: "http",
        locations: [
          {
            type: "nodejs",
            location: url || "/",
            main: "./fixtures/nodejs"
          }
        ],
        listen: false
      };
      const app = await service(projectDir, config);

      const server = app.listen();
      const response = await request(server)
        .get(`${url}/hello`)
        .expect(200);

      response.text.should.equal("hello, world");
      server.close();
    });
  });

  it(`mounts a static and nodejs location together`, async () => {
    const config = {
      name: "server",
      type: "http",
      locations: [
        {
          type: "static",
          location: "/static",
          path: "./fixtures/static"
        },
        {
          type: "static",
          location: "/",
          path: "./fixtures/docs"
        },
        {
          type: "nodejs",
          location: "/",
          main: "./fixtures/nodejs"
        }
      ],
      listen: false
    };
    const app = await service(projectDir, config);

    const server = app.listen();

    const response1 = await request(server)
      .get(`/static/hello.txt`)
      .expect(200);

    response1.text.should.equal("hello, world!");

    const response2 = await request(server)
      .get(`/hello`)
      .expect(200);

    response2.text.should.equal("hello, world");

    const response3 = await request(server)
      .get(`/readme.txt`)
      .expect(200);

    response3.text.should.equal("Nothing to see here.");

    server.close();
  });
});
