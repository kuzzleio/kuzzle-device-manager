import { GroupsBody } from "lib/modules/group/types/GroupContent";

export const groupTestId = "test-group";
export const groupTestParentId1 = "test-parent-1";
export const groupTestParentId2 = "test-parent-2";
export const groupTestChildrenId1 = "test-children-1";
export const groupTestChildrenId2 = "test-children-2";
export const groupParentWithAssetId = "test-parent-asset";
export const groupChildrenWithAssetId = "test-children-asset";

export const groupTestBody: GroupsBody = {
  name: "Test group",
  lastUpdate: Date.now(),
  model: "AssetRestricted",
  path: `${groupTestId}`,
};

export const groupTestParentBody1: GroupsBody = {
  name: "Test parent 1",
  path: `${groupTestParentId1}`,
  lastUpdate: Date.now(),
};

export const groupTestParentBody2: GroupsBody = {
  name: "Test parent 2",
  path: `${groupTestParentId2}`,
  lastUpdate: Date.now(),
  model: "DeviceRestricted",
};

export const groupTestChildrenBody1: GroupsBody = {
  name: "Test children 1",
  lastUpdate: Date.now(),
  path: `${groupTestParentId1}.${groupTestChildrenId1}`,
  model: null,
};

export const groupTestChildrenBody2: GroupsBody = {
  name: "Test children 2",
  lastUpdate: Date.now(),
  path: `${groupTestParentId2}.${groupTestChildrenId2}`,
  model: "Type 2",
};

export const groupParentWithAssetBody: GroupsBody = {
  name: "Parent Group with asset",
  lastUpdate: Date.now(),
  path: `${groupParentWithAssetId}`,
  model: null,
};

export const groupChildrenWithAssetBody: GroupsBody = {
  name: "Children Group with asset",
  lastUpdate: Date.now(),
  path: `${groupParentWithAssetId}.${groupChildrenWithAssetId}`,
  model: null,
};

export const groupFixtures = {
  groups: [
    { index: { _id: groupTestId } },
    groupTestBody,
    { index: { _id: groupTestParentId1 } },
    groupTestParentBody1,
    { index: { _id: groupTestParentId2 } },
    groupTestParentBody2,
    { index: { _id: groupTestChildrenId1 } },
    groupTestChildrenBody1,
    { index: { _id: groupTestChildrenId2 } },
    groupTestChildrenBody2,
    { index: { _id: groupParentWithAssetId } },
    groupParentWithAssetBody,
    { index: { _id: groupChildrenWithAssetId } },
    groupChildrenWithAssetBody,
  ],
};
