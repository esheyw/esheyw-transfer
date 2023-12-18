const root = await fromUuid('Folder.8Sox1VKeQyImeq3K'); //Root folder of the structure
const exemplar = await fromUuid('Actor.2JHmrueGspK7wtSh'); //actor whose ownership you want to copy
function getIDsFromFolder(f) {
  let ids = [];
  for (const member of f.contents) {
    ids.push(member.id);
  }
  for (const child of f.children) {
    ids.push(getIDsFromFolder(child.folder))
  }
  return ids.flat(5);
}
async function applyOwnshipToFolderStructure(root,exemplar) {  
  const ids = getIDsFromFolder(root);
  const updates = ids.map(id=> {
    return foundry.utils.flattenObject({_id: id, ownership: exemplar.ownership})
  });
  const dc = CONFIG[root.type].documentClass;
  await dc.updateDocuments(updates);  
}
await applyOwnshipToFolderStructure(root,exemplar);