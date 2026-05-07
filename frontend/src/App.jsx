import UserManagement from "./pages/UserManagement";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import Complaints from "./pages/Complaints";
import SubmitComplaint from "./pages/SubmitComplaint";
import MyComplaints from "./pages/MyComplaints";
import ComplaintDetail from "./pages/ComplaintDetail";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/users" element={user ? <UserManagement /> : <Navigate to="/" />}/>

        <Route
          path="/complaints"
          element={user?.role === "admin" || user?.role === "staff" ? <Complaints /> : <Navigate to="/" />}
        />

        <Route
          path="/submit-complaint"
          element={user && user.role !== "admin" ? <SubmitComplaint /> : <Navigate to="/" />}
        />

        <Route
          path="/my-complaints"
          element={user && user.role !== "admin" ? <MyComplaints /> : <Navigate to="/" />}
        />
        <Route path="/complaint/:id" element={<ComplaintDetail />} />
        <Route path="/reports" element={user?.role === "admin" ? <ReportsPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}