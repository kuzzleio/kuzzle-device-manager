# [2.4.0-beta.15](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.14...v2.4.0-beta.15) (2024-03-21)


### Bug Fixes

* correct api types ([#333](https://github.com/kuzzleio/kuzzle-device-manager/issues/333)) ([05c426f](https://github.com/kuzzleio/kuzzle-device-manager/commit/05c426fbfaf9602bb46d4b0c8f472fab85280b3a))


### Features

* add group descriptions to models ([#335](https://github.com/kuzzleio/kuzzle-device-manager/issues/335)) ([de00fb7](https://github.com/kuzzleio/kuzzle-device-manager/commit/de00fb73161c50e42ca504ed9c829099cd5ba44a))

# [2.4.0-beta.14](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.13...v2.4.0-beta.14) (2024-03-13)


### Bug Fixes

* improve measure export to be usable with multiple measures in one measure ([#330](https://github.com/kuzzleio/kuzzle-device-manager/issues/330)) ([dab8d57](https://github.com/kuzzleio/kuzzle-device-manager/commit/dab8d57957a4ff2423ae3c29203a1bd7a55a5155))


### Features

* **assets:** remove assetId in upsert ([#326](https://github.com/kuzzleio/kuzzle-device-manager/issues/326)) ([2f286de](https://github.com/kuzzleio/kuzzle-device-manager/commit/2f286de85d286bbd13bdc4c1385a9ce4d4ffcb50))
* implement comprehensible metadata ([#332](https://github.com/kuzzleio/kuzzle-device-manager/issues/332)) ([e80ef8e](https://github.com/kuzzleio/kuzzle-device-manager/commit/e80ef8eb660dd20024b72279007b8aa2f369160c))

# [2.4.0-beta.13](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.12...v2.4.0-beta.13) (2024-01-11)


### Bug Fixes

* **ci:** fix npm glob not working anymore ([18e79aa](https://github.com/kuzzleio/kuzzle-device-manager/commit/18e79aa638be41f8e8ecdb42f2d150f730dcebc5))

# [2.4.0-beta.12](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.11...v2.4.0-beta.12) (2024-01-11)


### Bug Fixes

* **npm:** fix repository url ([514dc59](https://github.com/kuzzleio/kuzzle-device-manager/commit/514dc59913950299354b22a99febe525f1190d96))

# [2.4.0-beta.11](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.10...v2.4.0-beta.11) (2024-01-09)


### Bug Fixes

* update semantic-release ([380c8b3](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/380c8b340e925bfca0f1c435c2fcaa6c2f20ced0))

# [2.4.0-beta.10](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.9...v2.4.0-beta.10) (2024-01-09)


### Bug Fixes

* **assetsGroups:** disable checkRights on impersonate ([#325](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/325)) ([eaa3edc](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/eaa3edc678529f0a4b1e0f440764e3c8f8504f62))


### Features

* **asset:** add upsert method ([#323](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/323)) ([5f87787](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/5f8778734849386a796eed6ae6071757978bc956))

# [2.4.0-beta.9](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.8...v2.4.0-beta.9) (2023-11-06)


### Bug Fixes

* improve get internal devices documents ([03ccb29](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/03ccb297c9f86ee6fe78acfe9dace932c96af568))

# [2.4.0-beta.8](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.7...v2.4.0-beta.8) (2023-11-04)


### Bug Fixes

* correct KuzzleRequest for pipes ([ef932d1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/ef932d1b874e3768c091783819e6b063b4f1211a))

# [2.4.0-beta.7](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.6...v2.4.0-beta.7) (2023-11-03)


### Features

* **digitalTwin:** allow to modify mapping from application ([#322](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/322)) ([89d375a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/89d375a97892aad6b4cf976a38581cb0d7a14936))
* **digitalTwin:** implement generic document pipes triggers ([#321](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/321)) ([60a21fc](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/60a21fc8ced1e925efbad9b79cc0de511efac46c))

# [2.4.0-beta.6](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.5...v2.4.0-beta.6) (2023-10-20)


### Bug Fixes

* **asset_migration:** fixes multiple assets migration and optimize ([fd546cf](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/fd546cf4141208f2742f3f0a0b303e6e5903ef56))

# [2.4.0-beta.5](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.4...v2.4.0-beta.5) (2023-10-03)


### Bug Fixes

* **assets:** migrate tenant only if user is admin ([c24f942](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/c24f942673b37e798c9f89a098ad6747fd4977bd))
* **assetsMigrateTenant:** add type for frontend and fix admin only ([e249f13](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/e249f13d3e2bba70023177374c0874d982f78226))
* **migrateTenant:** clear groups of newly created assets ([79f6a5a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/79f6a5a84a34fd526e3820455cdf999364c49ad1))


### Features

* **assets:** assets migrate tenant ([5f05101](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/5f0510120428cbaffaa4569a705a5f20644d8c83))

# [2.4.0-beta.4](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.3...v2.4.0-beta.4) (2023-09-12)


### Bug Fixes

* **export:** correct scroll in getNamedMeasures ([05fe4fd](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/05fe4fd081e049978e1fab06f82bce1bb1dc0950))

# [2.4.0-beta.3](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.2...v2.4.0-beta.3) (2023-09-05)


### Bug Fixes

* **ci:** correct github token in ci ([a5a6b69](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/a5a6b69898defc1cdb22b57d389ad745ee75de8e))

# [2.4.0-beta.2](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.1...v2.4.0-beta.2) (2023-09-05)


### Bug Fixes

* copy-version script ([72b5e49](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/72b5e496c81700fddd9b475cb77965c3b6091de7))


### Features

* improve export ([#316](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/316)) ([51db84a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/51db84a5f50fa3381454697cee0a06300b07b4ea))

# [2.4.0-beta.1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.2...v2.4.0-beta.1) (2023-08-24)


### Features

* digitaltwin exports ([#315](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/315)) ([aab65af](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/aab65afbc13205ea695c503fbbdf2326fe3cafd2))
* **measures:** add lastMeasuredAt on DigitalTwin ([#314](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/314)) ([05b8a53](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/05b8a53970e76cc2d2a3de3b98173c43b8cb54e0))

## [2.3.2](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.1...v2.3.2) (2023-08-14)


### Bug Fixes

* **types:** correct type package publish ([c0c0375](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/c0c0375409f33615aedf2800c2508402c3ca37cd))

## [2.3.1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.0...v2.3.1) (2023-08-14)


### Bug Fixes

* **types:** correct type package publish ([fa9163a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/fa9163ab18f7cc4900bb2a8321c815d535f6c41b))

# [2.3.0](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.2.8...v2.3.0) (2023-08-14)


### Bug Fixes

* composite measures should be correctly exported to CSV ([#309](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/309)) ([487c1e8](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/487c1e8a94b1f9c3f99efd9ac0c953c576512df8))
* **docs:** wrong arguments in models' getDevice request ([#310](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/310)) ([028c65c](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/028c65cfa29ad0df549523ee43d4b4ad91d68d20))


### Features

* **assetGroups:** add assetGroups roles ([b9d0fae](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/b9d0fae9d5401783083a3c1f504021fd01e5c3c7))
* **assetGroups:** add groups for assets ([#306](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/306)) ([10de8b4](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/10de8b4a85f4693ff76010e44249c7a6bba9302a))
* **assetGroups:** add lastUpdate on changes  ([#311](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/311)) ([36a4575](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/36a457570e5d8d387fe854f897cc3541ee5be2b2))
* **semantic-release:** add semantic release support to device manager ([99b1683](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/99b168369a102f9c91fb63928132a2d54770de41))
