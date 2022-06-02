Feature: AssetCategory

  Scenario: Create an assetCategory, a metadata and link them
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
      | assetMetadata[0].name      | "length"    |
      | assetMetadata[0].valueType | "integer" |
      | assetMetadata[0].mandatory | false     |

  Scenario: Create an assetCategory, a  metadata and link them statically
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse"  |
      | body.name | "strangeTruck" |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "volume"      |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse"  |
      | _id         | "strangeTruck" |
      | _metadataId | "volume"       |
      | body.value  | 101            |
    Then The document "engine-ayse":"asset-category":"strangeTruck" content match:
      | name                   | "strangeTruck" |
      | assetMetadata[0].name | "volume"     |
      | metadataValues.volume | 101          |

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
      | subCategory | 'bigTruck' |
    When I successfully execute the action "device-manager/asset":"unlinkCategory" with args:
      | _id        | "tools-MART-linked" |
      | categoryId | "truck"             |
      | engineId   | "engine-ayse"       |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | category    | null |
      | subCategory | null |


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
      | category | null |


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
      | assetMetadata[0].mandatory | false |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "weight"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadata[0].mandatory | true |
    When I successfully execute the action "device-manager/metadata":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "weight"        |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadata | [] |

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

  Scenario: Create an asset with AssetCategory and absent mandatory metadata
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


  Scenario: Create an asset with AssetCategory and present mandatory metadata
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


  Scenario: Create an assetCategory, a mandatory metadata, link them statically and create an asset with
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "solarTruck"  |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse"  |
      | body.name      | "panelSurface" |
      | body.valueType | "integer"      |
      | body.mandatory | true           |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse"  |
      | _id         | "solarTruck"   |
      | _metadataId | "panelSurface" |
      | body.value  | 101            |
    Then The document "engine-ayse":"asset-category":"solarTruck" content match:
      | name                   | "solarTruck" |
      | metadataValues.panelSurface | 101          |
    When I execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "solarTruck"  |
      | body.model     | "M"           |
      | body.reference | "asset_03"    |
      | body.category  | "solarTruck"  |
    Then The document "engine-ayse":"assets":"solarTruck-M-asset_03" content match:
      | metadata.panelSurface | 101     |

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
      | parent.assetMetadata[0].name      | "height" |
      | parent.assetMetadata[0].mandatory | false    |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "height"        |
      | body.mandatory | true          |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadata[0].mandatory | true |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | _metadataId | "height"  |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadata | [] |
    Then The document "engine-ayse":"asset-category":"bigTruck" content match:
      | parent.assetMetadata | [] |

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


