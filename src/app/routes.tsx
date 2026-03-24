import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ApplicationRegistration } from "./pages/ApplicationRegistration";
import { QCChecklist } from "./pages/QCChecklist";
import { IncidentAnalysis } from "./pages/IncidentAnalysis";
import { Reports } from "./pages/Reports";
import { QCPolicySettings } from "./pages/QCPolicySettings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "register",
        Component: ApplicationRegistration,
      },
      {
        path: "checklist",
        Component: QCChecklist,
      },
      {
        path: "incidents",
        Component: IncidentAnalysis,
      },
      {
        path: "reports",
        Component: Reports,
      },
      {
        path: "settings",
        Component: QCPolicySettings,
      },
    ],
  },
]);