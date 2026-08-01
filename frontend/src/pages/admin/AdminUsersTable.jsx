import AdminUserRow from "./AdminUserRow";

export default function AdminUsersTable({
  adminUsers,
  visibleDraftPasswordIds,
  ...rowProps
}) {
  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
      <div className="px-4 py-4 border-b border-gray-100 bg-white rounded-t-xl">
        <h2 className="text-lg font-bold text-[#05488b]">Admin Accounts</h2>
      </div>
      <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#ffc107]">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="border-b-2 border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Username</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Email</th>
              <th className="px-4 py-3 text-center text-gray-600 font-semibold">Role</th>
              <th className="px-4 py-3 text-center text-gray-600 font-semibold">Active</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">New Password</th>
              <th className="px-4 py-3 text-center text-gray-600 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {adminUsers.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-400">No admin users found.</td>
              </tr>
            )}
            {adminUsers.map((user) => (
              <AdminUserRow
                key={user.id || user.loginIdentifier}
                user={user}
                isDraftVisible={visibleDraftPasswordIds.has(user.id)}
                {...rowProps}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
