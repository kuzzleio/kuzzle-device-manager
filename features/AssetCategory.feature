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
      | engineId   | "engine-ayse" |
      | _id        | "smallTruck"  |
      | metadataId | "length"      |
    Then The document "engine-ayse":"asset-category":"smallTruck" content match:
      | name             | "smallTruck" |
      | assetMetadata[0] | "length"     |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "smallTruck"  |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata[0].name      | "length"     |
      | assetMetadata[0].valueType | "integer"    |
      | assetMetadata[0].mandatory | false        |


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
      | metadataId | "volume"       |
      | body.value  | 101            |
    Then The document "engine-ayse":"asset-category":"strangeTruck" content match:
      | name                            | "strangeTruck" |
      | assetMetadata[0]                | "volume"       |
      | metadataValues[0].value.integer | 101            |

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
      | body.name      | "weight"      |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse" |
      | _id         | "truck"       |
      | metadataId | "weight"      |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "truck"       |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata[0].mandatory |  false |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "weight"      |
      | body.mandatory | true          |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "truck"       |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata[0].mandatory | true |
    Then I refresh the collection "engine-ayse":"asset-category"
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
      | name   | "specialTruck" |
      | parent | "truck"        |
    When I successfully execute the action "device-manager/assetCategory":"unlinkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "specialTruck"    |
      | parentId | "truck"           |
    Then The document "engine-ayse":"asset-category":"specialTruck" content match:
      | name   | "specialTruck" |
      | parent | null           |

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
      | metadataId | "surname"     |
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
      | type                      | "truck"    |
      | model                     | "M"        |
      | reference                 | "asset_02" |
      | category                  | "bigTruck" |
      | metadata[0].key           | "surname"  |
      | metadata[0].value.keyword | "test"     |
    When I successfully execute the action "device-manager/asset":"get" with args:
      | engineId | "engine-ayse" |
      | _id      | "truck-M-asset_02" |
    Then I should receive a result matching:
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
      | metadataId | "panelSurface" |
      | body.value  | 101            |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | engineId | "engine-ayse" |
      | _id      | "solarTruck"  |
    Then I should receive a result matching:
      | name                   | "solarTruck" |
      | metadataValues.panelSurface | 101          |
    When I execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "solarTruck"  |
      | body.model     | "M"           |
      | body.reference | "asset_03"    |
      | body.category  | "solarTruck"  |
    When I successfully execute the action "device-manager/asset":"get" with args:
      | engineId | "engine-ayse" |
      | _id      | "solarTruck-M-asset_03" |
    Then I should receive a result matching:
      | metadata.panelSurface | 101 |

  Scenario: link, update and unlink a metadata on a parent category, and verify edition propagation on children category
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "height"      |
      | body.valueType | "integer"     |
      | body.mandatory | false         |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId    | "engine-ayse" |
      | _id         | "truck"       |
      | metadataId | "height"      |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "bigTruck"  |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata[0].name      | "height" |
      | assetMetadata[0].mandatory | false    |
    When I successfully execute the action "device-manager/metadata":"update" with args:
      | engineId       | "engine-ayse" |
      | _id            | "height"      |
      | body.mandatory | true          |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "bigTruck"  |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata[0].name      | "height" |
      | assetMetadata[0].mandatory | true     |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
      | engineId       | "engine-ayse" |
      | _id | "truck" |
      | metadataId | "height"  |
    Then The document "engine-ayse":"asset-category":"truck" content match:
      | assetMetadata | [] |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | _id      | "bigTruck"  |
      | engineId | "engine-ayse" |
    Then I should receive a result matching:
      | assetMetadata | [] |

  Scenario: Delete a parent, and verify parent relation deletion
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "littleTruck" |
    When I successfully execute the action "device-manager/assetCategory":"linkParent" with args:
      | engineId | "engine-ayse" |
      | _id      | "littleTruck" |
      | parentId | "truck"       |
    Then I refresh the collection "engine-ayse":"asset-category"
    When I successfully execute the action "device-manager/assetCategory":"delete" with args:
      | engineId | "engine-ayse" |
      | _id      | "truck"       |
    Then The document "engine-ayse":"asset-category":"littleTruck" content match:
      | parent | null |

  Scenario: Use metadata enum type and link with assetCategory
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse"  |
      | body.name | "coloredTruck" |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse"          |
      | body.name      | "color"                |
      | body.valueType | "string"               |
      | body.valueList | ["red","blue","green"] |
      | body.mandatory | true                   |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "coloredTruck" |
      | metadataId | "color"        |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "coloredTruck" |
      | metadataId | "color"        |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "coloredTruck" |
      | metadataId | "color"        |
      | body.value | "red"          |
    Then The document "engine-ayse":"asset-category":"coloredTruck" content match:
      | metadataValues[0].key           | "color" |
      | metadataValues[0].value.keyword | "red"   |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
          | engineId   | "engine-ayse"  |
          | _id        | "coloredTruck" |
          | metadataId | "color"        |
    Then The document "engine-ayse":"asset-category":"coloredTruck" content match:
      | metadataValues | [] |
    When I execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "coloredTruck" |
      | metadataId | "color"        |
      | body.value | "black"        |
    Then I should receive an error matching:
      | id | "device-manager.asset_controller.enum_metadata" |

  Scenario: Use metadata enum type link with assetCategory, and create asset with
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "typedTruck"      |
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse"   |
      | body.name      | "truckType"     |
      | body.valueType | "string"        |
      | body.valueList | ["big","small"] |
      | body.mandatory | true            |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse" |
      | _id        | "typedTruck"  |
      | metadataId | "truckType"   |
    When I execute the action "device-manager/asset":"create" with args:
      | engineId                | "engine-ayse" |
      | body.type               | "truck"       |
      | body.model              | "M"           |
      | body.reference          | "asset_02"    |
      | body.category           | "typedTruck"  |
      | body.metadata.truckType | "super"       |
    Then I should receive an error matching:
      | id | "device-manager.asset_controller.enum_metadata" |
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId                | "engine-ayse" |
      | body.type               | "truck"       |
      | body.model              | "M"           |
      | body.reference          | "asset_02"    |
      | body.category           | "typedTruck"  |
      | body.metadata.truckType | "big"         |
    When I successfully execute the action "device-manager/asset":"get" with args:
      | engineId | "engine-ayse"      |
      | _id      | "truck-M-asset_02" |
    Then I should receive a result matching:
      | metadata.truckType | "big" |


  Scenario: Use geopoint
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId       | "engine-ayse" |
      | body.name      | "position"    |
      | body.valueType | "geo_point"   |
      | body.mandatory | true          |
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse" |
      | body.name | "positionTruck"      |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "positionTruck" |
      | metadataId | "position"        |
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId               | "engine-ayse"        |
      | body.type              | "truck"              |
      | body.model             | "M"                  |
      | body.reference         | "asset_10"           |
      | body.category          | "positionTruck"      |
      | body.metadata.position | {lon : 10, lat : 20} |
    When I successfully execute the action "device-manager/asset":"get" with args:
      | engineId | "engine-ayse"      |
      | _id      | "truck-M-asset_10" |
    Then I should receive a result matching:
      | type              | "truck"    |
      | model             | "M"        |
      | reference         | "asset_10" |
      | metadata.position | {lon : 10, lat : 20}     |
    And The document "engine-ayse":"assets":"truck-M-asset_10" content match:
      | metadata[0].key                 | "position" |
      | metadata[0].value.geo_point.lon | 10         |
      | metadata[0].value.geo_point.lat | 20         |

  Scenario: Use objectEnum
    When I successfully execute the action "device-manager/metadata":"create" with args:
      | engineId             | "engine-ayse"                                                                                               |
      | body.name            | "trailer"                                                                                                   |
      | body.valueType       | "enum"                                                                                                      |
      | body.mandatory       | true                                                                                                        |
      | body.objectValueList | [{'color' : 'red', 'size' : 'giant', 'maxLoad' : 50}, {'color' : 'blue', 'size' : 'small', 'maxLoad' : 60}] |
    When I successfully execute the action "device-manager/metadata":"get" with args:
      | engineId | "engine-ayse" |
      | _id      | "trailer"     |
    Then I should receive a result matching:
      | name            | "trailer"                                                                                                   |
      | valueType       | "enum"                                                                                                      |
      | mandatory       | true                                                                                                        |
      | objectValueList | [{'color' : 'red', 'size' : 'giant', 'maxLoad' : 50}, {'color' : 'blue', 'size' : 'small', 'maxLoad' : 60}] |
    And The document "engine-ayse":"metadata":"trailer" content match:
      | objectValueList[0].object[0].key           | "color"   |
      | objectValueList[0].object[0].value.keyword | "red"     |
      | objectValueList[0].object[2].key           | "maxLoad" |
      | objectValueList[0].object[2].value.integer | 50        |
      | objectValueList[1].object[0].key           | "color"   |
      | objectValueList[1].object[0].value.keyword | "blue"    |
      | objectValueList[1].object[2].key           | "maxLoad" |
      | objectValueList[1].object[2].value.integer | 60        |
    When I successfully execute the action "device-manager/assetCategory":"create" with args:
      | engineId  | "engine-ayse"  |
      | body.name | "trailerTruck" |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "trailerTruck" |
      | metadataId | "trailer"      |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "trailerTruck" |
      | metadataId | "trailer"      |
    When I successfully execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "trailerTruck" |
      | metadataId | "trailer"      |
      | body.value | {'color' : 'red', 'size' : 'giant', 'maxLoad' : 50}         |
    Then The document "engine-ayse":"asset-category":"trailerTruck" content match:
      | metadataValues[0].key                           | "trailer" |
      | metadataValues[0].value.object[0].key           | "color"   |
      | metadataValues[0].value.object[0].value.keyword | "red"     |
    When I successfully execute the action "device-manager/assetCategory":"get" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "trailerTruck" |
    Then I should receive a result matching:
      | metadataValues.trailer.color   | "red"   |
      | metadataValues.trailer.size    | "giant" |
      | metadataValues.trailer.maxLoad | 50      |
    When I successfully execute the action "device-manager/assetCategory":"unlinkMetadata" with args:
      | engineId   | "engine-ayse"  |
      | _id        | "trailerTruck" |
      | metadataId | "trailer"      |
    And I execute the action "device-manager/assetCategory":"linkMetadata" with args:
      | engineId   | "engine-ayse"                                       |
      | _id        | "trailerTruck"                                      |
      | metadataId | "trailer"                                           |
      | body.value | {'color' : 'red', 'size' : 'giant', 'maxLoad' : 60} |
    Then I should receive an error matching:
      | id | "device-manager.assetController.EnumMetadata" |
