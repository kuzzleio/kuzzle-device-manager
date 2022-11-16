Feature: Register Device Metadata

  # Custom mappings are defined in app.ts
  @tenant-custom
  Scenario: Register custom metadata for devices
    Then The collection "device-manager":"devices" mappings match:
    """
    {

    }
    """