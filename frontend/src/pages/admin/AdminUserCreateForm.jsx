import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ADMIN_PASSWORD_MIN_LENGTH } from "./adminConstants";
import { cleanStatusMessage, isErrorStatus } from "./adminHelpers";
import { RoleDropdown } from "./AdminShared";

export default function AdminUserCreateForm({
  adminForm,
  adminSavingId,
  adminStatus,
  handleCreateAdminUser,
  openRoleMenu,
  setAdminForm,
  setOpenRoleMenu
}) {
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  return (
    <div className="relative z-50 border border-gray-200 rounded-xl shadow-sm bg-white overflow-visible">
      <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-[#05488b]">Add Admin User</h2>
      </div>
      <form onSubmit={handleCreateAdminUser} className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <input
          value={adminForm.displayName}
          onChange={(e) => setAdminForm((prev) => ({ ...prev, displayName: e.target.value }))}
          placeholder="Name"
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]"
        />
        <input
          value={adminForm.username}
          onChange={(e) => setAdminForm((prev) => ({ ...prev, username: e.target.value }))}
          placeholder="Username"
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]"
        />
        <input
          value={adminForm.email}
          onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email optional"
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]"
        />
        <div className="relative">
          <input
            type={showCreatePassword ? "text" : "password"}
            value={adminForm.password}
            onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Password min 10"
            minLength={ADMIN_PASSWORD_MIN_LENGTH}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 outline-none focus:border-[#ffc107]"
          />
          {adminForm.password && (
            <button
              type="button"
              onClick={() => setShowCreatePassword((show) => !show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
            >
              {showCreatePassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <RoleDropdown
            id="admin-create-role"
            value={adminForm.role}
            onChange={(role) => setAdminForm((prev) => ({ ...prev, role }))}
            openRoleMenu={openRoleMenu}
            setOpenRoleMenu={setOpenRoleMenu}
            className="min-w-0 flex-1"
          />
          <button
            type="submit"
            disabled={adminSavingId === "create"}
            className="bg-[#05488B] hover:bg-[#043a70] text-white px-5 py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 disabled:cursor-wait"
          >
            {adminSavingId === "create" ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
      {adminStatus && (
        <div className={`mx-4 mb-4 rounded-lg px-4 py-2 text-sm font-semibold ${isErrorStatus(adminStatus) ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
          {cleanStatusMessage(adminStatus)}
        </div>
      )}
    </div>
  );
}
