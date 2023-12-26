
async function pickAThingDialog({things = null, title = null, thingType = 'Item'}={}) {
  if (!Array.isArray(things)) {
    throw Error('things must be an array of {name:,value:, img?:,identifier?:} objects')
  }
  const dialogStyle = `
  <style>
  .pick-a-thing.dialog .dialog-buttons {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .pick-a-thing.dialog img {
    width: 40px;
    height: 40px;
    margin: auto 2px auto 2px;
  }
  .pick-a-thing.dialog button {
    display: flex;
    flex-direction: row;
    justify-content: left;
    padding: 0px;
    margin: 0px;
  }
  .pick-a-thing.dialog button span.item-name {
    text-align: left;
    margin: auto;
    margin-left: 2%;
  }
  .pick-a-thing.dialog button span.dupe-id {
    font-size: 0.7em
    text-align: right;
    margin: auto;
    margin-right: 2%;
    color: var(--color-cool-3);
  }
  </style>
  `;
  const prependArticle = (word) => {
    const vowels = 'aeiou';
    const article = (vowels.indexOf(word[0].toLowerCase()) > -1) ? 'an ' : 'a ';
    return article + word; 
  };
  const buttons = things.reduce((acc,curr) => {
    let label = ``;
    if (!('name' in curr && 'value' in curr)) {
      console.error({badthing: curr});
      throw Error('Malformed Thing Provided');
    }
    if (curr?.img) {
      label += `<img src="${curr.img}" alt="${curr.name}" data-tooltip="${curr?.indentifier ?? curr.name}" />`
    }
    label += `<span class="item-name">${curr.name}</span>`
    if (curr?.identifier) {
      label += `<span class="dupe-id">(${curr.identifier})</span>`
    }
    acc[curr.value] = {label};
    return acc;
  },{})
  const dialogOptions = {
    jQuery: false,
    classes: ['pick-a-thing']
  }
  const dialogData = {
    title: title ?? `Pick a ${thingType ?? 'Thing'}`,
    content: dialogStyle,
    buttons,
    close: ()=> false
  }
  return await Dialog.wait(dialogData, dialogOptions);
}
const things = [
  {
    name: 'Hi there',
    value: 'hi-there'
  },
  {
    name: 'Goodbye',
    value: 'goodbye',
  }
]
console.warn(pickAThingDialog({things}))