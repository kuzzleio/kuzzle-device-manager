import {
  ApiGroupListItemsRequest,
  ApiGroupListItemsResult,
  ApiGroupMoveRequest,
  ApiGroupMoveResult,
} from "../../../../lib/modules/group/types/GroupsApi";
import { AssetContent } from "../../../../lib/modules/asset/exports";
import { DeviceContent } from "../../../../lib/modules/device";
import { GroupContent } from "../../../../lib/modules/group/types/GroupContent";
import { InternalCollection } from "../../../../lib/modules/plugin";
import { setupHooks } from "../../../helpers";
import {
  assetAyseDebug1Id,
  assetAyseLinked1Id,
  assetAyseLinked2Id,
  deviceAyseUnlinked1Id,
  deviceAyseUnlinked2Id,
} from "../../../fixtures";

/**
 * "quai-1" and "quai-10" are siblings: the path of "quai-10" starts with the
 * path of "quai-1", but it is not part of its subtree.
 */
describe("Groups subtree", () => {
  const sdk = setupHooks();
  const index = "engine-ayse";

  const parentPath = "subtree-parent";
  const targetPath = "subtree-target";
  const quai1Path = `${parentPath}.quai-1`;
  const quai10Path = `${parentPath}.quai-10`;
  const quai1ChildPath = `${quai1Path}.quai-1-child`;

  async function createGroup(_id: string, path: string) {
    await sdk.query({
      controller: "device-manager/groups",
      action: "create",
      index,
      _id,
      body: { name: _id, model: null, path },
      refresh: "wait_for",
    });
  }

  async function addAssets(path: string, assetIds: string[]) {
    await sdk.query({
      controller: "device-manager/groups",
      action: "addAssets",
      index,
      body: { path, assetIds },
      refresh: "wait_for",
    });
  }

  async function addDevices(path: string, deviceIds: string[]) {
    await sdk.query({
      controller: "device-manager/groups",
      action: "addDevices",
      index,
      body: { path, deviceIds },
      refresh: "wait_for",
    });
  }

  async function getGroupPaths(collection: InternalCollection, _id: string) {
    const { _source } = await sdk.document.get<AssetContent | DeviceContent>(
      index,
      collection,
      _id,
    );
    return (_source.groups ?? []).map((grp) => grp.path);
  }

  beforeEach(async () => {
    await createGroup("subtree-parent", parentPath);
    await createGroup("subtree-target", targetPath);
    await createGroup("quai-1", quai1Path);
    await createGroup("quai-10", quai10Path);
    await createGroup("quai-1-child", quai1ChildPath);

    await addAssets(quai10Path, [assetAyseDebug1Id]);
    await addAssets(quai1Path, [assetAyseLinked2Id]);
    await addAssets(quai1ChildPath, [assetAyseLinked1Id]);
    await addDevices(quai10Path, [deviceAyseUnlinked1Id]);
    await addDevices(quai1ChildPath, [deviceAyseUnlinked2Id]);
  });

  it("moveGroup only moves the subtree of the group", async () => {
    await sdk.query<ApiGroupMoveRequest, ApiGroupMoveResult>({
      controller: "device-manager/groups",
      action: "moveGroup",
      index,
      _id: "quai-1",
      body: { targetGroupId: "subtree-target" },
    });
    await sdk.collection.refresh(index, InternalCollection.GROUPS);

    const newQuai1Path = `${targetPath}.quai-1`;

    // Sibling untouched
    const { _source: quai10 } = await sdk.document.get<GroupContent>(
      index,
      InternalCollection.GROUPS,
      "quai-10",
    );
    expect(quai10.path).toBe(quai10Path);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseDebug1Id),
    ).toEqual([quai10Path]);
    expect(
      await getGroupPaths(InternalCollection.DEVICES, deviceAyseUnlinked1Id),
    ).toEqual([quai10Path]);

    // Real subtree moved
    const { _source: child } = await sdk.document.get<GroupContent>(
      index,
      InternalCollection.GROUPS,
      "quai-1-child",
    );
    expect(child.path).toBe(`${newQuai1Path}.quai-1-child`);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseLinked2Id),
    ).toEqual([newQuai1Path]);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseLinked1Id),
    ).toEqual([`${newQuai1Path}.quai-1-child`]);
    expect(
      await getGroupPaths(InternalCollection.DEVICES, deviceAyseUnlinked2Id),
    ).toEqual([`${newQuai1Path}.quai-1-child`]);
  });

  it("moveGroup only rewrites the leading part of the paths", async () => {
    // "quai-1" also appears deeper in the path of this unrelated group
    await createGroup("quai-1-elsewhere", `${quai10Path}.quai-1-elsewhere`);

    await sdk.query<ApiGroupMoveRequest, ApiGroupMoveResult>({
      controller: "device-manager/groups",
      action: "moveGroup",
      index,
      _id: "quai-1",
      body: { targetGroupId: null },
    });
    await sdk.collection.refresh(index, InternalCollection.GROUPS);

    const { _source: elsewhere } = await sdk.document.get<GroupContent>(
      index,
      InternalCollection.GROUPS,
      "quai-1-elsewhere",
    );
    expect(elsewhere.path).toBe(`${quai10Path}.quai-1-elsewhere`);

    const { _source: child } = await sdk.document.get<GroupContent>(
      index,
      InternalCollection.GROUPS,
      "quai-1-child",
    );
    expect(child.path).toBe("quai-1.quai-1-child");
  });

  it("moveGroup moves more than one page of subgroups", async () => {
    const subgroupIds = Array.from({ length: 15 }, (_, i) => `quai-1-sub-${i}`);
    await sdk.document.mCreate<GroupContent>(
      index,
      InternalCollection.GROUPS,
      subgroupIds.map((_id) => ({
        _id,
        body: {
          lastUpdate: Date.now(),
          metadata: {},
          model: null,
          name: _id,
          path: `${quai1Path}.${_id}`,
        },
      })),
      { refresh: "wait_for" },
    );

    await sdk.query<ApiGroupMoveRequest, ApiGroupMoveResult>({
      controller: "device-manager/groups",
      action: "moveGroup",
      index,
      _id: "quai-1",
      body: { targetGroupId: "subtree-target" },
    });
    await sdk.collection.refresh(index, InternalCollection.GROUPS);

    const { successes } = await sdk.document.mGet<GroupContent>(
      index,
      InternalCollection.GROUPS,
      subgroupIds,
    );
    expect(successes.map((g) => g._source.path).sort()).toEqual(
      subgroupIds.map((_id) => `${targetPath}.quai-1.${_id}`).sort(),
    );
  });

  it("delete only deletes the subtree of the group", async () => {
    await sdk.query({
      controller: "device-manager/groups",
      action: "delete",
      index,
      _id: "quai-1",
    });
    await sdk.collection.refresh(index, InternalCollection.GROUPS);

    // Sibling untouched
    await expect(
      sdk.document.exists(index, InternalCollection.GROUPS, "quai-10"),
    ).resolves.toBe(true);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseDebug1Id),
    ).toEqual([quai10Path]);
    expect(
      await getGroupPaths(InternalCollection.DEVICES, deviceAyseUnlinked1Id),
    ).toEqual([quai10Path]);

    // Real subtree deleted
    await expect(
      sdk.document.exists(index, InternalCollection.GROUPS, "quai-1"),
    ).resolves.toBe(false);
    await expect(
      sdk.document.exists(index, InternalCollection.GROUPS, "quai-1-child"),
    ).resolves.toBe(false);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseLinked2Id),
    ).toEqual([]);
    expect(
      await getGroupPaths(InternalCollection.ASSETS, assetAyseLinked1Id),
    ).toEqual([]);
    expect(
      await getGroupPaths(InternalCollection.DEVICES, deviceAyseUnlinked2Id),
    ).toEqual([]);
  });

  it("listItems with children only lists the subtree of the group", async () => {
    const { result } = await sdk.query<
      ApiGroupListItemsRequest,
      ApiGroupListItemsResult
    >({
      controller: "device-manager/groups",
      action: "listItems",
      index,
      _id: "quai-1",
      body: { includeChildren: true },
    });

    expect(result.assets.hits.map((a) => a._id).sort()).toEqual(
      [assetAyseLinked1Id, assetAyseLinked2Id].sort(),
    );
    expect(result.devices.hits.map((d) => d._id)).toEqual([
      deviceAyseUnlinked2Id,
    ]);
  });
});
