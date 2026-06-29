import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserRole,
} from "../../api/user.api.js";
import UserModal from "../../components/modals/UserModal.jsx";
import DeleteModal from "../../components/modals/DeleteModal.jsx";

const ROLE_FILTERS = [
  { value: "all",   label: "All" },
  { value: "user",  label: "Users" },
  { value: "admin", label: "Admins" },
];

const UsersAdmin = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const queryClient = useQueryClient();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", currentPage, searchTerm, roleFilter],
    queryFn: () => getAllUsers({ page: currentPage, limit: 10, search: searchTerm, role: roleFilter }),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => queryClient.invalidateQueries(["users"]),
    onError: (error) => {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleUpdateUser = (formData) => {
    updateMutation.mutate({ userId: selectedUser._id, userData: formData });
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (window.confirm(`Change ${user.name}'s role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId: user._id, role: newRole });
    }
  };

  const handleDeleteUser = () => deleteMutation.mutate(userToDelete._id);

  const users = data?.data || [];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage accounts and permissions</p>
        </div>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Role filter pills */}
            <div className="flex gap-1.5">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleRoleFilterChange(f.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    roleFilter === f.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle size={32} className="mb-2 text-red-300" />
              <p className="text-sm text-red-400">Error loading users: {error.message}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Users size={36} className="mb-2" />
              <p className="text-sm font-medium text-gray-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-100"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <UserIcon size={16} className="text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </td>

                        {/* Role — clickable toggle */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleRole(user)}
                            title="Click to toggle role"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80 ${
                              user.role === "admin"
                                ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <><Shield size={11} /> Admin</>
                            ) : (
                              <><UserIcon size={11} /> User</>
                            )}
                          </button>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                              className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                              className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && (
                <div className="px-5 py-4 flex items-center justify-between border-t border-gray-50 bg-gray-50/50">
                  <p className="text-xs text-gray-400">
                    Page{" "}
                    <span className="font-semibold text-gray-700">{data.currentPage}</span> of{" "}
                    <span className="font-semibold text-gray-700">{data.totalPages}</span>
                    {" "}·{" "}
                    <span className="font-semibold text-gray-700">{data.total}</span> total users
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={currentPage === data.totalPages}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal
        key={selectedUser?._id || "edit"}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        onSubmit={handleUpdateUser}
        isLoading={updateMutation.isPending}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={handleDeleteUser}
        itemName={userToDelete?.name}
        itemType="user"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default UsersAdmin;