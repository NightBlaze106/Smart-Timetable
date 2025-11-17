import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      console.log("Fetching users from Supabase...");
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error.message);
      } else {
        console.log("Users fetched:", data);
        setUsers(data);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">AI Timetable Generator</h1>
      <h2 className="text-lg mb-2">Users Table (Test Connection)</h2>
      <div className="bg-white shadow-md rounded p-4">
        {users.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Department</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Loading users...</p>
        )}
      </div>
    </div>
  );
}
