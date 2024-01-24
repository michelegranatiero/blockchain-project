import ReactDOM from "react-dom/client";
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import "./style.css";

//layouts
import RootLayout from "./Layouts/RootLayout";

//pages
import Home from "./Pages/Home";
import MyTasks from "./Pages/MyTasks";
import Task from "./Pages/Task";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} >
      <Route index element={<Home />} />
      <Route path="/mytasks" element={<MyTasks />} />
      <Route path="/tasks/:id" element={<Task />} />
      <Route path="*" element={<div>{<Navigate to="/" />}</div>}></Route>
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
