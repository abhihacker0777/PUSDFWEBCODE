import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { ADMIN_PASSWORD_MIN_LENGTH } from "../utils/adminConstants";
import { RoleDropdown } from "../utils/AdminShared";

export interface AdminUserRowProps {
  adminPasswordDrafts: Record<string, string>;
  adminSavingId: string;
  handleDeleteAdminUser: (user: any) => void;
  handleUpdateAdminUser: (user: any) => void;
  isDraftVisible: boolean;
  openRoleMenu: string;
  setAdminPasswordDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setOpenRoleMenu: (id: string) => void;
  toggleDraftPassword: (id: string, forceVisible?: boolean) => void;
  updateUserDraft: (id: string, patch: any) => void;
  user: any;
}

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
}: Readonly<AdminUserRowProps>) {
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
          value={isOwner ? "full" : (user.role || "view")}
          onChange={(role) => updateUserDraft(user.id, { role })}
          disabled={isOwner}
          openRoleMenu={openRoleMenu}
          setOpenRoleMenu={setOpenRoleMenu}
          className="min-w-[104px]"
        />
      </td>
      <td className="px-4 py-3 text-center">
        {isOwner ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Active (Owner)
          </span>
        ) : (
          <button
            type="button"
            onClick={() => updateUserDraft(user.id, { isActive: user.isActive === false })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              user.isActive !== false
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
            title="Click to toggle account status (Active / Deactivated)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                user.isActive !== false ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span>{user.isActive !== false ? "Active" : "Deactivated"}</span>
          </button>
        )}
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
          {!isOwner && draftPassword.length > 0 && (
            <button
              type="button"
              onClick={() => toggleDraftPassword(user.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none disabled:opacity-50"
            >
              {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

