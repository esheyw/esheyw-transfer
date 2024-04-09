const MODULE = "esheyw-transfer";
const fu = foundry.utils;

Hooks.on("init", () => {
  CONFIG.esheyw = {
    users: {
      paul: {
        name: `Paul`,
        role: CONST.USER_ROLES.TRUSTED,
        color: "#21AC45",
        flags: {
          pf2e: {
            settings: {
              showEffectPanel: true,
              showCheckDialogs: false,
              showDamageDialogs: false,
              searchPackContents: false,
              monochromeDarkvision: true,
            },
          },
        },
      },
      lindsey: {
        name: `Lindsey`,
        role: CONST.USER_ROLES.TRUSTED,
        color: "#CC28C6",
        flags: {
          pf2e: {
            settings: {
              showEffectPanel: true,
              showCheckDialogs: false,
              showDamageDialogs: false,
              searchPackContents: false,
              monochromeDarkvision: true,
            },
          },
        },
      },
      nick: {
        name: `Nick`,
        role: CONST.USER_ROLES.TRUSTED,
        color: "#CC9028",
        flags: {
          pf2e: {
            settings: {
              showEffectPanel: true,
              showCheckDialogs: false,
              showDamageDialogs: false,
              searchPackContents: false,
              monochromeDarkvision: true,
            },
          },
        },
      },
      becca: {
        name: `Becca`,
        role: CONST.USER_ROLES.TRUSTED,
        color: "#4028CC",
        flags: {
          pf2e: {
            settings: {
              showEffectPanel: true,
              showCheckDialogs: false,
              showDamageDialogs: false,
              searchPackContents: false,
              monochromeDarkvision: true,
            },
          },
        },
      },
      dmpcs: {
        name: `DMPCs`,
        role: CONST.USER_ROLES.TRUSTED,
        color: "#B3292F",
        flags: {
          pf2e: {
            settings: {
              showEffectPanel: true,
              showCheckDialogs: false,
              showDamageDialogs: false,
              searchPackContents: false,
              monochromeDarkvision: true,
            },
          },
        },
      },
    },
    colors: {
      PCs: "#18591F",
      Gamemaster: "#368BA1",
      Becca: "#4028CC",
      Lindsey: "#CC28C6",
      Nick: "#CC9028",
      Paul: "#21AC45",
      DMPCs: "#B3292F",
    },
  };
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
