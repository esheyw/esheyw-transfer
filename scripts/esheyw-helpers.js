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
  // Hooks.on("hotbarDrop", (hbar, hdata, hslot) => {
  //   if (hdata.type === "RollOption" && hdata.actorId) {
  //     Hooks.once("preCreateMacro", (document, data, options, userId) => {
  //       let mfolder;
  //       let update = {};

  //       for (const u of game.users.filter((u) => !u.isGM)) {
  //         setProperty(update, `ownership.${u.id}`, 0);
  //         document.updateSource(update);
  //       }

  //       // append the actor name to the macro name
  //       fromactor = game.actors.get(hdata.actorId);
  //       update.name = data.name + ` (${fromactor.name})`;
  //       const existingmacro = game.macros.getName(update.name);
  //       if (existingmacro) {
  //         ui.notifications.warn("Toggle already exists! Grab it from the Macros Directory.");
  //         return false;
  //       }
  //       // put toggle macros into a folder for that user on creation
  //       if (!game.user.isGM) {
  //         mfolder = game.folders.find((folder) => folder.name === game.user.name && folder.type === "Macro");
  //         setProperty(update, `ownership.${game.user.id}`, 3);
  //       } else {
  //         //if the GM is creating a toggle for a player-owned actor, put it in their folder, give them ownership
  //         const [ownerid] = Object.entries(fromactor.ownership)
  //           .filter(([id, level]) => game.users.get(id) && !game.users.get(id)?.isGM && level === 3)
  //           .map(([id]) => id);
  //         if (ownerid) {
  //           //use first non-gm owner if multiple (shouldn't come up)
  //           const owner = game.users.get(ownerid);
  //           mfolder = game.folders.find((folder) => folder.name === owner.name && folder.type === "Macro");
  //           setProperty(update, `ownership.${owner.id}`, 3);
  //         } else {
  //           //the gm is creating a toggle for an npc
  //           cwarn("npc toggle!", update.ownership);
  //           mfolder = game.folders.find((folder) => folder.name === "GM Actor Macros" && folder.type === "Macro");
  //         }
  //       }
  //       if (mfolder) update.folder = mfolder.id;

  //       // add a notification toast relaying toggle status
  //       const waitidx = data.command.indexOf("await");
  //       let newcomm = data.command.replace("await actor", "const togglevalue = await actor");
  //       newcomm += '\nui.notifications.info(`${this.name} is ${togglevalue?"enabled":"disabled"}.`)';

  //       update.command = newcomm;

  //       document.updateSource(update);
  //     });
  //   }
});
