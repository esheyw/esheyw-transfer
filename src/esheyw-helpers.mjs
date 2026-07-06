import { defaultConfig } from "./config.mjs";
export const MODULE_ID = "esheyw-transfer";
export const fu = foundry.utils;

class SettingDM extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      bool: new foundry.data.fields.BooleanField({ required: false, nullable: true, default: undefined }),
    };
  }
}

const packToTest = "esheyw-transfer.local-macros";
const AFIE = foundry.applications.elements.AbstractFormInputElement;
const AMSE = foundry.applications.elements.AbstractMultiSelectElement;
// const CME = foundry.applications.elements.HTMLCodeMirrorElement;

class TestFIE extends AFIE {
  static tagName = "test-fie";

  // static observedAttributes = [...super.observedAttributes, "min"];

  constructor() {
    super();
    // this._setValue("foo")
  }

  attributeChangedCallback(attr, oldV, newV) {
    console.warn("Attribute changed on TestFIE: ", { attr, oldV, newV });
    super.attributeChangedCallback(attr, oldV, newV);
  }
}

class TestMSE extends AMSE {
  static tagName = "test-mse";
}

class MinimalApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static PARTS = {
    part1: {
      template: `modules/${MODULE_ID}/templates/minimalapp.hbs`,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.field = new foundry.data.fields.StringField({ label: "String Field One", hint: "a hint" });
    context.actorUUIDs = game.actors.contents.map((a) => a.uuid);
    context.checkboxField = new foundry.data.fields.SetField(
      new foundry.data.fields.StringField({
        choices: {
          value1: "Value 1",
          value2: "Value 2",
          value3: "Value 3",
        },
      }),
    );
    context.checkboxValue = ["value1", "value3"];
    return context;
  }
}

Hooks.on("init", () => {
  console.warn(canvas.getLayerByEmbeddedName("Drawing"));
  CONFIG.esheyw = defaultConfig;
  game.settings.register(MODULE_ID, "booltest", {
    config: true,
    label: "A Boolean Test Setting",
    scope: "world",
    type: new foundry.data.fields.BooleanField(),
    input: (field, config) => {
      console.warn("custom input function run");
      delete config.input; // avoid infinite loops
      return field.toInput(config);
    },
  });

  // for (const documentName of CONST.ALL_DOCUMENT_TYPES) {
  //   Hooks.on(`get${documentName}ContextOptions`, (app, items) => {
  //     console.warn(`get${documentName}ContextOptions called: `, fu.deepClone({ app, items }));
  //   });
  // }

  customElements.define("test-fie", TestFIE);
  customElements.define("test-mse", TestMSE);
});

Hooks.once("setup", () => {});

Hooks.once("ready", async () => {
  //only fire once, for the gm
  if (!game.users.activeGM.isSelf) return;

  //if my players exist, set their colors (including mine), otherwise create them
  for (const userdata of Object.values(CONFIG.esheyw.users)) {
    const existingUser = game.users.getName(userdata.name);
    const existingData = existingUser?.toObject() ?? {};
    if (fu.isEmpty(fu.diffObject(existingData, userdata))) continue;
    else console.warn(`User ${userdata.name} requires updating`, userdata);
    const update = fu.flattenObject(userdata);
    if (existingUser) {
      existingUser.update(update);
    } else {
      User.create(update);
    }
  }
});

Hooks.once("ready", () => {
  Object.assign(globalThis, {
    // TestFIE,
    // TestMSE,
    fu,
    // MinimalApp,
    DialogV2: foundry.applications.api.DialogV2,
  });
  foundry.applications.apps.FilePicker.implementation.LAST_DISPLAY_MODE = "tiles";
});

Hooks.on("closeFilePicker", () => {
  FilePicker.LAST_DISPLAY_MODE = "tiles";
});
