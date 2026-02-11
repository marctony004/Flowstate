import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage.tsx";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import Providers from "../Providers.tsx";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import DashboardHomePage from "../pages/dashboard/DashboardHomePage.tsx";
import ProjectsPage from "../pages/dashboard/ProjectsPage.tsx";
import ProjectDetailPage from "../pages/dashboard/ProjectDetailPage.tsx";
import IdeasPage from "../pages/dashboard/IdeasPage.tsx";
import TasksPage from "../pages/dashboard/TasksPage.tsx";
import CollaboratorsPage from "../pages/dashboard/CollaboratorsPage.tsx";
import SettingsPage from "../pages/dashboard/SettingsPage.tsx";
import OnboardingPage from "../pages/dashboard/OnboardingPage.tsx";
import AnalyticsPage from "../pages/dashboard/AnalyticsPage.tsx";
import UsersPage from "../pages/dashboard/admin/UsersPage.tsx";

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
            path: "/onboarding",
            element: <OnboardingPage />,
          },
          {
            path: "/dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              { path: "projects", element: <ProjectsPage /> },
              { path: "projects/:id", element: <ProjectDetailPage /> },
              { path: "ideas", element: <IdeasPage /> },
              { path: "tasks", element: <TasksPage /> },
              { path: "collaborators", element: <CollaboratorsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "analytics", element: <AnalyticsPage /> },
              { path: "admin/users", element: <UsersPage /> },
            ],
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
