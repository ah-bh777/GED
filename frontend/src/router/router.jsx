import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../dashBoard";
import Report from "../reports";
import InfoTable from "../Table";
import LayOut from "../layout/layOut";
import SinglePage from "../singlePage";
import LogIn from "../LoginPage";
import ResgPage from "../RegisterPage"; 

export const routers = createBrowserRouter([
  {
    path: "/login",
    element: <LogIn />
  },
  {
    path: "/register",
    element: <ResgPage />
  },
  {
    element: <LayOut />, // ⬅ This layout must include <Outlet />
    children: [
      {
        path: "/table",
        element: <InfoTable />
      },
      {
        path: "/dashboard",
        element: <DashBoard />
      },
      {
        path: "/report",
        element: <Report />
      },
      {
        path: "/settings",
        element: <p>Settings page</p>
      },
      {
        path: "/detail/:id",
        element: <SinglePage />
      },
      {
        path: "*",
        element: <p>Page not found (Layout Routes)</p>
      }
    ]
  },
  {
    path: "*", // ✅ Global 404 fallback
    element: <p>Global page not found</p>
  }
]);
