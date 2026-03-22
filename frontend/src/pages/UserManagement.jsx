import { useEffect, useState } from "react";
import axios from "axios";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("employee");

  //  NEW STATES
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee"
  });

  const token = localStorage.getItem("token");

  const [editingUser, setEditingUser] = useState(null);

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
    try {
      await axios.post(
        "http://localhost:5000/api/users",
        newUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // reset form
      setShowForm(false);
      setNewUser({ name: "", email: "", password: "", role: "employee" });

      // refresh users
      fetchUsers();
    } catch (err) {
      console.error(err);
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

  const handleDeactivate = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/users/${id}/status`,
        {},
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

  const filteredUsers = users.filter(
    (user) => user.role === roleFilter
  );

  return (
    <div className="user-page">
      <h2 className="page-title">User Management</h2>

      <div className="user-controls">
        <div className="filter-buttons">
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
            <option value="employee">Employee</option>
            <option value="staff">Staff</option>
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`status ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => setEditingUser(user)}>Edit</button>

                  {user.status === "active" && (
                    <button onClick={() => handleDeactivate(user._id)}>
                      Deactivate
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