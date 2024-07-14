//Check for exactly one selected token
if (canvas.tokens.controlled.length > 1) return ui.notifications.error("Please select only a single token.");
const token = canvas.tokens.controlled[0] ?? game.user.character?.getActiveTokens()[0];
if (!token) return ui.notifications.error("Please select exactly one token or assign yourself a character.");
const actor = token.actor;
async function pickItemFromActor(actor, {itemType=null, otherFilter=null, held=false, title=null, dialogOptions={}, silent=false}={})  {  
  const prependArticle = (word) => {
    const vowels = 'aeiou';
    const article = (vowels.indexOf(word[0].toLowerCase()) > -1) ? 'an ' : 'a ';
    return article + word; 
  }
  const PHYSICAL_TYPES = [
    "armor",
    "consumable",
    "equipment",
    "treasure",
    "weapon"
  ]
  let filteredItems;
  if (!itemType || itemType === 'physical') {
    itemType ??= "physical (default)";
    filteredItems = actor.items.filter(i => PHYSICAL_TYPES.includes(i.type)) ?? [];    
  } else {
    filteredItems = actor.items.filter(i => i.type === itemType) ?? [];
  }
  if (!filteredItems.length) {
    if (!silent) ui.notifications.error(`Selected actor lacks any items of type "${itemType}"`);
    return null;
  }
  
  if (otherFilter && typeof otherFilter === 'function') {
    filteredItems = filteredItems.filter(otherFilter);
    if (!filteredItems.length) {
      if (!silent) ui.notifications.error(`Provided filter 
      ${otherFilter.toString()}
      produced no items.`);
      return null;
    } 
  }
  
  if (held) {
    filteredItems = filteredItems.filter(i => i.system.equipped.carryType === 'held') ?? [];
    if (!filteredItems.length) {
      if (!silent) ui.notifications.error(`Selected actor is not holding any matching items.`);
      return null;
    }
  }
  
  if (filteredItems.length === 1) return filteredItems[0];
  
  const style = `<style>
  .esheyw-sel-item-dialog .dialog-buttons {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .esheyw-sel-item-dialog img {
    width: 40px;
    height: 40px;
    margin: auto 2px auto 2px;
  }
  .esheyw-sel-item-dialog button {
    display: flex;
    flex-direction: row;
    justify-content: left;
    padding: 0px;
    margin: 0px;
  }
  .esheyw-sel-item-dialog button span.item-name {
    text-align: left;
    margin: auto;
    margin-left: 2%;
  }
  .esheyw-sel-item-dialog button span.dupe-id {
    font-size: 0.7em
    text-align: right;
    margin: auto;
    margin-right: 2%;
    color: var(--color-cool-3);
  }
  </style>`;
  const names = {};
  for (const item of filteredItems) {
    names[item.name] ??= 0;
    names[item.name]++;
  }
  const buttons = Object.fromEntries(filteredItems.map(i => {
    let label = `<img src="${i.img}" alt="${i.name}" data-tooltip="${i.id}" /><span class="item-name">${i.name}</span>`;
    if (names[i.name] > 1) {
      label += `<span class="dupe-id">(${i.id})</span>`;
    }
    return [i.id, { label }];
  }));
  title ??= `Select ${prependArticle(itemType)}`.titleCase();
  const dialogData = {
    title,
    content: style,
    close: () => {return null;},
    buttons,
  };
  dialogOptions = mergeObject({
      classes: ["esheyw-sel-item-dialog"]
    },
    dialogOptions
  );
  const response = await Dialog.wait(dialogData, dialogOptions);
  return actor.items.get(response);
}
const FORBIDDEN_RUNES = [
  "bloodbane",
  "kinWarding"
];
const LC_JSON = `{"name":"Lashing Currents","type":"weapon","effects":[],"system":{"description":{"gm":"","value":""},"rules":[],"slug":null,"_migration":{"version":0.88,"lastMigration":null},"traits":{"otherTags":[],"value":["disarm","finesse","reach","trip","versatile-s"],"rarity":"common"},"publication":{"title":"","authors":"","license":"OGL","remaster":false},"level":{"value":0},"quantity":1,"baseItem":null,"hp":{"value":0,"max":0},"hardness":0,"weight":{"value":"-"},"equippedBulk":{"value":""},"price":{"value":{}},"equipped":{"carryType":"worn","invested":null,"handsHeld":0},"stackGroup":null,"negateBulk":{"value":"0"},"containerId":null,"size":"med","material":{"type":null,"grade":null},"identification":{"status":"identified","unidentified":{"name":"Unusual Weapon","img":"systems/pf2e/icons/unidentified_item_icons/weapon.webp","data":{"description":{"value":""}}},"misidentified":{}},"usage":{"value":"held-in-one-hand"},"category":"simple","group":"flail","bonus":{"value":0},"damage":{"dice":1,"die":"d4","damageType":"bludgeoning","persistent":null},"bonusDamage":{"value":0},"splashDamage":{"value":0},"range":null,"reload":{"value":null},"potencyRune":{"value":null},"strikingRune":{"value":null},"specific":{"value":true},"propertyRune1":{"value":null},"propertyRune2":{"value":null},"propertyRune3":{"value":null},"propertyRune4":{"value":null},"property1":{"value":"","dice":0,"die":"","damageType":"","critDice":0,"critDie":"","critDamage":"","critDamageType":"","strikeConditionType":"","strikeConditionValue":null,"criticalConditionType":"","criticalConditionValue":null}},"_id":"7rgHJF6iysFJiGP9","img":"icons/magic/water/waves-water-blue.webp","folder":null,"sort":0,"ownership":{"default":0,"v0RvORcwGexWLCjc":3},"flags":{"pf2e":{"isLashingCurrents":true}},"_stats":{"systemId":"pf2e","systemVersion":"5.8.3","coreVersion":"11.315","createdTime":1699836861139,"modifiedTime":1699837109046,"lastModifiedBy":"v0RvORcwGexWLCjc"}}`;


