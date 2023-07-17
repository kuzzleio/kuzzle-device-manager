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
  parent: null,
};

export const assetGroupTestParentBody1: AssetsGroupsBody = {
  name: "Test parent 1",
  children: [assetGroupTestChildrenId1],
  parent: null,
};

export const assetGroupTestParentBody2: AssetsGroupsBody = {
  name: "Test parent 2",
  children: [assetGroupTestChildrenId2],
  parent: null,
};

export const assetGroupTestChildrenBody1: AssetsGroupsBody = {
  name: "Test children 1",
  children: [],
  parent: assetGroupTestParentId1,
};

export const assetGroupTestChildrenBody2: AssetsGroupsBody = {
  name: "Test children 2",
  children: [],
  parent: assetGroupTestParentId2,
};

export const assetGroupParentWithAssetBody: AssetsGroupsBody = {
  name: "Parent Group with asset",
  children: [assetGroupChildrenWithAssetId],
  parent: null,
};

export const assetGroupChildrenWithAssetBody: AssetsGroupsBody = {
  name: "Children Group with asset",
  children: [],
  parent: assetGroupParentWithAssetId,
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
