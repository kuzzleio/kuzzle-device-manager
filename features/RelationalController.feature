Feature: RelationalController
  Scenario: Create two TreeNode, link and unlink them
    When I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test" |
      | body.name | "root" |
    And I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"          |
      | body.name | "firstChildren" |
    And I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId | "test"          |
      | _id      | "firstChildren" |
      | _parentId | "root"          |
    Then The document "test":"node":"root" content match:
      | name             | "root"          |
      | children[0].name | "firstChildren" |
    And The document "test":"node":"firstChildren" content match:
      | name               | "firstChildren" |
      | parent[0].document | "root"          |
    When I successfully execute the action "device-manager/treeNode":"unlink" with args:
      | engineId | "test"          |
      | _id      | "firstChildren" |
      | _parentId | "root"          |
    Then The document "test":"node":"root" content match:
      | name     | "root" |
      | children | []     |
    And The document "test":"node":"firstChildren" content match:
      | name   | "firstChildren" |
      | parent | []              |


  Scenario: Create three TreeNode, link them and verify edition propagation
    When I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"        |
      | body.name | "grandFather" |
    And I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test" |
      | body.name | "father" |
    And I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"     |
      | body.name | "child" |
    And I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId | "test"          |
      | _id      | "child" |
      | _parentId | "father"          |
    And I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId | "test"          |
      | _id      | "father" |
      | _parentId | "grandFather"          |
    Then The document "test":"node":"grandFather" content match:
      | name                         | "grandFather" |
      | children[0].name             | "father"      |
      | children[0].children[0].name | "child"       |
    When I successfully execute the action "device-manager/treeNode":"update" with args:
      | engineId | "test"               |
      | _id      | "child"              |
      | body     | {"name" : "newName"} |
    Then The document "test":"node":"grandFather" content match:
      | children[0].children[0].name | "newName" |

  Scenario: Create three TreeNode, link them, remove the second, update the third (for lazy deleting) and verify edition propagation
    When I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"         |
      | body.name | "grandFather2" |
    And I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"    |
      | body.name | "father2" |
    And I successfully execute the action "device-manager/treeNode":"create" with args:
      | engineId  | "test"   |
      | body.name | "child2" |
    And I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId  | "test"    |
      | _id       | "child2"  |
      | _parentId | "father2" |
    And I successfully execute the action "device-manager/treeNode":"link" with args:
      | engineId  | "test"         |
      | _id       | "father2"      |
      | _parentId | "grandFather2" |
    When I successfully execute the action "device-manager/treeNode":"delete" with args:
      | engineId | "test"    |
      | _id      | "father2" |
    Then The document "test":"node":"grandFather2" content match:
      | children | [] |
    When I successfully execute the action "device-manager/treeNode":"update" with args:
      | engineId | "test"                      |
      | _id      | "child2"                   |
      | body     | {"name" : "child2newName"} |
    Then The document "test":"node":"child2" content match:
      | parent | {} |


  Scenario: Create two InvertTreeNode (One to Many), link and unlink them
    When I successfully execute the action "device-manager/invertTreeNode":"create" with args:
      | engineId  | "test" |
      | body.name | "root" |
    And I successfully execute the action "device-manager/invertTreeNode":"create" with args:
      | engineId  | "test"          |
      | body.name | "firstChildren" |
    And I successfully execute the action "device-manager/invertTreeNode":"link" with args:
      | engineId    | "test"          |
      | _childrenId | "firstChildren" |
      | _id         | "root"          |
    Then The document "test":"invertnode":"root" content match:
      | name             | "root"          |
      | children[0].document | "firstChildren" |
    And The document "test":"invertnode":"firstChildren" content match:
      | name        | "firstChildren" |
      | parent.name | "root"          |
    When I successfully execute the action "device-manager/invertTreeNode":"unlink" with args:
      | engineId    | "test"          |
      | _childrenId | "firstChildren" |
      | _id         | "root"          |
    Then The document "test":"invertnode":"root" content match:
      | name     | "root" |
      | children | []     |
    And The document "test":"invertnode":"firstChildren" content match:
      | name   | "firstChildren" |
      | parent | {}              |

  Scenario: Create three InvertTreeNode (OneToMany), link them and verify edition propagation
    When I successfully execute the action "device-manager/invertTreeNode":"create" with args:
      | engineId  | "test"        |
      | body.name | "grandFather" |
    And I successfully execute the action "device-manager/invertTreeNode":"create" with args:
      | engineId  | "test" |
      | body.name | "father" |
    And I successfully execute the action "device-manager/invertTreeNode":"create" with args:
      | engineId  | "test"     |
      | body.name | "child" |
    And I successfully execute the action "device-manager/invertTreeNode":"link" with args:
      | engineId    | "test"   |
      | _childrenId | "child"  |
      | _id         | "father" |
    And I successfully execute the action "device-manager/invertTreeNode":"link" with args:
      | engineId    | "test"        |
      | _childrenId | "father"      |
      | _id           | "grandFather" |
    Then The document "test":"invertnode":"grandFather" content match:
      | name                 | "grandFather" |
      | children[0].document | "father"      |
    And The document "test":"invertnode":"child" content match:
      | name               | "child"  |
      | parent.parent.name | "grandFather" |
    When I successfully execute the action "device-manager/invertTreeNode":"update" with args:
      | engineId | "test"               |
      | _id      | "grandFather"              |
      | body     | {"name" : "newName"} |
    Then The document "test":"invertnode":"child" content match:
      | parent.parent.name | "newName" |
