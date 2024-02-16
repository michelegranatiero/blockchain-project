import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from "react-router-dom";

//layouts
import RootLayout from "./Layouts/RootLayout";

//pages
import Home from "./Pages/Home";
import MyTasks from "./Pages/MyTasks";
import Task from "./Pages/Task";
import Account from "./Pages/Account";

// MetaMask
import { useMetaMask } from './hooks/useMetaMask';

function App() {
  const { wallet } = useMetaMask();

  const router = createBrowserRouter(

    createRoutesFromElements(
  
      <Route path="/" element={<RootLayout />} >
        <Route index element={<Home />} />
        <Route path="/mytasks" element={<MyTasks />} />
        {wallet.accounts.length > 0 && (
          <Route path="/account" element={<Account />} />
        )}
        <Route path="/tasks/:id" element={<Task />} />
        <Route path="*" element={<div>{<Navigate to="/" />}</div>}></Route>
      </Route>
    )
  );

  return(
    <RouterProvider router={router} />
  )
}

export default App;
