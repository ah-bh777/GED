import { routers } from "./router/router";
import {RouterProvider} from 'react-router-dom'
 

const App = () => {

  return (<>
    <RouterProvider router={routers} />
  </>
  );
};

export default App;