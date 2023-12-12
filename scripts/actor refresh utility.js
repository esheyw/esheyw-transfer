if (canvas.tokens.controlled.length > 1) return ui.notifications.error("Please select only a single token.");
const token = canvas.tokens.controlled[0] ?? game.user.character?.getActiveTokens()[0];
if (!token) return ui.notifications.error("Please select exactly one token or assign yourself a character.");

Handlebars.registerHelper({
    eq: (v1, v2) => v1 === v2,
    ne: (v1, v2) => v1 !== v2,
    lt: (v1, v2) => v1 < v2,
    gt: (v1, v2) => v1 > v2,
    lte: (v1, v2) => v1 <= v2,
    gte: (v1, v2) => v1 >= v2,
    and() {
        return Array.prototype.every.call(arguments, Boolean);
    },
    or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    }
});
const style = `
<style>
.actor-refresh-utility img {
  width: 3rem;
  height: 3rem;
}
.actor-refresh-utility .actor-container {
  width: 100%;
  display: flex;
}
.actor-refresh-utility .actor-container span {
  display: inline-flex;
  align-items: center;
  margin: auto;
  font-size: 1.5em
}
.actor-refresh-utility .hidden-div {
  display: none;
}
.actor-refresh-utility #force-div,
.actor-refresh-utility #backup-div {
  margin: 1em;
}
</style>
`;
const labels = {
  action: "PF2E.ActionActionsLabel",
  ancestry: "TYPES.Item.ancestry",
  heritage: "TYPES.Item.heritage",
  background: "TYPES.Item.background",
  class: "TYPES.Item.class",
  feat: "PF2E.Item.Feat.Plural",
  spell: "PF2E.Item.Spell.Plural",
  inventory: "PF2E.TabInventoryLabel",
  items: "PF2E.Item.Plural",
  dance: "Level-0-and-Back Dance",
  backup: "SETUP.BACKUPS.Backup",
};
const templateData = {
  token,
  actor,
  labels,
  options: [
    {
      value: "action",
      allowedTypes: ["character", "npc"],
    },
    {
      value: "ancestry",
      allowedTypes: ["character"],
    },
    {
      value: "heritage",
      allowedTypes: ["character"],
    },
    {
      value: "background",
      allowedTypes: ["character"],
    },
    {
      value: "class",
      allowedTypes: ["character"],
    },
    {
      value: "feat",
      allowedTypes: ["character"],
    },
    {
      value: "spell",
      allowedTypes: ["character","npc"],
    },
    {
      value: "inventory",
      allowedTypes: ["character","npc", "party"],
    },
    {
      value: "dance",
      allowedTypes: ["character"],
      // checked: true,
    },
  ],
};
const template = `
<h2>Select Refresh Options {{actorType}}</h2>
<h3>Selected Actor:</h3>
<div class="actor-container">
  <img src="{{token.document.texture.src}}" />
  <span>{{actor.name}}</span>
</div>
<form>
  <div class="form-group">
    <button type="button" id="select-all">Select All</button>
    <button type="button" id="invert">Invert Selection</button>
  </div>
  <div class="form-group">    
    <fieldset id="refresh-options">    
    {{#each options as |option|}}      
        <div class="flexrow{{#unless (includes option.allowedTypes ../actor.type)}} hidden-div{{/unless}}">
          <label for="{{option.value}}">{{#with (lookup ../labels [value])}}{{localize .}}{{/with}}</label>
          <div class="form-fields">
            <input type="checkbox" name="{{option.value}}" id="{{option.value}}" {{checked option.checked}}/>
          </div>
        </div>
    {{/each}}
    </fieldset>
  </div>
  <div class="form-group" id="force-div">    
    <div class="flexrow">
      <label for="force">Attempt to auto-update Granters and things with ChoiceSets?</label>
      <input type="checkbox" name="force" id="force" />
    </div>
  </div>
  <div class="form-group" id="backup-div">    
    <div class="flexrow">
      <label for="force">Create a backup of the selected actor before continuing?</label>
      <input type="checkbox" name="backup" id="backup" checked />
    </div>
  </div>
</form>
`;
function aruRenderCallback(html) {
  const checkboxes = html.querySelectorAll('#refresh-options input[type=checkbox]');
  
  const selectAll = html.querySelector('#select-all');
  selectAll.addEventListener('click', () => {
    for (const box of checkboxes) box.checked = true;
  });
  const invert = html.querySelector('#invert');
  invert.addEventListener('click', () => {
    for (const box of checkboxes) box.checked = !box.checked;
  });
}
const body = Handlebars.compile(template)(templateData);
const dialogData = {
  title: `Actor Refresh Utility`,
  content: style + body,
  close: () => false,
  buttons: {
    refresh: {
      label: `Refresh`,
      icon: `<i class="fa-solid fa-arrows-rotate"></i>`,
      callback: (html) => new FormDataExtended(html.querySelector("form")).object,
    },
    cancel: {
      label: `Cancel`,
      icon: `<i class="fa-solid fa-times"></i>`,
      callback: () => false,
    },
  },
  default: `refresh`,
  render: aruRenderCallback,
};
const dialogOptions = {
  width: 350,
  jQuery: false,
  classes: ["actor-refresh-utility"],
};
const response = await Dialog.wait(dialogData, dialogOptions);
if (!response) return;

