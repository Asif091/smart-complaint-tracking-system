import { useEffect, useState } from "react";
import axios from "axios";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");

  //  NEW STATES
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: ""
  });

  const token = localStorage.getItem("token");

  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  //  NEW FUNCTION
  const handleCreateUser = async () => {
    setError("");
    try {
      // Prepare data to send (include department only if role is employee)
      const userToSend = { ...newUser };
      if (userToSend.role !== "employee") {
        delete userToSend.department;
      }

      await axios.post(
        "http://localhost:5000/api/users",
        userToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // reset form
      setShowForm(false);
      setNewUser({ name: "", email: "", password: "", role: "employee", department: "" });

      // refresh users
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error creating user");
    }
  };
    const handleUpdateUser = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${editingUser._id}`,
        editingUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      // If user is active, deactivate. If inactive, reactivate
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      
      await axios.patch(
        `http://localhost:5000/api/users/${id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = roleFilter === "all" 
    ? users 
    : users.filter((user) => user.role === roleFilter);

  return (
    <div className="user-page">
      <h2 className="page-title">User Management</h2>

      <div className="user-controls">
        <div className="filter-buttons">
          <button onClick={() => setRoleFilter("all")}>All</button>
          <button onClick={() => setRoleFilter("admin")}>Admin</button>
          <button onClick={() => setRoleFilter("employee")}>Employees</button>
          <button onClick={() => setRoleFilter("staff")}>Staff</button>
        </div>

        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Create User
        </button>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="form-card">
          {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            placeholder="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />

          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="employee">Employee</option>
            <option value="staff">Staff</option>
          </select>

          {/* Department dropdown (only for employee role) */}
          {newUser.role === "employee" && (
            <select
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Marketing & Sales">Marketing & Sales</option>
              <option value="Software & Product Development">Software & Product Development</option>
            </select>
          )}

          <button className="btn-primary" onClick={handleCreateUser}>
            Submit
          </button>
        </div>
      )}

      {/* EDIT FORM */}
      {editingUser && (
        <div className="form-card">
          <h3>Edit User</h3>

          <input
            value={editingUser.name}
            onChange={(e) =>
              setEditingUser({ ...editingUser, name: e.target.value })
            }
          />

          <input
            value={editingUser.email}
            onChange={(e) =>
              setEditingUser({ ...editingUser, email: e.target.value })
            }
          />

          <select
            value={editingUser.role}
            onChange={(e) =>
              setEditingUser({ ...editingUser, role: e.target.value })
            }
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
            <option value="staff">Staff</option>
          </select>

          {/* Department dropdown in edit form - visible for all users */}
          <select
            value={editingUser.department || ""}
            onChange={(e) =>
              setEditingUser({ ...editingUser, department: e.target.value })
            }
          >
            <option value="">Select Department</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Finance">Finance</option>
            <option value="Marketing & Sales">Marketing & Sales</option>
            <option value="Software & Product Development">Software & Product Development</option>
          </select>

          <button className="btn-primary" onClick={handleUpdateUser}>
            Update
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="table-card">
         <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.department || "-"}</td>
                <td>
                  <span className={`status ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => setEditingUser(user)}>Edit</button>

                  {user.status === "active" ? (
                    <button onClick={() => handleToggleStatus(user._id, user.status)} className="btn-danger">
                      Deactivate
                    </button>
                  ) : (
                    <button onClick={() => handleToggleStatus(user._id, user.status)} className="btn-success">
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}