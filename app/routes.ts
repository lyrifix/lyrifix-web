import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/layout.tsx", [
    index("routes/home.tsx"),
    route("/songs/:slug", "routes/song-slug.tsx"),
    route("/login", "routes/login.tsx"),
  ]),
] satisfies RouteConfig;
