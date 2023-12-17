let needle = 'Strike';
let items = [];
for (const p of game.packs) {
    if (p.metadata.type !== 'Item') continue;
    const content = await p.getDocuments();
    for (item of content) {
        if (item.type !== 'equipment') continue;
        if (item.system?.rules?.filter(i => i.key === needle).length) items.push(item);
    }
}
console.warn(items)