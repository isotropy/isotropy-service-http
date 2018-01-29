import koa = require("koa");
import { Server } from "http";
import koaStatic = require("koa-static");
import koaMount = require("koa-mount");
import IsotropyServer from "isotropy-webserver";

import exception from "./exception";

export interface ServiceConfig {
  type: string;
  name: string;
  nodes?: number;
  modules?: string[];
  port?: number;
  listen?: boolean;
}

export interface HttpServiceLocation {
  type: string;
  location: string;
}

export interface HttpServiceNodeJSLocation extends HttpServiceLocation {
  type: "nodejs";
  main: string;
}

export interface HttpServiceStaticLocation extends HttpServiceLocation {
  type: "static";
  path: string;
}

export interface HttpServiceConfig extends ServiceConfig {
  locations: HttpServiceLocation[];
}

async function handleNodeJSLocation(
  location: HttpServiceNodeJSLocation,
  config: HttpServiceConfig
) {
  const mod = require(location.main);
  const app = mod.default || mod;
  return typeof app === "function" ? app() : app;
}

async function handleStaticLocation(
  location: HttpServiceStaticLocation,
  config: HttpServiceConfig
) {
  const app = new koa();
  app.use(koaStatic(location.path));
  return app;
}

export default async function run(config: HttpServiceConfig) {
  const app = new koa();

  for (const loc of config.locations) {
    const subApp =
      loc.type === "static"
        ? await handleStaticLocation(loc as HttpServiceStaticLocation, config)
        : loc.type === "nodejs"
          ? await handleNodeJSLocation(loc as HttpServiceNodeJSLocation, config)
          : exception(
              `The location type ${
                loc.type
              } is unsupported. Valid options are 'static' or 'nodejs'.`
            );

    app.use(koaMount(loc.location, subApp));
  }

  if (config.listen !== false) {
    app.listen(config.port || 8080);
  }

  return app;
}
