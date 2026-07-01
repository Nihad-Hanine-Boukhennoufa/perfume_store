import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Trash2, Search, ChevronLeft, ChevronRight,
  Shield, User as UserIcon, Users, AlertTriangle,
} from "lucide-react";
import { getAllUsers, deleteUser, updateUserRole } from "../../api/user.api.js";
import DeleteModal from "../../components/modals/DeleteModal.jsx";

const ROLE_FILTERS = [
  { value: "all",   label: "All"    },
  { value: "user",  label: "Users"  },
  { value: "admin", label: "Admins" },
];

const UsersAdmin = () => {
  const [currentPage,       setCurrentPage]       = useState(1);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [roleFilter,        setRoleFilter]        = useState("all");
  const [isDeleteOpen,      setIsDeleteOpen]      = useState(false);
  const [userToDelete,      setUserToDelete]      = useState(null);

  const queryClient = useQueryClient();
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const handleSearchChange     = (e)   => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleRoleFilterChange = (val) => { setRoleFilter(val); setCurrentPage(1); };

  const { data, isLoading, error } = useQuery({
    queryKey:        ["users", currentPage, searchTerm, roleFilter],
    queryFn:         () => getAllUsers({ page: currentPage, limit: 10, search: searchTerm, role: roleFilter }),
    placeholderData: keepPreviousData,
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess:  invalidate,
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess:  () => { invalidate(); setIsDeleteOpen(false); setUserToDelete(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const handleToggleRole = (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (window.confirm(`Change ${user.name}'s role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId: user._id, role: newRole });
    }
  };

  const users = data?.data ?? [];

  const inputStyle = {
    background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
    color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0, outline: "none",
  };

  return (
    <div className="p-6 lg:p-8" style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[9px] tracking-[5px] uppercase mb-1"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Admin</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 400, color: "var(--color-pearl)" }}>
            Users
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-smoke)" }} />
            <input type="text" placeholder="Search by name or email…" value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2.5 text-xs"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
            />
          </div>
          <div className="flex gap-2">
            {ROLE_FILTERS.map((f) => (
              <button key={f.value} onClick={() => handleRoleFilterChange(f.value)}
                className="px-4 py-2 text-[9px] tracking-[2px] uppercase transition-all duration-150"
                style={{
                  fontFamily:   "var(--font-body)", borderRadius: 0, border: "none", cursor: "pointer",
                  background:   roleFilter === f.value ? "var(--color-gold)"     : "var(--color-charcoal)",
                  color:        roleFilter === f.value ? "var(--color-obsidian)" : "var(--color-mist)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16">
              <AlertTriangle size={28} strokeWidth={1} style={{ color: "#c08080", marginBottom: 12 }} />
              <p className="text-sm" style={{ color: "#c08080", fontFamily: "var(--font-body)" }}>
                Error: {error.message}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Users size={32} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: 16 }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-mist)" }}>
                No users found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
                      {["User", "Email", "Role", "Joined", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] tracking-[2px] uppercase whitespace-nowrap"
                          style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", background: "var(--color-obsidian)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="transition-colors duration-150"
                        style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.image
                              ? <img src={user.image} alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                  style={{ border: "0.5px solid var(--color-charcoal)" }} />
                              : <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium uppercase"
                                  style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid var(--color-gold-dark)", color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                                  {user.name?.[0] ?? <UserIcon size={13} />}
                                </div>
                            }
                            <span className="text-sm font-medium"
                              style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                            {user.email}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button onClick={() => handleToggleRole(user)}
                            title="Click to toggle role"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] tracking-[1px] uppercase transition-all duration-150"
                            style={{
                              color:      user.role === "admin" ? "#b8a0d8"  : "#70a880",
                              background: user.role === "admin" ? "rgba(140,80,200,0.1)" : "rgba(30,80,50,0.15)",
                              border:     `0.5px solid ${user.role === "admin" ? "rgba(140,80,200,0.25)" : "rgba(60,120,80,0.25)"}`,
                              fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer",
                            }}>
                            {user.role === "admin"
                              ? <><Shield size={10} strokeWidth={1.5} /> Admin</>
                              : <><UserIcon size={10} strokeWidth={1.5} /> User</>
                            }
                          </button>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button onClick={() => { setUserToDelete(user); setIsDeleteOpen(true); }}
                            className="p-1.5 transition-colors duration-150"
                            style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#c08080")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                          ><Trash2 size={14} strokeWidth={1.5} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && (
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
                  <p className="text-[10px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                    Page <span style={{ color: "var(--color-pearl)" }}>{data.currentPage}</span> of{" "}
                    <span style={{ color: "var(--color-pearl)" }}>{data.totalPages}</span>
                    {" · "}<span style={{ color: "var(--color-pearl)" }}>{data.total}</span> users
                  </p>
                  <div className="flex gap-2">
                    {[
                      { Icon: ChevronLeft,  fn: () => setCurrentPage((p) => Math.max(1, p - 1)),              disabled: currentPage === 1               },
                      { Icon: ChevronRight, fn: () => setCurrentPage((p) => Math.min(data.totalPages, p + 1)), disabled: currentPage === data.totalPages  },
                    ].map(({ Icon, fn, disabled }, i) => (
                      <button key={i} onClick={fn} disabled={disabled}
                        className="p-2 transition-all duration-150 disabled:opacity-30"
                        style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-mist)", borderRadius: 0, cursor: disabled ? "not-allowed" : "pointer" }}
                        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = "var(--color-gold)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; }}
                      ><Icon size={14} strokeWidth={1.5} /></button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setUserToDelete(null); }}
        onConfirm={() => deleteMutation.mutate(userToDelete._id)}
        itemName={userToDelete?.name}
        itemType="user"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default UsersAdmin;