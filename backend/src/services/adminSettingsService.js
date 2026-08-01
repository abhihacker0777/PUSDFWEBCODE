const sheetService = require("./adminSettings/settingsSheetService");
const { createBlockedUsersService } = require("./adminSettings/blockedUsersService");
const { createCustomRepliesService } = require("./adminSettings/customRepliesService");

function createAdminSettingsService() {
  return {
    ...createBlockedUsersService(sheetService),
    ...createCustomRepliesService(sheetService)
  };
}

module.exports = { createAdminSettingsService };
