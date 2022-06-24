Feature: RelationalController
  Scenario: Create two TreeNode, and link them
    When I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "root"  |
    When I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "firstChildren"  |
    When I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId  | "engine-ayse" |
      | id | "firstChildren"  |
      | parentId | "root"  |
