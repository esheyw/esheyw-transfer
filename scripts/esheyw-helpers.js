const ESHEYW = 'esheyw-transfer';
//silence compatibility warnings - no longer needed, dedicated module handles this
//CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;

function isOwnedBy(doc, user) {
    //partially lifted from warpgate
    const corrected = doc instanceof TokenDocument ? doc.actor :
                      doc instanceof Token ? doc.document.actor : doc;
    const userID = user.id ?? user;
    if (corrected.ownership[userID] === 3) return true;
    return false;
}
//stolen from dragtohotbar, before it removed it inexplicably
function _esheywOpenPack(packName) {
  const targetPack = game.packs.get(packName);
  if (!targetPack)
    return cwarn(`Pack ${packName} not found.`);
  const openPack = Object.values(ui.windows).find(w => w.metadata?.label === targetPack.title);
  if (openPack?.rendered && openPack._minimized)
    openPack.maximize().then(() => openPack.bringToTop());
  else if (openPack?.rendered)
    openPack.bringToTop();
  else if (!openPack)
    game.packs.get(packName).render(true);
}


//partition array by filter
async function partition(array, filter) {
    let pass = [], fail = [];
    let len = array.length;
    for (let i = 0; i < len; i++) {
        (filter(array[i], i, array) ? pass : fail).push(array[i]);
    }
    return [pass, fail];
}

function pfDCbylevel(level) {
    let DCbyLevel = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50]
    let DC = 0
    if (level >= DCbyLevel.length || level < -1) {
        cwarn(`Given level ${level} out of bounds! Defaulting to 25.`);
        level = 26;
    }
    if (level === -1) {
        DC = 13;
    } else {
        DC = DCbyLevel[level];
    }
    return DC;
}

async function setInitSkill(actor, skillname='perception') {
    return await actor.update({
        'system.attributes.initiative.statistic': skillname
    });        
}

//Register hotkeys for settings and controls
Hooks.on('init',() => {
    game.keybindings.register(ESHEYW, 'settingsHotkey', {
        name: `Open Settings menu`,
		editable: [
			{
				key: "KeyZ",
				modifiers: ["Alt"]
			}
		],
        onDown: () => game.settings.sheet.render(true, {focus: true})
    })
    game.keybindings.register(ESHEYW, 'keybindingsHotkey', {
        name: `Open Configure Controls menu`,
		editable: [
			{
				key: "KeyX",
				modifiers: ["Alt"]
			}
		],
        onDown: () => new KeybindingsConfig().render(true, {focus: true})
    })
    game.keybindings.register(ESHEYW, 'moduleManagementHotkey', {
        name: `Open Module Management`,
		editable: [
			{
				key: "KeyZ",
				modifiers: ["Alt", "Shift"]
			}
		],
        onDown: () => new ModuleManagement().render(true, {focus: true}),
        restricted: true
    })
    CONFIG.esheyw = {
        colors: {
            'PCs':'#18591F',
            'Gamemaster':'#368BA1',
            'Becca':'#4028CC',
            'Lindsey':'#CC28C6',
            'Nick':'#CC9028',
            'Paul':'#21AC45',
            'DMPCs':'#B3292F',
        },
    };
})
Hooks.once('ready', async () => {
    //only fire once, for the gm
    if (!game.user.isGM) return;
    
    let gmmacros = game.folders.find(f => f.type === 'Macro' && f.name === 'GM Actor Macros');
    if (!gmmacros) {        
        gmmacros = await Folder.create({
            color: CONFIG.esheyw.colors['Gamemaster'],
            name: 'GM Actor Macros',
            sorting: 'a',
            type: 'Macro',
        });
    }
    //create base macro folder for pc macros
    let pcmacros = game.folders.find(f => f.type === 'Macro' && f.name === 'PC Macros');
    if (!pcmacros) {
        pcmacros = await Folder.create({
            color: CONFIG.esheyw.colors['PCs'],
            name: 'PC Macros',
            sorting: 'a',
            type: 'Macro',
        });
    }
    
    
    for (const user of game.users) {
        //if my players exist, set their colors (including mine)
        if (Object.keys(CONFIG.esheyw.colors).includes(user.name)) 
            user.update({color: CONFIG.esheyw.colors[user.name]});
        
        //create macro folders for all non-gm players
        if (user.isGM) continue;
        let userfolder = game.folders.find(f => f.type === 'Macro' && f.name === user.name);
        if (!userfolder) {
            userfolder = await Folder.create({
                color: CONFIG.esheyw.colors[user.name] ?? '#000000',
                name: user.name,
                sorting: 'a',
                type: 'Macro',
                parent: pcmacros.id
            });
        }
    
    }
    
});

Hooks.on('preCreateMacro', (document,data,options,userId) => {
    //cwarn(document, data, options);

    //new macros are scripts by default, and get a random int suffix
    if (data.name === 'New Macro') {
        let newname = '';
        let i = 0;
        do {
            newname = 'New Macro ' + Math.floor(Math.random() * 100);
            i++;
        } while (game.macros.getName(newname) && i < 10);
        
        document.updateSource({
            name: newname,
            type: 'script',
        });
        // this breaks some pf2e hotbar stuff, not using for now:
        //options.temporary = true;
    }
});

Hooks.on("hotbarDrop", (hbar, hdata, hslot) => {
    if (hdata.type === 'RollOption' && hdata.actorId) {
         Hooks.once('preCreateMacro', (document,data,options,userId) => {
            let mfolder;
            let update = {}; 
            
            for (const u of game.users.filter(u=>!u.isGM)) {
                setProperty(update, `ownership.${u.id}`, 0)
                document.updateSource(update);
            }

            
            
            
            // append the actor name to the macro name
            fromactor = game.actors.get(hdata.actorId);
            update.name = data.name + ` (${fromactor.name})`;
            const existingmacro = game.macros.getName(update.name);
            if (existingmacro) {
                ui.notifications.warn('Toggle already exists! Grab it from the Macros Directory.');
                return false;
            }
            // put toggle macros into a folder for that user on creation
            if (!game.user.isGM) {
                mfolder = game.folders.find(folder => folder.name === game.user.name && folder.type === "Macro");                
                setProperty(update, `ownership.${game.user.id}`, 3);
            } else {
                //if the GM is creating a toggle for a player-owned actor, put it in their folder, give them ownership
                const [ownerid] = Object.entries(fromactor.ownership)
                                    .filter(([id, level]) => game.users.get(id) && !game.users.get(id)?.isGM && level === 3)
                                    .map(([id, ]) => id);                 
                if (ownerid) {
                    //use first non-gm owner if multiple (shouldn't come up)
                    const owner = game.users.get(ownerid);
                    mfolder = game.folders.find(folder => folder.name === owner.name && folder.type === "Macro");
                    setProperty(update, `ownership.${owner.id}`, 3);
                } else { //the gm is creating a toggle for an npc
                    cwarn('npc toggle!', update.ownership);
                    mfolder = game.folders.find(folder => folder.name === 'GM Actor Macros' && folder.type === "Macro")
                }
            }
            if (mfolder) update.folder = mfolder.id;           
            
            // add a notification toast relaying toggle status
            const waitidx = data.command.indexOf('await')
            let newcomm = data.command.replace("await actor", 'const togglevalue = await actor')
            newcomm += '\nui.notifications.info(`${this.name} is ${togglevalue?"enabled":"disabled"}.`)';
                            
            update.command = newcomm;
            
            document.updateSource(update);
            
        }); 
    }
});