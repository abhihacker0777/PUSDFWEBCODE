import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ADMIN_PASSWORD_MIN_LENGTH } from "./adminConstants";
import { RoleDropdown } from "./AdminShared";

export default function AdminUserRow({
  adminPasswordDrafts,
  adminSavingId,
  handleDeleteAdminUser,
  handleUpdateAdminUser,
  isDraftVisible,
  openRoleMenu,
  setAdminPasswordDrafts,
  setOpenRoleMenu,
  toggleDraftPassword,
  updateUserDraft,
  user
}) {
  const isOwner = Boolean(user.isOwner);
  const saving = adminSavingId === user.id;
  const draftPassword = adminPasswordDrafts[user.id] || "";
  const isPasswordVisible = isDraftVisible;

  return (
    <tr className={isOwner ? "bg-blue-50/50" : "bg-white hover:bg-gray-50/60"}>
      <td className="px-4 py-3">
        <input
          value={user.displayName || ""}
          onChange={(e) => updateUserDraft(user.id, { displayName: e.target.value })}
          disabled={isOwner}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none disabled:bg-transparent disabled:border-transparent"
        />
      </td>
      <td className="px-4 py-3 text-gray-700 font-semibold">{user.loginIdentifier || "-"}</td>
      <td className="px-4 py-3">
        <input
          value={user.email || ""}
          onChange={(e) => updateUserDraft(user.id, { email: e.target.value })}
          disabled={isOwner}
          placeholder="Optional"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none disabled:bg-transparent disabled:border-transparent"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <RoleDropdown
          id={`admin-role-${user.id || user.loginIdentifier}`}
          value={user.role || "view"}
          onChange={(role) => updateUserDraft(user.id, { role })}
          disabled={isOwner}
          openRoleMenu={openRoleMenu}
          setOpenRoleMenu={setOpenRoleMenu}
          className="min-w-[104px]"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={user.isActive !== false}
          onChange={(e) => updateUserDraft(user.id, { isActive: e.target.checked })}
          disabled={isOwner}
          className="w-5 h-5 accent-[#05488B]"
        />
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <input
            type={isPasswordVisible ? "text" : "password"}
            value={draftPassword}
            onChange={(e) => {
              setAdminPasswordDrafts((prev) => ({ ...prev, [user.id]: e.target.value }));
              toggleDraftPassword(user.id, true);
            }}
            disabled={isOwner}
            placeholder={isOwner ? "Locked" : "Blank keeps, min 10 to reset"}
            minLength={ADMIN_PASSWORD_MIN_LENGTH}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 outline-none disabled:bg-transparent"
          />
          {!isOwner && (
            <button
              type="button"
              onClick={() => toggleDraftPassword(user.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none disabled:opacity-50"
            >
              {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleUpdateAdminUser(user)}
            disabled={isOwner || saving}
            className="text-[#05488B] hover:text-[#043a70] font-bold px-4 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => handleDeleteAdminUser(user)}
            disabled={isOwner || saving}
            className="text-red-500 hover:text-red-700 font-bold px-4 py-1.5 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
