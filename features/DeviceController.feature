Feature: Device Manager device controller

  Scenario: Attach a device to a tenant
    When I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" exists

  Scenario: Update a device
    When I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    When I successfully execute the action "device-manager/device":"update" with args:
      | _id                          | "DummyTemp-detached" |
      | index                        | "tenant-kuzzle"      |
      | body.metadata.updatedByTests | true                 |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "tenant-kuzzle" |
      | collection | "devices"       |
    Then The document "tenant-kuzzle":"devices":"DummyTemp-detached" content match:
      | metadata.updatedByTests | true |

  Scenario: Update a device with before update events
    When I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    When I successfully execute the action "device-manager/device":"update" with args:
      | _id                          | "DummyTemp-detached" |
      | index                        | "tenant-kuzzle"      |
      | body.metadata.updatedByTests | true                 |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "tenant-kuzzle" |
      | collection | "devices"       |
    Then The document "tenant-kuzzle":"devices":"DummyTemp-detached" content match:
      | metadata.enrichedByBeforeUpdateDevice | true |
    And I refresh the collection "tenant-kuzzle":"devices"
    Then The document "tenant-kuzzle":"devices":"DummyTemp-detached" content match:
      | metadata.enrichedByAfterUpdateDevice | true |


  Scenario: Attach a non-existing device to a tenant should throw an error
    When I execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "Not-existing-device" |
      | index | "tenant-kuzzle"       |
    Then I should receive an error matching:
      | message | "Device(s) \"Not-existing-device\" not found" |

  Scenario: Attach multiple devices to a tenant using JSON
    When I successfully execute the action "device-manager/device":"mAttachTenants" with args:
      | body.records.0.tenantId | "tenant-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.tenantId | "tenant-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "tenant-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Attach multiple device to a tenant using CSV
    When I successfully execute the action "device-manager/device":"mAttachTenants" with args:
      | body.csv | "tenantId,deviceId\\ntenant-kuzzle,DummyTemp-detached\\ntenant-kuzzle,DummyTemp-attached_ayse_unlinked," |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "tenant-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Attach multiple device to a tenant while exceeding documentsWriteCount limit
    When I succesfully execute "device-manager/device":"mAttachTenants" while exeding documentsWriteCount limit
    Then All devices in "device-manager" "devices" have the property "tenantId" to "tenant-kuzzle"
    And All documents "tenant-kuzzle":"devices"  exists

  Scenario: Error when assigning a device to a tenant
    When I execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kaliop"      |
    Then I should receive an error matching:
      | message | "Tenant \"tenant-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    When I execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    Then I should receive an error matching:
      | message | "These devices \"DummyTemp-detached\" are already attached to a tenant" |

  Scenario: Detach device from a tenant
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-kuzzle"      |
    When I successfully execute the action "device-manager/device":"detachTenant" with args:
      | _id | "DummyTemp-detached" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" does not exists

  Scenario: Detach multiple devices to a tenant using JSON
    When I successfully execute the action "device-manager/device":"mAttachTenants" with args:
      | body.records.0.tenantId | "tenant-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.tenantId | "tenant-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
    When I successfully execute the action "device-manager/device":"mDetachTenants" with args:
      | body.deviceIds | ["DummyTemp-detached","DummyTemp-attached_ayse_unlinked"] |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "tenant-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Detach multiple devices to a tenant using CSV
    When I successfully execute the action "device-manager/device":"mAttachTenants" with args:
      | body.csv | "tenantId,deviceId\\ntenant-kuzzle,DummyTemp-detached\\ntenant-kuzzle,DummyTemp-attached_ayse_unlinked," |
    When I successfully execute the action "device-manager/device":"mDetachTenants" with args:
      | body.csv | "deviceId\\nDummyTemp-detached\\nDummyTemp-attached_ayse_unlinked," |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | tenantId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "tenant-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Detach multiple device to a tenant while exceeding documentsWriteCount limit
    When I succesfully execute "device-manager/device":"mAttachTenants" while exeding documentsWriteCount limit
    When I succesfully execute "device-manager/device":"mDetachTenants" while exeding documentsWriteCount limit
    Then All devices in "device-manager" "devices" have the property "tenantId" to "null"
    And All documents "tenant-kuzzle":"devices" does not exists

  Scenario: Error when detaching from a tenant
    When I execute the action "device-manager/device":"detachTenant" with args:
      | _id | "DummyTemp-detached" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp-detached\" are not attached to a tenant" |
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I execute the action "device-manager/device":"detachTenant" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp-attached_ayse_unlinked\" are still linked to an asset" |

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | metadata.enrichedByBeforeLinkAsset | true |

  Scenario: Link the same device to another asset should fail
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "TIKO-unlinked"                    |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is already linked to the asset \"PERFO-unlinked\" you need to detach it first." |

  Scenario: Link device to an asset with already registered device recording the same measure
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    Then I should receive an error matching:
      | message | "Device DummyTemp-attached_ayse_unlinked is mesuring a value that is already mesured by another Device for the Asset PERFO-unlinked" |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp-attached_ayse_unlinked,PERFO-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp-attached_ayse_unlinked,PERFO-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp-attached_ayse_unlinked,PERFO-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures.temperature.origin.model       | "DummyTemp"                        |
      | measures.temperature.origin.reference   | "attached_ayse_unlinked"           |
      | measures.temperature.updatedAt          | 1610793427950                      |
      | measures.temperature.payloadUuid        | "_STRING_"                         |
      | measures.temperature.degree             | 23.3                               |
      | measures.temperature.origin.qos.battery | 80                                 |

  Scenario: Error when linking device to an asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-detached" |
      | assetId | "PERFO-unlinked"     |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp-detached\" are not attached to a tenant" |
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-non-existing"               |
    Then I should receive an error matching:
      | message | "Assets \"PERFO-non-existing\" do not exist" |

  Scenario: Error when unlinking from an asset
    When I execute the action "device-manager/device":"unlinkAsset" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp-attached_ayse_unlinked\" are not linked to an asset" |

  Scenario: Unlink multiple devices from multiple assets using JSON
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Unlink multiple devices from multiple assets using CSV
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.csv | "deviceId\\nDummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Unlink device from an asset
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp-detached" |
      | index | "tenant-ayse"        |
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
      | body.records.1.deviceId | "DummyTemp-detached"               |
      | body.records.1.assetId  | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"unlinkAsset" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.position.origin.reference | "detached"    |
      | measures.position.payloadUuid      | "some-uuid"   |
      | measures.position.accuracy         | 42            |
      | measures.position.origin.model     | "_STRING_"    |
      | measures.position.origin.id        | "_STRING_"    |
      | measures.position.point.lon        | 3.876716      |
      | measures.position.point.lat        | 43.610767     |
      | measures.position.updatedAt        | 1610793427950 |

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

  Scenario: Import devices using csv
    Given I successfully execute the action "device-manager/device":"importDevices" with args:
      | body.csv | "_id,reference,model\\nDummyTemp-imported,detached,DummyTemp_imported" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "devices"        |
    Then The document "device-manager":"devices":"DummyTemp-imported" content match:
      | reference | "detached"           |
      | model     | "DummyTemp_imported" |

  Scenario: Import devices catalog using csv
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