const existingLC = await pickItemFromActor(actor, {
  // held: true,
  itemType: 'weapon',
  otherFilter: (i) => i.flags.pf2e.isLashingCurrents,
  silent: true,
});
if (!existingLC) {
  const relicWeapon = await pickItemFromActor(actor, {
    held: true,
    itemType: 'weapon'
  });  
  if (!relicWeapon) return ui.notifications.warn('No weapon selected.');
  const relicWeaponData = relicWeapon.toObject();
  const LC_DATA = JSON.parse(LC_JSON);
  LC_DATA.system.strikingRune.value = relicWeaponData.system.strikingRune.value;
  LC_DATA.system.potencyRune.value = relicWeaponData.system.potencyRune.value;
  const propertyRunes = [];
  for (let i = 1; i <= 4; i++) {
    const rune = relicWeaponData.system[`propertyRune${i}`].value;
    if (!rune || FORBIDDEN_RUNES.includes(rune)) continue;
    propertyRunes.push(rune)
  }
  
  for (let i = 0; i < propertyRunes.length; i++) {
    LC_DATA.system[`propertyRune${i+1}`] = {value: propertyRunes[i]};
  }
  
  LC_DATA.flags.pf2e.originalRelicWeapon = JSON.stringify(relicWeaponData);
  const [lashingCurrents] = await actor.createEmbeddedDocuments("Item",[LC_DATA]);
  await lashingCurrents.update({
    "system.equipped.carryType": relicWeapon.system.equipped.carryType,
    "system.equipped.handsHeld": relicWeapon.system.equipped.handsHeld    
  });
  await relicWeapon.delete();
} else {
  const originalRelicWeaponData = JSON.parse(existingLC.flags.pf2e.originalRelicWeapon);
  const [originalRelicWeapon] = await actor.createEmbeddedDocuments("Item", [originalRelicWeaponData]);
  await originalRelicWeapon.update({
    "system.equipped.carryType": existingLC.system.equipped.carryType,
    "system.equipped.handsHeld": existingLC.system.equipped.handsHeld
  });
  await existingLC.delete();
}