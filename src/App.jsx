import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from "react-router-dom";

//layouts
import RootLayout from "@/Layouts/RootLayout";

//pages
import Home from "@/Pages/Home";
import Task from "@/Pages/Task";

// MetaMask
import { useMetaMask } from '@/hooks/useMetaMask';

function App() {
  const { wallet } = useMetaMask();

  const router = createBrowserRouter(

    createRoutesFromElements(
  
      <Route path="/" element={<RootLayout />} >
        <Route index element={<Home />} />
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
