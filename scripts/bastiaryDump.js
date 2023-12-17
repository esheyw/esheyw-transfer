async function compendiumFilter(packs, indexfields=[], filter=null) {
  let out = [];
  const fields = (Array.isArray(indexfields) && indexfields.length) ? {fields: indexfields} : {};
  const indicies = await Promise.all(packs.map(p => game.packs.get(p).getIndex(fields)));
  for (let i=0; i < indicies.length; i++) {              
      const filtered = indicies[i].filter(filter);
      const mapped = await Promise.all(filtered.map(a => fromUuid('Compendium.'+packs[i]+'.'+a._id)));
      out.push(...mapped); 
  }
  return out;
}
const packs = ['pf2e.pathfinder-bestiary', 'pf2e.pathfinder-bestiary-2', 'pf2e.pathfinder-bestiary-3'];
const fields = ['system.details.level.value']
const fcallback = (a) => a.system.details.level.value < 3;
const monsters = await compendiumFilter(packs, fields, fcallback);