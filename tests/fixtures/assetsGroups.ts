import { AssetsGroupsBody } from "../../lib/modules/asset/types/AssetGroupContent";

export const assetGroupTestId = "test-group";
export const assetGroupTestParentId1 = "test-parent-1";
export const assetGroupTestParentId2 = "test-parent-2";
export const assetGroupTestChildrenId1 = "test-children-1";
export const assetGroupTestChildrenId2 = "test-children-2";
export const assetGroupParentWithAssetId = "test-parent-asset";
export const assetGroupChildrenWithAssetId = "test-children-asset";

export const assetGroupTestBody: AssetsGroupsBody = {
  name: "Test group",
  children: [],
  lastUpdate: Date.now(),
  parent: null,
  type: null,
};

export const assetGroupTestParentBody1: AssetsGroupsBody = {
  name: "Test parent 1",
  children: [assetGroupTestChildrenId1],
  lastUpdate: Date.now(),
  parent: null,
  type: "Type 1",
};

export const assetGroupTestParentBody2: AssetsGroupsBody = {
  name: "Test parent 2",
  children: [assetGroupTestChildrenId2],
  lastUpdate: Date.now(),
  parent: null,
  type: null,
};

export const assetGroupTestChildrenBody1: AssetsGroupsBody = {
  name: "Test children 1",
  children: [],
  lastUpdate: Date.now(),
  parent: assetGroupTestParentId1,
  type: null,
};

export const assetGroupTestChildrenBody2: AssetsGroupsBody = {
  name: "Test children 2",
  children: [],
  lastUpdate: Date.now(),
  parent: assetGroupTestParentId2,
  type: "Type 2",
};

export const assetGroupParentWithAssetBody: AssetsGroupsBody = {
  name: "Parent Group with asset",
  children: [assetGroupChildrenWithAssetId],
  lastUpdate: Date.now(),
  parent: null,
  type: null,
};

export const assetGroupChildrenWithAssetBody: AssetsGroupsBody = {
  name: "Children Group with asset",
  children: [],
  lastUpdate: Date.now(),
  parent: assetGroupParentWithAssetId,
  type: null,
};

export const assetGroupFixtures = {
  "assets-groups": [
    { index: { _id: assetGroupTestId } },
    assetGroupTestBody,
    { index: { _id: assetGroupTestParentId1 } },
    assetGroupTestParentBody1,
    { index: { _id: assetGroupTestParentId2 } },
    assetGroupTestParentBody2,
    { index: { _id: assetGroupTestChildrenId1 } },
    assetGroupTestChildrenBody1,
    { index: { _id: assetGroupTestChildrenId2 } },
    assetGroupTestChildrenBody2,
    { index: { _id: assetGroupParentWithAssetId } },
    assetGroupParentWithAssetBody,
    { index: { _id: assetGroupChildrenWithAssetId } },
    assetGroupChildrenWithAssetBody,
  ],
};
