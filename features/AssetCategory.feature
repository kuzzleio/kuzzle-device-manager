Feature: AssetCategory

  Scenario: Create an assetCategory, a metadata, and link them
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "truck"       |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "size"        |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMedatadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | _metadataId | "size"  |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | name                        | "truck"   |
      | assetMetadatas[0].name      | "size"    |
      | assetMetadatas[0].valueType | "integer" |
      | assetMetadatas[0].mandatory | false     |

  Scenario: Link and unlink an asset and an AssetCategory
    When I successfully execute the action "device-manager/asset":"linkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | categories | ['truck'] |
    When I successfully execute the action "device-manager/asset":"unlinkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | categories | [] |

  Scenario: Remove an AssetCategory and verify propagation to a linked asset
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "tool"        |
    When I successfully execute the action "device-manager/asset":"linkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "tool"              |
      | engineId   | "engine-ayse"       |
    When I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "tool"        |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | categories | [] |

  Scenario: Update a metadata, and verify edition propagation
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "size"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas[0].mandatory | true |

  Scenario: Delete a metadata, and verify edition propagation
    When I successfully execute the action "device-manager/metadata":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "size"        |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas | [] |


  Scenario: Create an assetCategory, and add a parent to it.
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "bigTruck"    |
    When I successfully execute the action "device-manager/assetCategory":"linkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "bigTruck"    |
      | parentId | "truck"           |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | name        | "bigTruck" |
      | parent.name | "truck"    |

  Scenario: Update a parent, and verify edition propagation
    When I successfully execute the action "device-manager/assetCategory":"update" with args:
      | engineId  | "engine-ayse" |
      | _id       | "truck"       |
      | body.name | "basicTruck"  |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | name        | "bigTruck" |
      | parent.name | "basicTruck"    |

  Scenario: link a metadata on a parent category, and verify edition propagation on children category
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "height"      |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMedatadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | _metadataId | "height"  |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadatas[0].name      | "height" |
      | parent.assetMetadatas[0].mandatory | false    |


  Scenario: update a metadata on a parent category, and verify edition propagation on children category
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "height"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadatas[0].mandatory | true |

  Scenario: Unlink a metadata on a parent category, verify parent update and verify edition propagation on children category
    When I successfully execute the action "device-manager/assetCategory":"unlinkMedatadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | _metadataId | "height"  |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas | [] |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadatas | [] |


  Scenario: Delete a child, update parent and validate the lazy link remove work fine
    When I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "bigTruck"        |
    When I successfully execute the action "device-manager/assetCategory":"update" with args:
      | engineId  | "engine-ayse"  |
      | _id       | "truck"        |
      | body.name | "genericTruck" |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | children | [] |

  Scenario: Delete a parent, and verify edition propagation
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "littleTruck" |
    When I successfully execute the action "device-manager/assetCategory":"linkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "littleTruck"    |
      | parentId | "truck"           |
    When I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "truck"        |
    Then The document "engine-ayse":"asset-category":"littleTruck" content match:
      | parent | null |

