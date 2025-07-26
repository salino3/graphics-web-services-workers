import React, { type JSX } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ContainerLayout } from "../layout";
import { HomePage } from "../pods";
import { routesApp } from ".";

interface PropsRoutes {
  path: string;
  element: JSX.Element;
}

const routes: PropsRoutes[] = [
  {
    path: routesApp?.root,
    element: <HomePage />,
  },

  // {
  //   path: routesApp?.dashboard,
  //   element: <Dashboard />,
  //  },
  {
    path: routesApp?.error404,
    element: <Navigate to={routesApp?.root} />,
  },
];

// Layout wrapper component
const LayoutWrapper: React.FC = () => (
  <ContainerLayout>
    <Outlet />
  </ContainerLayout>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={routesApp?.root} element={<LayoutWrapper />}>
        {routes &&
          routes?.length > 0 &&
          routes.map(({ path, element }) => {
            return <Route path={path} element={element} />;
          })}
      </Route>
    </Routes>
  );
};
