const MODULE = "esheyw-transfer";
const fu = foundry.utils;

//Register hotkeys for settings and controls
Hooks.on("init", () => {
  game.keybindings.register(MODULE, "settingsHotkey", {
    name: `Open Settings menu`,
    editable: [
      {
        key: "KeyZ",
        modifiers: ["Alt"],
      },
    ],
    onDown: () => game.settings.sheet.render(true, { focus: true }),
  });
  game.keybindings.register(MODULE, "keybindingsHotkey", {
    name: `Open Configure Controls menu`,
    editable: [
      {
        key: "KeyX",
        modifiers: ["Alt"],
      },
    ],
    onDown: () => new KeybindingsConfig().render(true, { focus: true }),
  });
  game.keybindings.register(MODULE, "moduleManagementHotkey", {
    name: `Open Module Management`,
    editable: [
      {
        key: "KeyZ",
        modifiers: ["Alt", "Shift"],
      },
    ],
    onDown: () => new ModuleManagement().render(true, { focus: true }),
    restricted: true,
  });
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

  let gmmacros = game.folders.find((f) => f.type === "Macro" && f.name === "GM Actor Macros");
  if (!gmmacros) {
    gmmacros = await Folder.create({
      color: CONFIG.esheyw.colors["Gamemaster"],
      name: "GM Actor Macros",
      sorting: "a",
      type: "Macro",
    });
  }
  //create base macro folder for pc macros
  let pcmacros = game.folders.find((f) => f.type === "Macro" && f.name === "PC Macros");
  if (!pcmacros) {
    pcmacros = await Folder.create({
      color: CONFIG.esheyw.colors["PCs"],
      name: "PC Macros",
      sorting: "a",
      type: "Macro",
    });
  }
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
  for (const user of game.users) {
    //create macro folders for all non-gm players
    if (user.isGM) continue;
    let userfolder = game.folders.find((f) => f.type === "Macro" && f.name === user.name);
    if (!userfolder) {
      userfolder = await Folder.create({
        color: CONFIG.esheyw.colors[user.name] ?? "#000000",
        name: user.name,
        sorting: "a",
        type: "Macro",
        parent: pcmacros.id,
      });
    }
  }
});

Hooks.on("preCreateMacro", (document, data, options, userId) => {
  //cwarn(document, data, options);

  //new macros are scripts by default, and get a random int suffix
  if (data.name === "New Macro") {
    let newname = "";
    let i = 0;
    do {
      newname = "New Macro " + Math.floor(Math.random() * 100);
      i++;
    } while (game.macros.getName(newname) && i < 10);

    document.updateSource({
      name: newname,
      type: "script",
    });
    // this breaks some pf2e hotbar stuff, not using for now:
    //options.temporary = true;
  }
});

Hooks.on("hotbarDrop", (hbar, hdata, hslot) => {
  if (hdata.type === "RollOption" && hdata.actorId) {
    Hooks.once("preCreateMacro", (document, data, options, userId) => {
      let mfolder;
      let update = {};

      for (const u of game.users.filter((u) => !u.isGM)) {
        setProperty(update, `ownership.${u.id}`, 0);
        document.updateSource(update);
      }

      // append the actor name to the macro name
      fromactor = game.actors.get(hdata.actorId);
      update.name = data.name + ` (${fromactor.name})`;
      const existingmacro = game.macros.getName(update.name);
      if (existingmacro) {
        ui.notifications.warn("Toggle already exists! Grab it from the Macros Directory.");
        return false;
      }
      // put toggle macros into a folder for that user on creation
      if (!game.user.isGM) {
        mfolder = game.folders.find((folder) => folder.name === game.user.name && folder.type === "Macro");
        setProperty(update, `ownership.${game.user.id}`, 3);
      } else {
        //if the GM is creating a toggle for a player-owned actor, put it in their folder, give them ownership
        const [ownerid] = Object.entries(fromactor.ownership)
          .filter(([id, level]) => game.users.get(id) && !game.users.get(id)?.isGM && level === 3)
          .map(([id]) => id);
        if (ownerid) {
          //use first non-gm owner if multiple (shouldn't come up)
          const owner = game.users.get(ownerid);
          mfolder = game.folders.find((folder) => folder.name === owner.name && folder.type === "Macro");
          setProperty(update, `ownership.${owner.id}`, 3);
        } else {
          //the gm is creating a toggle for an npc
          cwarn("npc toggle!", update.ownership);
          mfolder = game.folders.find((folder) => folder.name === "GM Actor Macros" && folder.type === "Macro");
        }
      }
      if (mfolder) update.folder = mfolder.id;

      // add a notification toast relaying toggle status
      const waitidx = data.command.indexOf("await");
      let newcomm = data.command.replace("await actor", "const togglevalue = await actor");
      newcomm += '\nui.notifications.info(`${this.name} is ${togglevalue?"enabled":"disabled"}.`)';

      update.command = newcomm;

      document.updateSource(update);
    });
  }
});
