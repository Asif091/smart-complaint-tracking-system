import UserManagement from "./pages/UserManagement";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import Complaints from "./pages/Complaints";
import SubmitComplaint from "./pages/SubmitComplaint";
import MyComplaints from "./pages/MyComplaints";

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
          element={user ? <SubmitComplaint /> : <Navigate to="/login" />}
        />

        <Route
          path="/my-complaints"
          element={user ? <MyComplaints /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}