const unrefreshed = {};
const refreshed = {};
const actionables = Object.entries(response).filter(([type,selected]) => selected && !['force','backup'].includes(type)).map(([t,s]) => t);
if (response.backup) {
  const actorData = actor.toObject();
  actorData.name = `BACKUP ${actorData.name}`;
  await Actor.create(actorData);
}
for (const type of actionables) {
  if (type === 'dance') {
    const currentLevel = actor.level;
    await actor.update({"system.details.level.value": 0});
    await actor.update({"system.details.level.value": currentLevel});
    continue;
  }
  const types = type === 'inventory' ? ['armor','backpack','book','consumable','equipment','shield','treasure','weapon'] : [type];
  const items = [];
  for (const t of types) items.push(...actor.itemTypes[t]);
  
  unrefreshed[type] ??= [];
  refreshed[type] ??= [];
  for (const item of items) {    
    const grantedBy = item?.flags?.pf2e?.grantedBy;
    if (grantedBy) {
      //don't mark unrefreshed if the dance would refresh it
      const granter = actor.items.get(grantedBy.id);
      if (granter?.category === 'classFeature') continue; 
      unrefreshed[type].push({        
        item,
        reason: `Granted by "${granter?.name ?? '<em>Granter Not Found</em>'}".`
      });
      continue;
    }
    const sourceID = item?.flags?.core?.sourceId;
    if (!sourceID) {
      unrefreshed[type].push({
        item,
        reason: `Item does not have a listed compendium Source.`
      });
      continue;
    }
    const newSource = await fromUuid(sourceID);
    if (!newSource) {
      unrefreshed[type].push({
        item,
        reason: `Item's compendium source not found (probably not reprinted).`
      })
      continue;
    }
    const newSourceData = newSource.toObject();
    const existingBlockingRules = (item.system?.rules ?? []).filter(r=>['GrantItem','ChoiceSet'].includes(r.key));
    const newBlockingRules = (newSource.system?.rules ?? []).filter(r=>['GrantItem','ChoiceSet'].includes(r.key));
    if (existingBlockingRules.length || newBlockingRules.length) {
      if (!response.force) {
        let reason = existingBlockingRules.length ? 
                      `Item` :
                      `Item's compendium source`;
        reason += ` contains rules preventing it from being refreshed simply.`;          
        unrefreshed[type].push({item, reason});
        continue;
      }
      
      const [existingGrants,existingChoices] = existingBlockingRules.partition(r => r.key === 'ChoiceSet');
      const [newGrants,newChoices] = newBlockingRules.partition(r => r.key === 'ChoiceSet');      
      const grantsMatch = !!Object.keys(diffObject(newGrants,existingGrants)).length;
      
      let choicesMatch = true;
      if (existingChoices.length === newChoices.length) {
        for (let i = 0; i < existingChoices.length; i++) {
          console.warn('choice!', {name:item.name, nc: newChoices[i], ec: existingChoices[i]});
          choicesMatch = !!Object.keys(diffObject(newChoices[i].choices,existingChoices[i].choices)).length
        }
      } else {
        // choicesMatch 
      }     
    } else {
      try {
        await item.refreshFromCompendium();
      } catch(error) {
        unrefreshed[type].push({
          item,
          reason: error.toString()
        });
        continue;
      }       
    }
    refreshed[type].push(item);
  }
}

const unrefreshedTemplateData = {
  labels,
  itemgroups: Object.entries(unrefreshed).map(([group,items]) => ({label:group, items})),
};
const unrefreshedCount = unrefreshedTemplateData.itemgroups.reduce((acc,curr) => acc += curr.items.length, 0);
let unrefreshedTemplate;
if (!unrefreshedCount) {
  unrefreshedTemplate = `
<h2>All Selected Items Refreshed!</h2>  
${actor.name}'s items of the selected types are now up to date to the best of this tool's ability.
`;
} else {
  unrefreshedTemplate = `
<h2>Unrefreshed Items</h2>
<table>
  {{#each itemgroups as |group|}}
  {{#if (gt items.length 0)}}
    <tr>
      <th colspan="2">{{#with (lookup ../labels [label])}}{{localize .}}{{/with}}</th>
    </tr>
    {{#each items as |item|}}
    <tr>
      <td>@UUID[{{item.uuid}}]</td>
      <td>{{item.reason}}</td>
    </tr>
    {{/each}}
  {{/if}}  
  {{/each}}
</table>
`;
}
// return console.warn((Handlebars.compile(unrefreshedTemplate))(unrefreshedTemplateData))
Dialog.prompt({
  title: `ARU Summary`,
  content: await TextEditor.enrichHTML((Handlebars.compile(unrefreshedTemplate))(unrefreshedTemplateData)),
  options: {
    jQuery: false,
    width: unrefreshedCount ? 600 : 400,
  }
});
console.warn(refreshed)