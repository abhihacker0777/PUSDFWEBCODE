import { FiLogOut } from "react-icons/fi";

export default function AdminHeader({ activeTitle, authUser, loggedInLabel, loggedInRoleLabel, onLogout }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
      <h1 className="text-base font-bold text-gray-800 tracking-wide">
        {activeTitle}
      </h1>
      <div className="flex items-center gap-3">
        {authUser && (
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-bold text-gray-800 max-w-[220px] truncate">{loggedInLabel}</span>
            <span className="text-[11px] font-semibold text-[#05488b]">{loggedInRoleLabel}</span>
          </div>
        )}
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-red-500 bg-[#05488b] hover:bg-[#043a70] transition-all"><FiLogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></button>
      </div>
    </header>
  );
}
