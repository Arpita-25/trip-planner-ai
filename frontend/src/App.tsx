import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import ChatPlan from "@/pages/ChatPlan";
import CreateTrip from "@/pages/CreateTrip";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/Register";
import TripDetail from "@/pages/TripDetail";
import Trips from "@/pages/Trips";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10" data-testid="auth-loading">
        <div className="h-48 animate-pulse rounded-3xl bg-sand" />
        <div className="h-64 animate-pulse rounded-3xl bg-sand" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Shell>
              <Landing />
            </Shell>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/trips"
          element={
            <Shell>
              <RequireAuth>
                <Trips />
              </RequireAuth>
            </Shell>
          }
        />
        <Route
          path="/plan"
          element={
            <Shell>
              <RequireAuth>
                <ChatPlan />
              </RequireAuth>
            </Shell>
          }
        />
        <Route
          path="/create-trip"
          element={
            <Shell>
              <RequireAuth>
                <CreateTrip />
              </RequireAuth>
            </Shell>
          }
        />
        <Route
          path="/trips/:tripId"
          element={
            <Shell>
              <RequireAuth>
                <TripDetail />
              </RequireAuth>
            </Shell>
          }
        />
        <Route
          path="/trips/:tripId/:tab"
          element={
            <Shell>
              <RequireAuth>
                <TripDetail />
              </RequireAuth>
            </Shell>
          }
        />
        <Route
          path="*"
          element={
            <Shell>
              <NotFound />
            </Shell>
          }
        />
      </Routes>
      <Toaster richColors />
    </>
  );
}
