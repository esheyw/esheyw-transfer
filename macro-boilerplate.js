//select exactly one token
if (canvas.tokens.controlled.length !== 1) {
  ui.notifications.warn("Please select exactly one token.");
  return;
}


//fallback to assigned character
const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character

//select  one or more tokens
if (!(canvas.tokens.controlled.length >= 1)) {
  ui.notifications.warn("Please select at least one token.");
  return;
}

//is token(s) in current combat
const combatantIDs = game.combat.combatants.map(c => c.actor.id);
for (t of canvas.tokens.controlled) {        
  if (!(combatantIDs.includes(t.actor.id))) {
      ui.notifications.warn(`Selected token ${t.name} is not in initiative.`);
      return;
  }
}


//get player vs non-player tokens
//partition = [falsy, truey]
const tokens = canvas.tokens.placeables;
const [npcTokens, pcTokens] = tokens.partition(t => t.actor.hasPlayerOwner);



//Check for one or more selected tokens:
const tokens = canvas.tokens.controlled;
if (!tokens.length) {
  const charToken = game.user.character?.getActiveTokens()[0];
  if (!charToken) {
      ui.notifications.warn("Please select at least one token or assign yourself a character.");
      return;
  } else {
      tokens.push(charToken);
  }
}
for (const token of tokens) {
  
}

//Check for exactly one selected token
if (canvas.tokens.controlled.length > 1) return ui.notifications.error("Please select only a single token.");
const token = canvas.tokens.controlled[0] ?? game.user.character?.getActiveTokens()[0];
if (!token) return ui.notifications.error("Please select exactly one token or assign yourself a character.");


//pf2e UUIDs for stuff
Torch: Compendium.pf2e.equipment-srd.8Jdw4yAzWYylGePS