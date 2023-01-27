export function documentExists(index: string, collection: string, id: string) {
  return {
    controller: "document",
    action: "exists",
    index,
    collection,
    _id: id,
  };
}
