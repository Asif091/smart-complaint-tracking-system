import UserManagement from "./pages/UserManagement";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import Complaints from "./pages/Complaints";

export default function App() {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={ <HomePage /> } />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/users"
          element={user ? <UserManagement /> : <Navigate to="/" />}
        />

        <Route
          path="/complaints"
          element={user ? <Complaints /> : <Navigate to="/" />}
        />

        <Route
          path="/register"
          element={user ? <Complaints /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
        
        <Route 
          path="/register" 
          element={user ? <Complaints /> : <Navigate to="/" />} />
        <Route 
          path="/track" 
          element={user ? <Complaints /> : <Navigate to="/" />} />

      </Routes>
    </Layout>
  );
}