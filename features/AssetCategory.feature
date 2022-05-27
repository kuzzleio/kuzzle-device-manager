Feature: AssetCategory

  Scenario: Create an assetCategory, a metadata, and link them
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "smallTruck"  |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "length"        |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse" |
      | _id         | "smallTruck"  |
      | _metadataId | "length"      |
    Then The document "engine-ayse":"asset-category":"smallTruck" content match:
      | name                        | "smallTruck"   |
      | assetMetadatas[0].name      | "length"    |
      | assetMetadatas[0].valueType | "integer" |
      | assetMetadatas[0].mandatory | false     |

  Scenario: Link and unlink an asset and a AssetCategory
    When I successfully execute the action "device-manager/asset":"linkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category | 'truck' |
    When I successfully execute the action "device-manager/asset":"unlinkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category | null |

  Scenario: Link and unlink an asset and a subcategory
    When I successfully execute the action "device-manager/asset":"linkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "bigTruck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category    | 'truck'    |
      | subcategory | 'bigTruck' |
    When I successfully execute the action "device-manager/asset":"unlinkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category | null |
      | subcategory | null |


  Scenario: Remove an AssetCategory and verify propagation to a linked asset
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "tool"        |
    When I successfully execute the action "device-manager/asset":"linkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "tool"              |
      | engineId   | "engine-ayse"       |
    And I refresh the collection "engine-ayse":"assets"
    And I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "tool"        |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category | {} |

  Scenario: Update and delete a metadata, and verify edition propagation
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "weight"        |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse" |
      | _id         | "truck"       |
      | _metadataId | "weight"      |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas[0].mandatory | false |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "weight"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas[0].mandatory | true |
    When I successfully execute the action "device-manager/metadata":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "weight"        |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadatas | [] |

  Scenario: Create an assetCategory, add and remove a parent to it.
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse"  |
      | body.name | "specialTruck" |
    When I successfully execute the action "device-manager/assetCategory":"linkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "specialTruck"    |
      | parentId | "truck"           |
    Then The document "engine-ayse":"asset-category":"specialTruck" content match:
      | name        | "specialTruck" |
      | parent.name | "truck"    |
    And I wait 3000 ms
    And The document "engine-ayse":"asset-category":"truck" content match:
      | name                 | "truck"        |
      | children[1].document | "specialTruck" |
    When I successfully execute the action "device-manager/assetCategory":"unlinkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "specialTruck"    |
      | parentId | "truck"           |
    Then The document "engine-ayse":"asset-category":"specialTruck" content match:
      | name   | "specialTruck" |
      | parent | null           |
    And The document "engine-ayse":"asset-category":"truck" content match:
      | name        | "truck"   |
      | children[1] | undefined |

  Scenario: Create an asset with AssetCategory
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "truck"       |
      | body.model     | "M"           |
      | body.reference | "asset_01"    |
      | body.category  | "bigTruck"    |
      | body.metadata  | {}            |
    Then The document "engine-ayse":"assets":"truck-M-asset_01" content match:
      | category | "bigTruck" |

  Scenario: Create an asset with AssetCategory and absent mandatory metadatas
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "surname"     |
      | body.valueType | "integer"     |
      | body.mandatory | true          |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse" |
      | _id         | "truck"       |
      | _metadataId | "surname"     |
    When I execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "truck"       |
      | body.model     | "M"           |
      | body.reference | "asset_02"    |
      | body.category  | "bigTruck"    |
      | body.metadata  | {}            |
    Then I should receive an error matching:
      | status | 400 |


  Scenario: Create an asset with AssetCategory and present mandatory metadatas
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId              | "engine-ayse" |
      | body.type             | "truck"       |
      | body.model            | "M"           |
      | body.reference        | "asset_02"    |
      | body.category         | "bigTruck"    |
      | body.metadata.surname | "test"        |
    Then The document "engine-ayse":"assets":"truck-M-asset_02" content match:
      | type             | "truck"    |
      | model            | "M"        |
      | reference        | "asset_02" |
      | category         | "bigTruck" |
      | metadata.surname | "test"     |

  Scenario: Update a parent, and verify edition propagation
    When I successfully execute the action "device-manager/assetCategory":"update" with args:
      | engineId  | "engine-ayse" |
      | _id       | "truck"       |
      | body.name | "basicTruck"  |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | name        | "bigTruck" |
      | parent.name | "basicTruck"    |

  Scenario: link, update and unlink a metadata on a parent category, and verify edition propagation on children category
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "height"      |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | _metadataId | "height"  |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadatas[0].name      | "height" |
      | parent.assetMetadatas[0].mandatory | false    |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "height"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadatas[0].mandatory | true |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
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
      | _id      | "bigTruck"    |
    When I successfully execute the action "device-manager/assetCategory":"update" with args:
      | engineId  | "engine-ayse"  |
      | _id       | "truck"        |
      | body.name | "genericTruck" |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | children | [] |

  Scenario: Delete a parent, and verify deletion propagation
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "littleTruck" |
    When I successfully execute the action "device-manager/assetCategory":"linkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "littleTruck" |
      | parentId | "truck"       |
    When I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "truck"       |
    Then The document "engine-ayse":"asset-category":"littleTruck" does not exists
