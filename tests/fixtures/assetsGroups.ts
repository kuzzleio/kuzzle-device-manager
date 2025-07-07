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
  lastUpdate: Date.now(),
  model: null,
  metadata: {},
  path: `${assetGroupTestId}`,
};
export const assetGroupParking: AssetsGroupsBody = {
  name: "Test group with parking model",
  children: [],
  lastUpdate: Date.now(),
  parent: null,
  model: "Parking",
  metadata: {},
};
export const assetGroupTestParentBody1: AssetsGroupsBody = {
  name: "Test parent 1",
  path: `${assetGroupTestParentId1}`,
  lastUpdate: Date.now(),
  model: "Type 1",
  metadata: {},
};

export const assetGroupTestParentBody2: AssetsGroupsBody = {
  name: "Test parent 2",
  path: `${assetGroupTestParentId2}`,
  lastUpdate: Date.now(),
  model: null,
  metadata: {},
};

export const assetGroupTestChildrenBody1: AssetsGroupsBody = {
  name: "Test children 1",
  lastUpdate: Date.now(),
  path: `${assetGroupTestParentId1}.${assetGroupTestChildrenId1}`,
  model: null,
  metadata: {},
};

export const assetGroupTestChildrenBody2: AssetsGroupsBody = {
  name: "Test children 2",
  lastUpdate: Date.now(),
  path: `${assetGroupTestParentId2}.${assetGroupTestChildrenId2}`,
  model: "Type 2",
  metadata: {},
};

export const assetGroupParentWithAssetBody: AssetsGroupsBody = {
  name: "Parent Group with asset",
  lastUpdate: Date.now(),
  path: `${assetGroupParentWithAssetId}`,
  model: null,
  metadata: {},
};

export const assetGroupChildrenWithAssetBody: AssetsGroupsBody = {
  name: "Children Group with asset",
  lastUpdate: Date.now(),
  path: `${assetGroupParentWithAssetId}.${assetGroupChildrenWithAssetId}`,
  model: null,
  metadata: {},
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
