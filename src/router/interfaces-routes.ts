interface Routes {
  root: string;
  dashboard: string;
  error404: string;
}

export const routesApp: Routes = {
  root: "/graphics-web-services-workers/",
  dashboard: "/graphics-web-services-workers/dashboard/",
  error404: "/graphics-web-services-workers/*",
};
