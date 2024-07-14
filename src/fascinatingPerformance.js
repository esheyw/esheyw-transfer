//Check for exactly one selected token
if (canvas.tokens.controlled.length > 1) {
  return ui.notifications.error("Please select only a single token.");
}
const token = canvas.tokens.controlled[0] ?? game.user.character?.getActiveTokens()[0];
if (!token) {    
  return ui.notifications.error("Please select exactly one token or assign yourself a character.");
} 
const actor = token.actor;

const feat = actor.items.find(f=>f.slug==='fascinating-performance')
if (!feat) {
  return ui.notifications.error("Selected actor must have the Fascinating Performance feat.");
}
const {targets} = game.user;
if (!targets.size) {
  return ui.notifications.error("Must target at least one token");
}

const prfRank = actor.skills.performance.rank;
switch(prfRank) {
  case 0:
    return ui.notifications.error("Must be at least Trained in Performance to use, or even have taken, Fascinating Performance.");
  case 1:
    if (targets.size > 1) return ui.notifications.error("You are only Trained in performance, so are limited to a single target.");
    break;
  case 2:
    if (targets.size > 4) return ui.notifications.error("You are only Expert in performance, so are limited to 4 targets.");
    break;
  case 3:
    if (targets.size > 10) return ui.notifications.error("You are only Master in performance, so are limited to 10 targets.");
    break;
  case 4:
    break;
  default:
    return ui.notifications.error("You broke something");
}
let singleTarget = false;
if (targets.size === 1) singleTarget = true;

Handlebars.registerHelper("dosTable", (value, property="label") => {
  const dosTable = [
    {
      color: "var(--degree-critical-failure, rgb(255, 0, 0))",
      label: "Critical Failure"
    },
    {
      color: "var(--degree-failure, rgb(255, 69, 0))",
      label: "Failure"
    },
    {
      color: "var(--degree-success, rgb(0, 0, 255))",
      label: "Success"
    },
    {
      color: "var(--degree-critical-success, rgb(0, 128, 0))",
      label: "Critical Success"
    }
  ];
  if (!["color","label"].includes(property)) property = "label";
  return getProperty(dosTable[value], property);
});

const contentTemplate = `
<div class="pf2e chat-card action-card">
{{#if showPanache}}
  <section class="roll-note">
    <strong>Battledancer</strong>
    You gain @UUID[Compendium.pf2e.feat-effects.Item.uBJsxCzNhje8m8jj]
  </section>
{{/if}}
{{#if showFascinated}}
  <section class="roll-note">
    Noted targets become @UUID[Compendium.pf2e.conditionitems.Item.AdPVz7rbaVSRxHFg] for 1 round
  </section>
{{/if}}

{{#each targets as |target|}}
  {{log target}}
  <div data-actor-id="{{target.id}}">
    {{target.name}}: <span style='color: {{dosTable target.dos "color"}};'>{{dosTable target.dos "label"}}</span><br />
    DC: {{target.dc}} Total: {{target.rollTotal}} Fascinated: {{#if target.fascinated}}Yes{{else}}No{{/if}}
  </div>
{{/each}}

</div>
`;
const flavorTemplate = `
<h4 class="action">
  <span class="action-glyph">1</span>
  Fascinating Performance: <i class="fa-solid fa-dice-d20"></i><span {{#unless (isNullish d20dos)}}style="color: {{dosTable d20dos "color"}}"{{/unless}}>{{d20}}</span>
</h4>
`;
const compiledContentTemplate = Handlebars.compile(contentTemplate);
const compiledFlavorTemplate = Handlebars.compile(flavorTemplate);

//super janky hack to force the same d20 roll for all targets
const d20 = (await (new Roll('1d20')).evaluate()).total;

const ruleToAdd = 
{
  key: "SubstituteRoll",
  selector: "performance",
  value: d20,
  required: true
}
const originalRules = deepClone(feat.system.rules);
const rules = deepClone(originalRules)
rules.push(ruleToAdd);
await feat.update({
  "system.rules": rules
});

const isBattledancer = !!(actor.items.find(i=>i.slug==='battledancer') ?? false);
const isFocusedFascinator = !!(actor.items.find(i=>i.slug==='focused-fascination') ?? false);

const templateData = {
  showPanache: false,
  fascinated: false,
  targets: [],
  d20,
  d20dos: d20 === 1 ? 0 : d20 === 20 ? 3 : null,
};
try {
  for (const targetToken of targets) {
    const target = targetToken.actor;
    const immunityEffect = target.items.find(i => 
         i.name.toLowerCase().includes('immun') 
      && i.name.toLowerCase().includes('fascinating performance')
    );
    if (immunityEffect) {
      ui.notifications.warn(`Target "${targetToken.name}" is immune to being fascinated.`);
      continue;
    }
    const extraRollOptions = [];
    if (targetToken.inCombat) {
      extraRollOptions.push("incapacitation");
    }
    const dc = target.saves.will.dc.value
    const perfRoll = await actor.skills.performance.roll({
      async: true,
      createMessage: false,
      dc,
      item: feat,
      target,
      extraRollOptions
    });
  
    const dos = perfRoll.degreeOfSuccess;
    if (dos > 1 && isBattledancer) {
      templateData.showPanache = true;
    }
    const inCombat = (targetToken.inCombat && game.combat?.started);
    let thisTargetFascinated = false;
    if (dos === 3 || //either a crit success
         (dos === 2 && ((isFocusedFascinator && singleTarget) || !inCombat)) // or a regular success when that counts
       ) {
      templateData.showFascinated = true;
      thisTargetFascinated = true;   
    }
    templateData.targets.push({
      name: targetToken.name,
      rollTotal: perfRoll.total,
      inCombat: targetToken.inCombat,
      dos,
      dc,
      id: target.id,
      fascinated: thisTargetFascinated,
    })
  }
  
  
  await ChatMessage.create({
    flavor: compiledFlavorTemplate(templateData),
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({token: token}),
    content: compiledContentTemplate(templateData)
  });
} finally {
  await feat.update({
    "system.rules": originalRules
  });
}