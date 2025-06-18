import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../dashBoard";
import Archive from "../ArchivePage";
import InfoTable from "../Table";
import LayOut from "../layout/layOut";
import SinglePage from "../singlePage";
import LogIn from "../LoginPage";
import ResgPage from "../RegisterPage"; 
import SinglePageArch from "../singlePageArch";
import AddFonc from "../AddFonctionnaire";
import AddDocs from "../AddDocuments";

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
    element: <LayOut />, 
    children: [
      {
        path: "/",
        element: <InfoTable />
      },
      {
        path: "/table",
        element: <InfoTable />
      },
      {
        path: "/dashboard",
        element: <DashBoard />
      },
      {
        path: "/archive",
        element: <Archive />
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
        path: "/detail-arch/:id",
        element: <SinglePageArch />
      },
      {
        path: "/add-fonctionnaire",
        element: <AddFonc />
      },
      {
        path: "/add-documents",
        element: <AddDocs />
      },
      {
        path: "*",
        element: <p>Page not found (Layout Routes)</p>
      }
    ]
  },
  {
    path: "*", 
    element: <p>Global page not found</p>
  }
]);
