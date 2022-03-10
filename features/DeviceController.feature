Feature: Device Manager device controller

  Scenario: Attach a device to an engine
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists

  Scenario: Update a device
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    When I successfully execute the action "device-manager/device":"update" with args:
      | _id                          | "DummyTemp-detached" |
      | index                        | "engine-kuzzle"      |
      | body.metadata.updatedByTests | true                 |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "engine-kuzzle" |
      | collection | "devices"       |
    Then The document "engine-kuzzle":"devices":"DummyTemp-detached" content match:
      | metadata.updatedByTests | true |

  Scenario: Attach a non-existing device to an engine should throw an error
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "Not-existing-device" |
      | index | "engine-kuzzle"       |
    Then I should receive an error matching:
      | id | "services.storage.not_found" |

  Scenario: Attach a device to an engine and enrich it with event
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    # Events
    And The document "tests":"events":"device-manager:device:attach-engine:before" content match:
      | device._id | "DummyTemp-detached" |
      | engineId   | "engine-kuzzle"      |
    And The document "tests":"events":"device-manager:device:attach-engine:after" content match:
      | device._id | "DummyTemp-detached" |
      | engineId   | "engine-kuzzle"      |

  Scenario: Attach multiple device to an engine using JSON
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.records.0.engineId | "engine-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.engineId | "engine-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Attach multiple device to an engine using CSV
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.csv | "engineId,deviceId\\nengine-kuzzle,DummyTemp-detached\\nengine-kuzzle,DummyTemp-attached_ayse_unlinked," |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Error when assigning a device to an engine
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kaliop"      |
    Then I should receive an error matching:
      | message | "Tenant \"engine-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id    | "DummyTemp-detached" |
      | index  | "engine-kuzzle"      |
      | strict | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is already attached to an engine." |

  Scenario: Detach device from an engine
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    When I successfully execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyTemp-detached" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists

  Scenario: Detach multiple device to an engine using JSON
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.records.0.engineId | "engine-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.engineId | "engine-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.deviceIds | ["DummyTemp-detached","DummyTemp-attached_ayse_unlinked"] |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Detach multiple device to an engine using CSV
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.csv | "engineId,deviceId\\nengine-kuzzle,DummyTemp-detached\\nengine-kuzzle,DummyTemp-attached_ayse_unlinked," |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.csv | "deviceId\\nDummyTemp-detached\\nDummyTemp-attached_ayse_unlinked," |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Error when detaching from an engine
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id    | "DummyTemp-detached" |
      | strict | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is still linked to an asset." |

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                            | "DummyTemp-attached_ayse_unlinked" |
      | assetId                        | "tools-PERFO-unlinked"             |
      | body.measuresNames.temperature | "External temperature"             |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].name               | "External temperature"             |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.reference   | "attached_ayse_unlinked"           |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].name               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.reference   | "attached_ayse_unlinked"           |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    And The document "tests":"events":"device-manager:device:link-asset:before" content match:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset._id  | "tools-PERFO-unlinked"             |
    And The document "tests":"events":"device-manager:device:link-asset:after" content match:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset._id  | "tools-PERFO-unlinked"             |

  Scenario: Link the same device to another asset should fail
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-SCREW-unlinked"             |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is already linked to an asset." |

  Scenario: Link device to an asset with already registered device recording the same measure
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is already linked to an asset." |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "tools-PERFO-unlinked"             |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.reference   | "attached_ayse_unlinked"           |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.reference   | "attached_ayse_unlinked"           |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp-attached_ayse_unlinked,tools-PERFO-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.reference   | "attached_ayse_unlinked"           |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.reference   | "attached_ayse_unlinked"           |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |

  Scenario: Error when linking device to an asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-detached"   |
      | assetId | "tools-PERFO-unlinked" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-non-existing"               |
    Then I should receive an error matching:
      | message | "Document \"PERFO-non-existing\" not found in \"engine-ayse\":\"assets\"." |

  Scenario: Error when unlinking from an asset
    When I execute the action "device-manager/device":"unlinkAsset" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is not linked to an asset." |

  Scenario: Unlink multiple device from multiple assets using JSON
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Unlink multiple device from multiple assets using CSV
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.csv | "deviceId\\nDummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Clean payloads collection
    Given I successfully execute the action "collection":"truncate" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    And I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345" |
      | register55    | 23.3    |
      | location.lat  | 42.2    |
      | location.lon  | 2.42    |
      | location.accu | 2100    |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 2 |
    And I successfully execute the action "device-manager/device":"prunePayloads" with args:
      | body.days        | 0           |
      | body.deviceModel | "DummyTemp" |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 1 |

  Scenario: Import device using csv
    Given I successfully execute the action "device-manager/device":"importDevices" with args:
      | body.csv | "_id,reference,model\\nDummyTemp-imported,detached,DummyTemp_imported" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "devices"        |
    Then The document "device-manager":"devices":"DummyTemp-imported" content match:
      | reference | "detached"           |
      | model     | "DummyTemp_imported" |

  Scenario: Import device catalog using csv
    Given a collection "device-manager":"config"
    And I "update" the document "plugin--device-manager" with content:
      | device-manager.provisioningStrategy | "catalog" |
    And I successfully execute the action "device-manager/device":"importCatalog" with args:
      | body.csv | "deviceId,authorized\\nDummyTemp-imported,false" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "config"         |
    Then The document "device-manager":"config":"catalog--DummyTemp-imported" content match:
      | type               | "catalog"            |
      | catalog.authorized | false                |
      | catalog.deviceId   | "DummyTemp-imported" |
    And I "update" the document "plugin--device-manager" with content:
      | device-manager.provisioningStrategy | "auto" |

  Scenario: Error when linking a device with same type of measure
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked_2" |
      | assetId | "tools-PERFO-unlinked"               |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked_2" content match:
      | assetId | null |
    Then I should receive an error matching:
      | message | "Duplicate measure name \"temperature\"" |

  Scenario: Link multiple devices to an asset and then unlink one of them
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-ayse"        |
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.0.assetId  | "tools-PERFO-unlinked"             |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.1.assetId  | "tools-PERFO-unlinked"             |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type                | "temperature"                      |
      | measures[0].measuredAt          | 1610793427950                      |
      | measures[0].values.temperature  | 23.3                               |
      | measures[0].origin.id           | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model        | "DummyTemp"                        |
      | measures[0].origin.reference    | "attached_ayse_unlinked"           |
      | measures[0].origin.type         | "device"                           |
      | measures[0].unit.name           | "Degree"                           |
      | measures[0].unit.sign           | "°"                                |
      | measures[0].unit.type           | "number"                           |
      | measures[1].type                | "battery"                          |
      | measures[1].measuredAt          | 1610793427950                      |
      | measures[1].values.battery      | 80                                 |
      | measures[1].origin.id           | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model        | "DummyTemp"                        |
      | measures[1].origin.reference    | "attached_ayse_unlinked"           |
      | measures[1].origin.type         | "device"                           |
      | measures[1].unit.name           | "Volt"                             |
      | measures[1].unit.sign           | "v"                                |
      | measures[1].unit.type           | "number"                           |
      | measures[2].type                | "position"                         |
      | measures[2].measuredAt          | 1610793427950                      |
      | measures[2].values.position.lat | 43.610767                          |
      | measures[2].values.position.lon | 3.876716                           |
      | measures[2].values.accuracy     | 42                                 |
      | measures[2].origin.id           | "DummyTemp-detached"               |
      | measures[2].origin.model        | "DummyTemp"                        |
      | measures[2].origin.reference    | "detached"                         |
      | measures[2].origin.type         | "device"                           |
      | measures[2].unit.name           | "GPS"                              |
      | measures[2].unit.type           | "geo_point"                        |
    When I successfully execute the action "device-manager/device":"unlinkAsset" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type                | "position"           |
      | measures[0].measuredAt          | 1610793427950        |
      | measures[0].values.position.lat | 43.610767            |
      | measures[0].values.position.lon | 3.876716             |
      | measures[0].values.accuracy     | 42                   |
      | measures[0].origin.id           | "DummyTemp-detached" |
      | measures[0].origin.model        | "DummyTemp"          |
      | measures[0].origin.reference    | "detached"           |
      | measures[0].origin.type         | "device"             |
      | measures[0].unit.name           | "GPS"                |
      | measures[0].unit.type           | "geo_point"          |
