interface Routes {
  root: string;
  dashboard: string;
  bars_graphic: string;
  error404: string;
}

export const routesApp: Routes = {
  root: "/graphics-web-services-workers/",
  dashboard: "/graphics-web-services-workers/dashboard/",
  bars_graphic: "/graphics-web-services-workers/bars_graphic/",
  error404: "/graphics-web-services-workers/*",
};
