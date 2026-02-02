import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage.tsx";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import ProtectedPage from "../pages/ProtectedPage.tsx";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import Providers from "../Providers.tsx";

const router = createBrowserRouter([
  // Landing page — no session provider needed
  {
    path: "/",
    element: <LandingPage />,
  },
  // App routes wrapped with providers
  {
    path: "/",
    element: <Providers />,
    children: [
      {
        path: "/app",
        element: <HomePage />,
      },
      {
        path: "/auth/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/auth/sign-up",
        element: <SignUpPage />,
      },
      {
        path: "/auth/callback",
        element: <AuthCallbackPage />,
      },
      // Auth Protected routes
      {
        path: "/",
        element: <AuthProtectedRoute />,
        children: [
          {
            path: "/protected",
            element: <ProtectedPage />,
          },
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
