import Index from "./pages/Index";
import CarDetail from "./pages/CarDetail";
import ChatPage from "./pages/ChatPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCarForm from "./pages/AdminCarForm";
import AdminRoute from "./components/AdminRoute";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/carro/:id",
    name: "car-detail",
    element: <CarDetail />,
  },
  {
    path: "/chat/:carId",
    name: "chat",
    element: <ChatPage />,
  },
  {
    path: "/admin",
    name: "admin-login",
    element: <AdminLogin />,
  },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/adicionar",
    name: "admin-add-car",
    element: (
      <AdminRoute>
        <AdminCarForm />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/editar/:id",
    name: "admin-edit-car",
    element: (
      <AdminRoute>
        <AdminCarForm />
      </AdminRoute>
    ),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
