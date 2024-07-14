import { defaultConfig } from "./config.mjs";

export const MODULE_ID = "esheyw-transfer";
export const fu = foundry.utils;

Hooks.on("init", () => {
  CONFIG.esheyw = defaultConfig;
});
Hooks.once("ready", async () => {
  //only fire once, for the gm
  if (!game.user.isGM) return;

  //if my players exist, set their colors (including mine), otherwise create them
  for (const userdata of Object.values(CONFIG.esheyw.users)) {
    const existingUser = game.users.getName(userdata.name);
    const update = fu.flattenObject(userdata);
    if (existingUser) {
      existingUser.update(update);
    } else {
      User.create(update);
    }
  }
});
Hooks.once("ready", () => {
  FilePicker.LAST_DISPLAY_MODE = "tiles";
});
Hooks.on("closeFilePicker", () => {
  FilePicker.LAST_DISPLAY_MODE = "tiles";
});
