import { AssetsGroupsBody } from "../../lib/modules/asset/types/AssetGroupContent";

export const assetGroupTestId = "test-group";
export const assetGroupTestParentId = "test-parent";
export const assetGroupTestChildrenId = "test-children";

export const assetGroupTestBody: AssetsGroupsBody = {
  name: "Test group",
  children: [],
  parent: null,
};

export const assetGroupTestParentBody: AssetsGroupsBody = {
  name: "Test parent",
  children: [assetGroupTestChildrenId],
  parent: null,
};

export const assetGroupTestChildrenBody: AssetsGroupsBody = {
  name: "Test children",
  children: [],
  parent: assetGroupTestParentId,
};

export const assetGroupFixtures = {
  "assets-groups": [
    { index: { _id: assetGroupTestId } },
    assetGroupTestBody,
    { index: { _id: assetGroupTestParentId } },
    assetGroupTestParentBody,
    { index: { _id: assetGroupTestChildrenId } },
    assetGroupTestChildrenBody,
  ],
};
