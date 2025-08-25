## [2.9.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0...v2.9.0) (2025-08-25)


### Features

* remove engineGroup parameter and handle the case commons ([#415](https://github.com/kuzzleio/kuzzle-device-manager/issues/415)) ([4ac4972](https://github.com/kuzzleio/kuzzle-device-manager/commit/4ac4972858aca389e82a62ad14cab8f360420bf9))
* update tenant role for attach and detach device ([#420](https://github.com/kuzzleio/kuzzle-device-manager/issues/420)) ([67b7dcb](https://github.com/kuzzleio/kuzzle-device-manager/commit/67b7dcbf0e649b9c81c30adaead6dd4f07ce09bd))


### Bug Fixes

* asset commons case ([#418](https://github.com/kuzzleio/kuzzle-device-manager/issues/418)) ([c4bf2ac](https://github.com/kuzzleio/kuzzle-device-manager/commit/c4bf2ac21ec09e9afd48dac4ee9bec42adec80c5))
* **assetModels:** error on create asset model with commons engine ([#417](https://github.com/kuzzleio/kuzzle-device-manager/issues/417)) ([a5acf07](https://github.com/kuzzleio/kuzzle-device-manager/commit/a5acf070cd41d28fb8ca70e66a6d9e438329f1c1))
* manager error when asset model is not found ([#419](https://github.com/kuzzleio/kuzzle-device-manager/issues/419)) ([08e9a94](https://github.com/kuzzleio/kuzzle-device-manager/commit/08e9a9478d70d554d0359a51f615c70130e74fa0))
* **model:** asset model metadata update ([#423](https://github.com/kuzzleio/kuzzle-device-manager/issues/423)) ([ddc95dd](https://github.com/kuzzleio/kuzzle-device-manager/commit/ddc95ddf441631271ccd8e97c0cbb46ab6c8df06))
* **plugin exports:** export pipe event for DocumentBefore/Aftersearch ([#421](https://github.com/kuzzleio/kuzzle-device-manager/issues/421)) ([d12d93f](https://github.com/kuzzleio/kuzzle-device-manager/commit/d12d93ff69d1ea758e4c5e43dfda1142693f9c68))

## [2.9.0-dev.3](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.9.0-dev.2...v2.9.0-dev.3) (2025-06-18)


### Bug Fixes

* **model:** asset model metadata update ([#423](https://github.com/kuzzleio/kuzzle-device-manager/issues/423)) ([ddc95dd](https://github.com/kuzzleio/kuzzle-device-manager/commit/ddc95ddf441631271ccd8e97c0cbb46ab6c8df06))

## [2.9.0-dev.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.9.0-dev.1...v2.9.0-dev.2) (2025-05-15)


### Features

* update tenant role for attach and detach device ([#420](https://github.com/kuzzleio/kuzzle-device-manager/issues/420)) ([67b7dcb](https://github.com/kuzzleio/kuzzle-device-manager/commit/67b7dcbf0e649b9c81c30adaead6dd4f07ce09bd))


### Bug Fixes

* **plugin exports:** export pipe event for DocumentBefore/Aftersearch ([#421](https://github.com/kuzzleio/kuzzle-device-manager/issues/421)) ([d12d93f](https://github.com/kuzzleio/kuzzle-device-manager/commit/d12d93ff69d1ea758e4c5e43dfda1142693f9c68))

## [2.9.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0...v2.9.0-dev.1) (2025-05-13)


### Features

* remove engineGroup parameter and handle the case commons ([#415](https://github.com/kuzzleio/kuzzle-device-manager/issues/415)) ([4ac4972](https://github.com/kuzzleio/kuzzle-device-manager/commit/4ac4972858aca389e82a62ad14cab8f360420bf9))


### Bug Fixes

* asset commons case ([#418](https://github.com/kuzzleio/kuzzle-device-manager/issues/418)) ([c4bf2ac](https://github.com/kuzzleio/kuzzle-device-manager/commit/c4bf2ac21ec09e9afd48dac4ee9bec42adec80c5))
* **assetModels:** error on create asset model with commons engine ([#417](https://github.com/kuzzleio/kuzzle-device-manager/issues/417)) ([a5acf07](https://github.com/kuzzleio/kuzzle-device-manager/commit/a5acf070cd41d28fb8ca70e66a6d9e438329f1c1))
* manager error when asset model is not found ([#419](https://github.com/kuzzleio/kuzzle-device-manager/issues/419)) ([08e9a94](https://github.com/kuzzleio/kuzzle-device-manager/commit/08e9a9478d70d554d0359a51f615c70130e74fa0))

## [2.8.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.2...v2.8.0) (2025-05-13)


### Features

* **assetsGroups:** add service to handle groups related actions in a way that triggers pipe like devices and assets ([1a43fe7](https://github.com/kuzzleio/kuzzle-device-manager/commit/1a43fe7cdb210b6f0b19dbefad49a422ef792e06))
* **deviceManagerEngine:** free devices after engine deletion ([#382](https://github.com/kuzzleio/kuzzle-device-manager/issues/382)) ([7c32f9f](https://github.com/kuzzleio/kuzzle-device-manager/commit/7c32f9f71498376e252ee250cb07efea6744f852))
* **groupmodels:** add possibility to set up group models with metadatas ([#392](https://github.com/kuzzleio/kuzzle-device-manager/issues/392)) ([19b2b70](https://github.com/kuzzleio/kuzzle-device-manager/commit/19b2b703c8d84506909b8eb631d9a7c6f20b08ba))
* measures should not be historized on asset ([#404](https://github.com/kuzzleio/kuzzle-device-manager/issues/404)) ([6a73786](https://github.com/kuzzleio/kuzzle-device-manager/commit/6a73786a5ab53dd1cbde1e495643fabe8b484b67))
* update measure model for localization ([#385](https://github.com/kuzzleio/kuzzle-device-manager/issues/385)) ([429678f](https://github.com/kuzzleio/kuzzle-device-manager/commit/429678f3f224687911e78eb54f7fed4e932b9c38))


### Bug Fixes

* clean on detach ([#400](https://github.com/kuzzleio/kuzzle-device-manager/issues/400)) ([cb8badf](https://github.com/kuzzleio/kuzzle-device-manager/commit/cb8badfb2ed6f37e5e618f0dbf859d772d9bfa36))
* last measured at ([#399](https://github.com/kuzzleio/kuzzle-device-manager/issues/399)) ([07830c0](https://github.com/kuzzleio/kuzzle-device-manager/commit/07830c03e6bc44c289844a9ff4eafc0a5a7f2a2a))
* update documentation for indentations ([#401](https://github.com/kuzzleio/kuzzle-device-manager/issues/401)) ([fdd758e](https://github.com/kuzzleio/kuzzle-device-manager/commit/fdd758e51c6113bfdfea2991a3b8f0c100a25054))

## [2.8.0-beta.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.2...v2.8.0-beta.1) (2025-03-05)


### Features

* **assetsGroups:** add service to handle groups related actions in a way that triggers pipe like devices and assets ([1a43fe7](https://github.com/kuzzleio/kuzzle-device-manager/commit/1a43fe7cdb210b6f0b19dbefad49a422ef792e06))
* **deviceManagerEngine:** free devices after engine deletion ([#382](https://github.com/kuzzleio/kuzzle-device-manager/issues/382)) ([7c32f9f](https://github.com/kuzzleio/kuzzle-device-manager/commit/7c32f9f71498376e252ee250cb07efea6744f852))
* **groupmodels:** add possibility to set up group models with metadatas ([#392](https://github.com/kuzzleio/kuzzle-device-manager/issues/392)) ([19b2b70](https://github.com/kuzzleio/kuzzle-device-manager/commit/19b2b703c8d84506909b8eb631d9a7c6f20b08ba))
* measures should not be historized on asset ([#404](https://github.com/kuzzleio/kuzzle-device-manager/issues/404)) ([6a73786](https://github.com/kuzzleio/kuzzle-device-manager/commit/6a73786a5ab53dd1cbde1e495643fabe8b484b67))
* update measure model for localization ([#385](https://github.com/kuzzleio/kuzzle-device-manager/issues/385)) ([429678f](https://github.com/kuzzleio/kuzzle-device-manager/commit/429678f3f224687911e78eb54f7fed4e932b9c38))


### Bug Fixes

* clean on detach ([#400](https://github.com/kuzzleio/kuzzle-device-manager/issues/400)) ([cb8badf](https://github.com/kuzzleio/kuzzle-device-manager/commit/cb8badfb2ed6f37e5e618f0dbf859d772d9bfa36))
* last measured at ([#399](https://github.com/kuzzleio/kuzzle-device-manager/issues/399)) ([07830c0](https://github.com/kuzzleio/kuzzle-device-manager/commit/07830c03e6bc44c289844a9ff4eafc0a5a7f2a2a))
* update documentation for indentations ([#401](https://github.com/kuzzleio/kuzzle-device-manager/issues/401)) ([fdd758e](https://github.com/kuzzleio/kuzzle-device-manager/commit/fdd758e51c6113bfdfea2991a3b8f0c100a25054))

## [2.8.0-dev.11](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.10...v2.8.0-dev.11) (2025-04-18)


### Bug Fixes

* manager error when asset model is not found ([#419](https://github.com/kuzzleio/kuzzle-device-manager/issues/419)) ([08e9a94](https://github.com/kuzzleio/kuzzle-device-manager/commit/08e9a9478d70d554d0359a51f615c70130e74fa0))

## [2.8.0-dev.10](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.9...v2.8.0-dev.10) (2025-04-18)


### Bug Fixes

* **assetModels:** error on create asset model with commons engine ([#417](https://github.com/kuzzleio/kuzzle-device-manager/issues/417)) ([a5acf07](https://github.com/kuzzleio/kuzzle-device-manager/commit/a5acf070cd41d28fb8ca70e66a6d9e438329f1c1))

## [2.8.0-dev.9](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.8...v2.8.0-dev.9) (2025-04-18)


### Bug Fixes

* asset commons case ([#418](https://github.com/kuzzleio/kuzzle-device-manager/issues/418)) ([c4bf2ac](https://github.com/kuzzleio/kuzzle-device-manager/commit/c4bf2ac21ec09e9afd48dac4ee9bec42adec80c5))

## [2.8.0-dev.8](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.7...v2.8.0-dev.8) (2025-04-17)


### Features

* remove engineGroup parameter and handle the case commons ([#415](https://github.com/kuzzleio/kuzzle-device-manager/issues/415)) ([4ac4972](https://github.com/kuzzleio/kuzzle-device-manager/commit/4ac4972858aca389e82a62ad14cab8f360420bf9))

## [2.8.0-dev.7](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.6...v2.8.0-dev.7) (2025-03-05)


### Features

* measures should not be historized on asset ([#404](https://github.com/kuzzleio/kuzzle-device-manager/issues/404)) ([6a73786](https://github.com/kuzzleio/kuzzle-device-manager/commit/6a73786a5ab53dd1cbde1e495643fabe8b484b67))

## [2.8.0-dev.6](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.5...v2.8.0-dev.6) (2025-02-17)


### Bug Fixes

* **device:** use `_attachEngine` on create and upsert ([#405](https://github.com/kuzzleio/kuzzle-device-manager/issues/405)) ([94d44ed](https://github.com/kuzzleio/kuzzle-device-manager/commit/94d44ed164f1731fcdbf2addeddbef7f82708a7d))
* **digitalTwin:** correct race condition ([#398](https://github.com/kuzzleio/kuzzle-device-manager/issues/398)) ([8da2861](https://github.com/kuzzleio/kuzzle-device-manager/commit/8da2861f974868414505893f043781f57c55aa82))

## [2.7.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.1...v2.7.2) (2025-02-17)


### Bug Fixes

* **device:** use `_attachEngine` on create and upsert ([#405](https://github.com/kuzzleio/kuzzle-device-manager/issues/405)) ([94d44ed](https://github.com/kuzzleio/kuzzle-device-manager/commit/94d44ed164f1731fcdbf2addeddbef7f82708a7d))

## [2.8.0-dev.5](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.4...v2.8.0-dev.5) (2025-02-17)


### Features

* **assetsGroups:** add service to handle groups related actions in a way that triggers pipe like devices and assets ([1a43fe7](https://github.com/kuzzleio/kuzzle-device-manager/commit/1a43fe7cdb210b6f0b19dbefad49a422ef792e06))

## [2.8.0-dev.4](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.3...v2.8.0-dev.4) (2025-02-14)


### Features

* update measure model for localization ([#385](https://github.com/kuzzleio/kuzzle-device-manager/issues/385)) ([429678f](https://github.com/kuzzleio/kuzzle-device-manager/commit/429678f3f224687911e78eb54f7fed4e932b9c38))

## [2.8.0-dev.3](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.2...v2.8.0-dev.3) (2025-02-12)


### Bug Fixes

* update documentation for indentations ([#401](https://github.com/kuzzleio/kuzzle-device-manager/issues/401)) ([fdd758e](https://github.com/kuzzleio/kuzzle-device-manager/commit/fdd758e51c6113bfdfea2991a3b8f0c100a25054))

## [2.8.0-dev.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.8.0-dev.1...v2.8.0-dev.2) (2025-02-04)


### Features

* **groupmodels:** add possibility to set up group models with metadatas ([#392](https://github.com/kuzzleio/kuzzle-device-manager/issues/392)) ([19b2b70](https://github.com/kuzzleio/kuzzle-device-manager/commit/19b2b703c8d84506909b8eb631d9a7c6f20b08ba))


### Bug Fixes

* clean on detach ([#400](https://github.com/kuzzleio/kuzzle-device-manager/issues/400)) ([cb8badf](https://github.com/kuzzleio/kuzzle-device-manager/commit/cb8badfb2ed6f37e5e618f0dbf859d772d9bfa36))

## [2.8.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.1-dev.1...v2.8.0-dev.1) (2025-02-04)


### Features

* **deviceManagerEngine:** free devices after engine deletion ([#382](https://github.com/kuzzleio/kuzzle-device-manager/issues/382)) ([7c32f9f](https://github.com/kuzzleio/kuzzle-device-manager/commit/7c32f9f71498376e252ee250cb07efea6744f852))

## [2.7.1-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.0...v2.7.1-dev.1) (2025-02-03)


### Bug Fixes

* last measured at ([#399](https://github.com/kuzzleio/kuzzle-device-manager/issues/399)) ([07830c0](https://github.com/kuzzleio/kuzzle-device-manager/commit/07830c03e6bc44c289844a9ff4eafc0a5a7f2a2a))

## [2.7.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.7.0...v2.7.1) (2025-01-30)


### Bug Fixes

* **digitalTwin:** correct race condition ([#398](https://github.com/kuzzleio/kuzzle-device-manager/issues/398)) ([8da2861](https://github.com/kuzzleio/kuzzle-device-manager/commit/8da2861f974868414505893f043781f57c55aa82))

## [2.7.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.6.0...v2.7.0) (2025-01-22)


### Features

* update deps ([#393](https://github.com/kuzzleio/kuzzle-device-manager/issues/393)) ([1b9b936](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b9b9362884eaab3d5ce72acc6d3041802f39ee2))


### Bug Fixes

* conflict between ([adf8d0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/adf8d0f1a356d2769432be3e4b8acd49e94b16ba))
* typo in packages/package.json ([9b6c495](https://github.com/kuzzleio/kuzzle-device-manager/commit/9b6c4958e7c2fb02974ddb7485944a69f388d650))

## [2.7.0-beta.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.6.0...v2.7.0-beta.1) (2025-01-22)


### Features

* update deps ([#393](https://github.com/kuzzleio/kuzzle-device-manager/issues/393)) ([1b9b936](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b9b9362884eaab3d5ce72acc6d3041802f39ee2))


### Bug Fixes

* conflict between ([adf8d0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/adf8d0f1a356d2769432be3e4b8acd49e94b16ba))
* typo in packages/package.json ([9b6c495](https://github.com/kuzzleio/kuzzle-device-manager/commit/9b6c4958e7c2fb02974ddb7485944a69f388d650))

## [2.7.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.6.0...v2.7.0-dev.1) (2025-01-22)


### Features

* update deps ([#393](https://github.com/kuzzleio/kuzzle-device-manager/issues/393)) ([1b9b936](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b9b9362884eaab3d5ce72acc6d3041802f39ee2))


### Bug Fixes

* conflict between ([adf8d0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/adf8d0f1a356d2769432be3e4b8acd49e94b16ba))
* typo in packages/package.json ([9b6c495](https://github.com/kuzzleio/kuzzle-device-manager/commit/9b6c4958e7c2fb02974ddb7485944a69f388d650))

## [2.6.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.1...v2.6.0) (2025-01-22)


### Features

* trigger release ([9c82581](https://github.com/kuzzleio/kuzzle-device-manager/commit/9c8258156818db8cbc7c7b43edd5fd4b703738ef))
* Trigger release ([a800c54](https://github.com/kuzzleio/kuzzle-device-manager/commit/a800c548ac538eca9e9f4a1bebbba5478ca92c82))


### Bug Fixes

* Trigger release ([5025a0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/5025a0f4f283bbae4a92455273819599a928b4f7))

## [2.6.0-beta.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.6.0-beta.1...v2.6.0-beta.2) (2025-01-22)


### Bug Fixes

* Trigger release ([5025a0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/5025a0f4f283bbae4a92455273819599a928b4f7))

## [2.6.0-dev.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.6.0-dev.1...v2.6.0-dev.2) (2025-01-22)


### Features

* trigger release ([9c82581](https://github.com/kuzzleio/kuzzle-device-manager/commit/9c8258156818db8cbc7c7b43edd5fd4b703738ef))


### Bug Fixes

* conflict between ([adf8d0f](https://github.com/kuzzleio/kuzzle-device-manager/commit/adf8d0f1a356d2769432be3e4b8acd49e94b16ba))
* typo in packages/package.json ([9b6c495](https://github.com/kuzzleio/kuzzle-device-manager/commit/9b6c4958e7c2fb02974ddb7485944a69f388d650))

# [2.6.0-beta.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0...v2.6.0-beta.1) (2025-01-08)

- trigger release ([9c82581](https://github.com/kuzzleio/kuzzle-device-manager/commit/9c8258156818db8cbc7c7b43edd5fd4b703738ef))

## [2.6.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.1...v2.6.0-dev.1) (2025-01-22)

### Features

- update deps ([#393](https://github.com/kuzzleio/kuzzle-device-manager/issues/393)) ([1b9b936](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b9b9362884eaab3d5ce72acc6d3041802f39ee2))

## [2.5.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0...v2.5.1) (2025-01-09)

### Bug Fixes

- **measure:** add mutex to asset update to prevent race condition ([#389](https://github.com/kuzzleio/kuzzle-device-manager/issues/389)) ([53371f4](https://github.com/kuzzleio/kuzzle-device-manager/commit/53371f440550832b1f96ee1dfb87a65219dfff19))

# [2.5.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.4...v2.5.0) (2024-12-05)

### Bug Fixes

- **assetservice:** can't replace metadata if not present in asset ([#384](https://github.com/kuzzleio/kuzzle-device-manager/issues/384)) ([eb65c0a](https://github.com/kuzzleio/kuzzle-device-manager/commit/eb65c0a1ae65488033a5422ce0879e8820fe05fa))
- backport fix ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([5392b56](https://github.com/kuzzleio/kuzzle-device-manager/commit/5392b56a9478b1c1932845ee44965d5978197350))

### Features

- add editor hint support ([#386](https://github.com/kuzzleio/kuzzle-device-manager/issues/386)) ([a9b62df](https://github.com/kuzzleio/kuzzle-device-manager/commit/a9b62df423f1218c7bd7866e33b33626f4f17e06))
- **measure:** allow measures to be pushed on Assets via API (no devices) ([#344](https://github.com/kuzzleio/kuzzle-device-manager/issues/344)) ([c1073c1](https://github.com/kuzzleio/kuzzle-device-manager/commit/c1073c1f0ccb4cfc7cee64d86c51a4999617fd41))
- **softTenants:** add softTenant ids to assets measures documents ([#383](https://github.com/kuzzleio/kuzzle-device-manager/issues/383)) ([1b36fe0](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b36fe019ce11a0fb7faf4ce5f3c6c2cff4223e9))

# [2.5.0-dev.5](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0-dev.4...v2.5.0-dev.5) (2024-12-05)

### Bug Fixes

- **assetservice:** can't replace metadata if not present in asset ([#384](https://github.com/kuzzleio/kuzzle-device-manager/issues/384)) ([eb65c0a](https://github.com/kuzzleio/kuzzle-device-manager/commit/eb65c0a1ae65488033a5422ce0879e8820fe05fa))

# [2.5.0-dev.4](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0-dev.3...v2.5.0-dev.4) (2024-12-05)

### Features

- add editor hint support ([#386](https://github.com/kuzzleio/kuzzle-device-manager/issues/386)) ([a9b62df](https://github.com/kuzzleio/kuzzle-device-manager/commit/a9b62df423f1218c7bd7866e33b33626f4f17e06))

# [2.5.0-dev.3](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0-dev.2...v2.5.0-dev.3) (2024-12-05)

### Features

- **softTenants:** add softTenant ids to assets measures documents ([#383](https://github.com/kuzzleio/kuzzle-device-manager/issues/383)) ([1b36fe0](https://github.com/kuzzleio/kuzzle-device-manager/commit/1b36fe019ce11a0fb7faf4ce5f3c6c2cff4223e9))

# [2.5.0-beta.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0-beta.1...v2.5.0-beta.2) (2024-11-18)

### Bug Fixes

- backport fix ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([5392b56](https://github.com/kuzzleio/kuzzle-device-manager/commit/5392b56a9478b1c1932845ee44965d5978197350))
- getAsset should search in commons assets too ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([d588a93](https://github.com/kuzzleio/kuzzle-device-manager/commit/d588a93b0dd5b270199083cfb0856e34b57afa66))

# [2.5.0-dev.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.5.0-dev.1...v2.5.0-dev.2) (2024-11-18)

### Bug Fixes

- backport fix ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([5392b56](https://github.com/kuzzleio/kuzzle-device-manager/commit/5392b56a9478b1c1932845ee44965d5978197350))
- getAsset should search in commons assets too ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([d588a93](https://github.com/kuzzleio/kuzzle-device-manager/commit/d588a93b0dd5b270199083cfb0856e34b57afa66))

# [2.5.0-beta.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.3...v2.5.0-beta.1) (2024-11-12)

### Features

- **measure:** allow measures to be pushed on Assets via API (no devices) ([#344](https://github.com/kuzzleio/kuzzle-device-manager/issues/344)) ([c1073c1](https://github.com/kuzzleio/kuzzle-device-manager/commit/c1073c1f0ccb4cfc7cee64d86c51a4999617fd41))

# [2.5.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.3...v2.5.0-dev.1) (2024-11-08)

### Features

- **measure:** allow measures to be pushed on Assets via API (no devices) ([#344](https://github.com/kuzzleio/kuzzle-device-manager/issues/344)) ([c1073c1](https://github.com/kuzzleio/kuzzle-device-manager/commit/c1073c1f0ccb4cfc7cee64d86c51a4999617fd41))

## [2.4.4](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.3...v2.4.4) (2024-11-18)

### Bug Fixes

- getAsset should search in commons assets too ([#380](https://github.com/kuzzleio/kuzzle-device-manager/issues/380)) ([d588a93](https://github.com/kuzzleio/kuzzle-device-manager/commit/d588a93b0dd5b270199083cfb0856e34b57afa66))

## [2.4.3](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.2...v2.4.3) (2024-10-25)

### Bug Fixes

- **device:** create apply default metadata ([#378](https://github.com/kuzzleio/kuzzle-device-manager/issues/378)) ([7af109c](https://github.com/kuzzleio/kuzzle-device-manager/commit/7af109c6e184a3ad04479f4d6626ddeb84d18cfe))

## [2.4.3-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.2...v2.4.3-dev.1) (2024-10-25)

### Bug Fixes

- **device:** create apply default metadata ([#378](https://github.com/kuzzleio/kuzzle-device-manager/issues/378)) ([7af109c](https://github.com/kuzzleio/kuzzle-device-manager/commit/7af109c6e184a3ad04479f4d6626ddeb84d18cfe))

## [2.4.2](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.1...v2.4.2) (2024-10-08)

### Bug Fixes

- trigger events on metadataReplace call ([#377](https://github.com/kuzzleio/kuzzle-device-manager/issues/377)) ([df4b417](https://github.com/kuzzleio/kuzzle-device-manager/commit/df4b417d81aae9ab3aa1614bd77abd8286e21984))
- trigger release ([4caa71b](https://github.com/kuzzleio/kuzzle-device-manager/commit/4caa71b12d55b56d08382229c366fb237575b31d))

## [2.4.2-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.1...v2.4.2-dev.1) (2024-10-08)

### Bug Fixes

- trigger events on metadataReplace call ([#377](https://github.com/kuzzleio/kuzzle-device-manager/issues/377)) ([df4b417](https://github.com/kuzzleio/kuzzle-device-manager/commit/df4b417d81aae9ab3aa1614bd77abd8286e21984))

## [2.4.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0...v2.4.1) (2024-10-04)

### Bug Fixes

- queryTranslator import ([#376](https://github.com/kuzzleio/kuzzle-device-manager/issues/376)) ([f786244](https://github.com/kuzzleio/kuzzle-device-manager/commit/f78624488e44e26e256f4e3dfab5fa9fdd612183))
- **release:** correct the CI [skip ci] ([fe2eb83](https://github.com/kuzzleio/kuzzle-device-manager/commit/fe2eb8364f27a8b1f898676f222203325dca72dd))

## [2.4.1-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0...v2.4.1-dev.1) (2024-10-04)

### Bug Fixes

- queryTranslator import ([#376](https://github.com/kuzzleio/kuzzle-device-manager/issues/376)) ([f786244](https://github.com/kuzzleio/kuzzle-device-manager/commit/f78624488e44e26e256f4e3dfab5fa9fdd612183))

# [2.4.0](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.3.2...v2.4.0) (2024-10-01)

### Bug Fixes

- add specific dev branch in releaserc.js ([e11a823](https://github.com/kuzzleio/kuzzle-device-manager/commit/e11a82390729d047c192d0a8d809356abb99f4c6))
- **asset_migration:** fixes multiple assets migration and optimize ([fd546cf](https://github.com/kuzzleio/kuzzle-device-manager/commit/fd546cf4141208f2742f3f0a0b303e6e5903ef56))
- **assetsGroups:** disable checkRights on impersonate ([#325](https://github.com/kuzzleio/kuzzle-device-manager/issues/325)) ([eaa3edc](https://github.com/kuzzleio/kuzzle-device-manager/commit/eaa3edc678529f0a4b1e0f440764e3c8f8504f62))
- **assets:** migrate tenant only if user is admin ([c24f942](https://github.com/kuzzleio/kuzzle-device-manager/commit/c24f942673b37e798c9f89a098ad6747fd4977bd))
- **assetsMigrateTenant:** add type for frontend and fix admin only ([e249f13](https://github.com/kuzzleio/kuzzle-device-manager/commit/e249f13d3e2bba70023177374c0874d982f78226))
- catch errors when updating the mappings on startup ([#338](https://github.com/kuzzleio/kuzzle-device-manager/issues/338)) ([e09c5a3](https://github.com/kuzzleio/kuzzle-device-manager/commit/e09c5a346d50b645830c82b33f10370e2dcbbd0c))
- **ci:** correct github token in ci ([a5a6b69](https://github.com/kuzzleio/kuzzle-device-manager/commit/a5a6b69898defc1cdb22b57d389ad745ee75de8e))
- **ci:** fix npm glob not working anymore ([18e79aa](https://github.com/kuzzleio/kuzzle-device-manager/commit/18e79aa638be41f8e8ecdb42f2d150f730dcebc5))
- copy-version script ([72b5e49](https://github.com/kuzzleio/kuzzle-device-manager/commit/72b5e496c81700fddd9b475cb77965c3b6091de7))
- correct api types ([#333](https://github.com/kuzzleio/kuzzle-device-manager/issues/333)) ([05c426f](https://github.com/kuzzleio/kuzzle-device-manager/commit/05c426fbfaf9602bb46d4b0c8f472fab85280b3a))
- correct KuzzleRequest for pipes ([ef932d1](https://github.com/kuzzleio/kuzzle-device-manager/commit/ef932d1b874e3768c091783819e6b063b4f1211a))
- correct release script ([f02c285](https://github.com/kuzzleio/kuzzle-device-manager/commit/f02c2850b8b767e724df72fc907a8e9799baf966))
- **device-metadata:** fetch device's metadata from assigned tenant when available ([#374](https://github.com/kuzzleio/kuzzle-device-manager/issues/374)) ([acfd8a0](https://github.com/kuzzleio/kuzzle-device-manager/commit/acfd8a0f42b39b0b1e592806e39edd2435216b0c))
- **device:** correct device HTTP API ([#354](https://github.com/kuzzleio/kuzzle-device-manager/issues/354)) ([d9fe9e1](https://github.com/kuzzleio/kuzzle-device-manager/commit/d9fe9e10d14c7abe03f17ce0a3331fae948de8d8))
- **engine:** update conflicts ask return values ([0f817c3](https://github.com/kuzzleio/kuzzle-device-manager/commit/0f817c37560fb311f39c18e8d56838414d2a8379))
- **export:** correct scroll in getNamedMeasures ([05fe4fd](https://github.com/kuzzleio/kuzzle-device-manager/commit/05fe4fd081e049978e1fab06f82bce1bb1dc0950))
- improve get internal devices documents ([03ccb29](https://github.com/kuzzleio/kuzzle-device-manager/commit/03ccb297c9f86ee6fe78acfe9dace932c96af568))
- improve measure export to be usable with multiple measures in one measure ([#330](https://github.com/kuzzleio/kuzzle-device-manager/issues/330)) ([dab8d57](https://github.com/kuzzleio/kuzzle-device-manager/commit/dab8d57957a4ff2423ae3c29203a1bd7a55a5155))
- **migrateTenant:** clear groups of newly created assets ([79f6a5a](https://github.com/kuzzleio/kuzzle-device-manager/commit/79f6a5a84a34fd526e3820455cdf999364c49ad1))
- **models:** list asset returns commons assets ([#345](https://github.com/kuzzleio/kuzzle-device-manager/issues/345)) ([2844437](https://github.com/kuzzleio/kuzzle-device-manager/commit/28444377b536614f0a70d397b5f37775464f50aa))
- **npm:** fix repository url ([514dc59](https://github.com/kuzzleio/kuzzle-device-manager/commit/514dc59913950299354b22a99febe525f1190d96))
- only list asset models for the requested engine group ([#367](https://github.com/kuzzleio/kuzzle-device-manager/issues/367)) ([8a14207](https://github.com/kuzzleio/kuzzle-device-manager/commit/8a14207b14d7f7fd80d9af711f9ba9eed5c58735))
- update semantic-release ([380c8b3](https://github.com/kuzzleio/kuzzle-device-manager/commit/380c8b340e925bfca0f1c435c2fcaa6c2f20ced0))

### Features

- add actions to get last measures on digital twins ([#363](https://github.com/kuzzleio/kuzzle-device-manager/issues/363)) ([b8005a2](https://github.com/kuzzleio/kuzzle-device-manager/commit/b8005a2b2fb0071f2efa2ec3adeff9d965840a0c))
- add dev builds when pushing on 2-dev ([#375](https://github.com/kuzzleio/kuzzle-device-manager/issues/375)) ([aa11885](https://github.com/kuzzleio/kuzzle-device-manager/commit/aa118854c1b22eeac2bbb7b4abc891a51bb332be))
- add group descriptions to models ([#335](https://github.com/kuzzleio/kuzzle-device-manager/issues/335)) ([de00fb7](https://github.com/kuzzleio/kuzzle-device-manager/commit/de00fb73161c50e42ca504ed9c829099cd5ba44a))
- add log in decoders ([#339](https://github.com/kuzzleio/kuzzle-device-manager/issues/339)) ([fe08b7c](https://github.com/kuzzleio/kuzzle-device-manager/commit/fe08b7ce093892367a37d6e2f16ee1205071d639))
- add search actions for the models ([#362](https://github.com/kuzzleio/kuzzle-device-manager/issues/362)) ([9990e57](https://github.com/kuzzleio/kuzzle-device-manager/commit/9990e57db9bc845d6d6df1e64bed05e88e00f377))
- add tooltip model by asset model ([#341](https://github.com/kuzzleio/kuzzle-device-manager/issues/341)) ([865ae6d](https://github.com/kuzzleio/kuzzle-device-manager/commit/865ae6d5e898f9519b0fccbf3a0a6be5ce55aa57))
- add UTC export by default for devices and assets ([#342](https://github.com/kuzzleio/kuzzle-device-manager/issues/342)) ([878ca58](https://github.com/kuzzleio/kuzzle-device-manager/commit/878ca5803c2e68786b342bc1f3dd15b8a3514a77))
- **asset:** add upsert method ([#323](https://github.com/kuzzleio/kuzzle-device-manager/issues/323)) ([5f87787](https://github.com/kuzzleio/kuzzle-device-manager/commit/5f8778734849386a796eed6ae6071757978bc956))
- **assetrole:** add link / unlink device action to asset admin role ([#357](https://github.com/kuzzleio/kuzzle-device-manager/issues/357)) ([febf3a6](https://github.com/kuzzleio/kuzzle-device-manager/commit/febf3a6762e5525563c61776d27aaf31659a4748))
- **assets:** assets migrate tenant ([5f05101](https://github.com/kuzzleio/kuzzle-device-manager/commit/5f0510120428cbaffaa4569a705a5f20644d8c83))
- **assets:** remove assetId in upsert ([#326](https://github.com/kuzzleio/kuzzle-device-manager/issues/326)) ([2f286de](https://github.com/kuzzleio/kuzzle-device-manager/commit/2f286de85d286bbd13bdc4c1385a9ce4d4ffcb50))
- **configuration:** allow to specify Elasticsearch index settings ([#337](https://github.com/kuzzleio/kuzzle-device-manager/issues/337)) ([6d22fa9](https://github.com/kuzzleio/kuzzle-device-manager/commit/6d22fa9dbee7a662e84af660b061171b61b8d9d6))
- digitaltwin exports ([#315](https://github.com/kuzzleio/kuzzle-device-manager/issues/315)) ([aab65af](https://github.com/kuzzleio/kuzzle-device-manager/commit/aab65afbc13205ea695c503fbbdf2326fe3cafd2))
- **digitalTwin:** allow to modify mapping from application ([#322](https://github.com/kuzzleio/kuzzle-device-manager/issues/322)) ([89d375a](https://github.com/kuzzleio/kuzzle-device-manager/commit/89d375a97892aad6b4cf976a38581cb0d7a14936))
- **digitalTwin:** implement generic document pipes triggers ([#321](https://github.com/kuzzleio/kuzzle-device-manager/issues/321)) ([60a21fc](https://github.com/kuzzleio/kuzzle-device-manager/commit/60a21fc8ced1e925efbad9b79cc0de511efac46c))
- **engine:** add mappings update conflict ask call ([#340](https://github.com/kuzzleio/kuzzle-device-manager/issues/340)) ([5cd6aca](https://github.com/kuzzleio/kuzzle-device-manager/commit/5cd6acabe640e3e908db12f8166cd4c3d4e1f637))
- implement comprehensible metadata ([#332](https://github.com/kuzzleio/kuzzle-device-manager/issues/332)) ([e80ef8e](https://github.com/kuzzleio/kuzzle-device-manager/commit/e80ef8eb660dd20024b72279007b8aa2f369160c))
- improve export ([#316](https://github.com/kuzzleio/kuzzle-device-manager/issues/316)) ([51db84a](https://github.com/kuzzleio/kuzzle-device-manager/commit/51db84a5f50fa3381454697cee0a06300b07b4ea))
- improve search model request types ([#364](https://github.com/kuzzleio/kuzzle-device-manager/issues/364)) ([5310ad1](https://github.com/kuzzleio/kuzzle-device-manager/commit/5310ad1cf8a46b7bce31e6c26d6454f956574a44))
- **measure:** add device metadata to origin ([#356](https://github.com/kuzzleio/kuzzle-device-manager/issues/356)) ([1ed9d8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/1ed9d8bf1885569350d12287ade2da640f825ab7))
- **measuremodels:** add optional local names and unit to measure definitions ([#343](https://github.com/kuzzleio/kuzzle-device-manager/issues/343)) ([50038b2](https://github.com/kuzzleio/kuzzle-device-manager/commit/50038b2361bfa24e71e4df296a6a3ec27b332d7c))
- **measures:** add lastMeasuredAt on DigitalTwin ([#314](https://github.com/kuzzleio/kuzzle-device-manager/issues/314)) ([05b8a53](https://github.com/kuzzleio/kuzzle-device-manager/commit/05b8a53970e76cc2d2a3de3b98173c43b8cb54e0))
- **metadata:** add option field readOnly to prevent editing ([#358](https://github.com/kuzzleio/kuzzle-device-manager/issues/358)) ([e0641b4](https://github.com/kuzzleio/kuzzle-device-manager/commit/e0641b41c82bdbbc6f37a0f275bfd3199fce8156))
- **metadata:** add optional editor hints for metadata ([#370](https://github.com/kuzzleio/kuzzle-device-manager/issues/370)) ([afc5129](https://github.com/kuzzleio/kuzzle-device-manager/commit/afc51298eb33515ef5325d806150ac0ebf22b69c))
- **metadata:** add support nested metadata properties ([#348](https://github.com/kuzzleio/kuzzle-device-manager/issues/348)) ([17eda8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/17eda8b6c3802991eac3678e60ed614bfa8e172d))
- **metadata:** improve asset metadata ([#346](https://github.com/kuzzleio/kuzzle-device-manager/issues/346)) ([2eb5887](https://github.com/kuzzleio/kuzzle-device-manager/commit/2eb5887497d1e7449ca7c401274f6ff94453fe26))
- **roles:** add specific roles for assets and devices ([#365](https://github.com/kuzzleio/kuzzle-device-manager/issues/365)) ([a01982c](https://github.com/kuzzleio/kuzzle-device-manager/commit/a01982cd025d4436617e710aa407e209f0d4f375))
- upsert devices ([#355](https://github.com/kuzzleio/kuzzle-device-manager/issues/355)) ([c75abef](https://github.com/kuzzleio/kuzzle-device-manager/commit/c75abef4c313bbe33ad833189dfcc6fdc50fc15d))

# [2.4.0-dev.1](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.3.2...v2.4.0-dev.1) (2024-09-27)

### Bug Fixes

- add specific dev branch in releaserc.js ([e11a823](https://github.com/kuzzleio/kuzzle-device-manager/commit/e11a82390729d047c192d0a8d809356abb99f4c6))
- **asset_migration:** fixes multiple assets migration and optimize ([fd546cf](https://github.com/kuzzleio/kuzzle-device-manager/commit/fd546cf4141208f2742f3f0a0b303e6e5903ef56))
- **assetsGroups:** disable checkRights on impersonate ([#325](https://github.com/kuzzleio/kuzzle-device-manager/issues/325)) ([eaa3edc](https://github.com/kuzzleio/kuzzle-device-manager/commit/eaa3edc678529f0a4b1e0f440764e3c8f8504f62))
- **assets:** migrate tenant only if user is admin ([c24f942](https://github.com/kuzzleio/kuzzle-device-manager/commit/c24f942673b37e798c9f89a098ad6747fd4977bd))
- **assetsMigrateTenant:** add type for frontend and fix admin only ([e249f13](https://github.com/kuzzleio/kuzzle-device-manager/commit/e249f13d3e2bba70023177374c0874d982f78226))
- catch errors when updating the mappings on startup ([#338](https://github.com/kuzzleio/kuzzle-device-manager/issues/338)) ([e09c5a3](https://github.com/kuzzleio/kuzzle-device-manager/commit/e09c5a346d50b645830c82b33f10370e2dcbbd0c))
- **ci:** correct github token in ci ([a5a6b69](https://github.com/kuzzleio/kuzzle-device-manager/commit/a5a6b69898defc1cdb22b57d389ad745ee75de8e))
- **ci:** fix npm glob not working anymore ([18e79aa](https://github.com/kuzzleio/kuzzle-device-manager/commit/18e79aa638be41f8e8ecdb42f2d150f730dcebc5))
- copy-version script ([72b5e49](https://github.com/kuzzleio/kuzzle-device-manager/commit/72b5e496c81700fddd9b475cb77965c3b6091de7))
- correct api types ([#333](https://github.com/kuzzleio/kuzzle-device-manager/issues/333)) ([05c426f](https://github.com/kuzzleio/kuzzle-device-manager/commit/05c426fbfaf9602bb46d4b0c8f472fab85280b3a))
- correct KuzzleRequest for pipes ([ef932d1](https://github.com/kuzzleio/kuzzle-device-manager/commit/ef932d1b874e3768c091783819e6b063b4f1211a))
- correct release script ([f02c285](https://github.com/kuzzleio/kuzzle-device-manager/commit/f02c2850b8b767e724df72fc907a8e9799baf966))
- **device-metadata:** fetch device's metadata from assigned tenant when available ([#374](https://github.com/kuzzleio/kuzzle-device-manager/issues/374)) ([acfd8a0](https://github.com/kuzzleio/kuzzle-device-manager/commit/acfd8a0f42b39b0b1e592806e39edd2435216b0c))
- **device:** correct device HTTP API ([#354](https://github.com/kuzzleio/kuzzle-device-manager/issues/354)) ([d9fe9e1](https://github.com/kuzzleio/kuzzle-device-manager/commit/d9fe9e10d14c7abe03f17ce0a3331fae948de8d8))
- **engine:** update conflicts ask return values ([0f817c3](https://github.com/kuzzleio/kuzzle-device-manager/commit/0f817c37560fb311f39c18e8d56838414d2a8379))
- **export:** correct scroll in getNamedMeasures ([05fe4fd](https://github.com/kuzzleio/kuzzle-device-manager/commit/05fe4fd081e049978e1fab06f82bce1bb1dc0950))
- improve get internal devices documents ([03ccb29](https://github.com/kuzzleio/kuzzle-device-manager/commit/03ccb297c9f86ee6fe78acfe9dace932c96af568))
- improve measure export to be usable with multiple measures in one measure ([#330](https://github.com/kuzzleio/kuzzle-device-manager/issues/330)) ([dab8d57](https://github.com/kuzzleio/kuzzle-device-manager/commit/dab8d57957a4ff2423ae3c29203a1bd7a55a5155))
- **migrateTenant:** clear groups of newly created assets ([79f6a5a](https://github.com/kuzzleio/kuzzle-device-manager/commit/79f6a5a84a34fd526e3820455cdf999364c49ad1))
- **models:** list asset returns commons assets ([#345](https://github.com/kuzzleio/kuzzle-device-manager/issues/345)) ([2844437](https://github.com/kuzzleio/kuzzle-device-manager/commit/28444377b536614f0a70d397b5f37775464f50aa))
- **npm:** fix repository url ([514dc59](https://github.com/kuzzleio/kuzzle-device-manager/commit/514dc59913950299354b22a99febe525f1190d96))
- only list asset models for the requested engine group ([#367](https://github.com/kuzzleio/kuzzle-device-manager/issues/367)) ([8a14207](https://github.com/kuzzleio/kuzzle-device-manager/commit/8a14207b14d7f7fd80d9af711f9ba9eed5c58735))
- update semantic-release ([380c8b3](https://github.com/kuzzleio/kuzzle-device-manager/commit/380c8b340e925bfca0f1c435c2fcaa6c2f20ced0))

### Features

- add actions to get last measures on digital twins ([#363](https://github.com/kuzzleio/kuzzle-device-manager/issues/363)) ([b8005a2](https://github.com/kuzzleio/kuzzle-device-manager/commit/b8005a2b2fb0071f2efa2ec3adeff9d965840a0c))
- add dev builds when pushing on 2-dev ([#375](https://github.com/kuzzleio/kuzzle-device-manager/issues/375)) ([aa11885](https://github.com/kuzzleio/kuzzle-device-manager/commit/aa118854c1b22eeac2bbb7b4abc891a51bb332be))
- add group descriptions to models ([#335](https://github.com/kuzzleio/kuzzle-device-manager/issues/335)) ([de00fb7](https://github.com/kuzzleio/kuzzle-device-manager/commit/de00fb73161c50e42ca504ed9c829099cd5ba44a))
- add log in decoders ([#339](https://github.com/kuzzleio/kuzzle-device-manager/issues/339)) ([fe08b7c](https://github.com/kuzzleio/kuzzle-device-manager/commit/fe08b7ce093892367a37d6e2f16ee1205071d639))
- add search actions for the models ([#362](https://github.com/kuzzleio/kuzzle-device-manager/issues/362)) ([9990e57](https://github.com/kuzzleio/kuzzle-device-manager/commit/9990e57db9bc845d6d6df1e64bed05e88e00f377))
- add tooltip model by asset model ([#341](https://github.com/kuzzleio/kuzzle-device-manager/issues/341)) ([865ae6d](https://github.com/kuzzleio/kuzzle-device-manager/commit/865ae6d5e898f9519b0fccbf3a0a6be5ce55aa57))
- add UTC export by default for devices and assets ([#342](https://github.com/kuzzleio/kuzzle-device-manager/issues/342)) ([878ca58](https://github.com/kuzzleio/kuzzle-device-manager/commit/878ca5803c2e68786b342bc1f3dd15b8a3514a77))
- **asset:** add upsert method ([#323](https://github.com/kuzzleio/kuzzle-device-manager/issues/323)) ([5f87787](https://github.com/kuzzleio/kuzzle-device-manager/commit/5f8778734849386a796eed6ae6071757978bc956))
- **assetrole:** add link / unlink device action to asset admin role ([#357](https://github.com/kuzzleio/kuzzle-device-manager/issues/357)) ([febf3a6](https://github.com/kuzzleio/kuzzle-device-manager/commit/febf3a6762e5525563c61776d27aaf31659a4748))
- **assets:** assets migrate tenant ([5f05101](https://github.com/kuzzleio/kuzzle-device-manager/commit/5f0510120428cbaffaa4569a705a5f20644d8c83))
- **assets:** remove assetId in upsert ([#326](https://github.com/kuzzleio/kuzzle-device-manager/issues/326)) ([2f286de](https://github.com/kuzzleio/kuzzle-device-manager/commit/2f286de85d286bbd13bdc4c1385a9ce4d4ffcb50))
- **configuration:** allow to specify Elasticsearch index settings ([#337](https://github.com/kuzzleio/kuzzle-device-manager/issues/337)) ([6d22fa9](https://github.com/kuzzleio/kuzzle-device-manager/commit/6d22fa9dbee7a662e84af660b061171b61b8d9d6))
- digitaltwin exports ([#315](https://github.com/kuzzleio/kuzzle-device-manager/issues/315)) ([aab65af](https://github.com/kuzzleio/kuzzle-device-manager/commit/aab65afbc13205ea695c503fbbdf2326fe3cafd2))
- **digitalTwin:** allow to modify mapping from application ([#322](https://github.com/kuzzleio/kuzzle-device-manager/issues/322)) ([89d375a](https://github.com/kuzzleio/kuzzle-device-manager/commit/89d375a97892aad6b4cf976a38581cb0d7a14936))
- **digitalTwin:** implement generic document pipes triggers ([#321](https://github.com/kuzzleio/kuzzle-device-manager/issues/321)) ([60a21fc](https://github.com/kuzzleio/kuzzle-device-manager/commit/60a21fc8ced1e925efbad9b79cc0de511efac46c))
- **engine:** add mappings update conflict ask call ([#340](https://github.com/kuzzleio/kuzzle-device-manager/issues/340)) ([5cd6aca](https://github.com/kuzzleio/kuzzle-device-manager/commit/5cd6acabe640e3e908db12f8166cd4c3d4e1f637))
- implement comprehensible metadata ([#332](https://github.com/kuzzleio/kuzzle-device-manager/issues/332)) ([e80ef8e](https://github.com/kuzzleio/kuzzle-device-manager/commit/e80ef8eb660dd20024b72279007b8aa2f369160c))
- improve export ([#316](https://github.com/kuzzleio/kuzzle-device-manager/issues/316)) ([51db84a](https://github.com/kuzzleio/kuzzle-device-manager/commit/51db84a5f50fa3381454697cee0a06300b07b4ea))
- improve search model request types ([#364](https://github.com/kuzzleio/kuzzle-device-manager/issues/364)) ([5310ad1](https://github.com/kuzzleio/kuzzle-device-manager/commit/5310ad1cf8a46b7bce31e6c26d6454f956574a44))
- **measure:** add device metadata to origin ([#356](https://github.com/kuzzleio/kuzzle-device-manager/issues/356)) ([1ed9d8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/1ed9d8bf1885569350d12287ade2da640f825ab7))
- **measuremodels:** add optional local names and unit to measure definitions ([#343](https://github.com/kuzzleio/kuzzle-device-manager/issues/343)) ([50038b2](https://github.com/kuzzleio/kuzzle-device-manager/commit/50038b2361bfa24e71e4df296a6a3ec27b332d7c))
- **measures:** add lastMeasuredAt on DigitalTwin ([#314](https://github.com/kuzzleio/kuzzle-device-manager/issues/314)) ([05b8a53](https://github.com/kuzzleio/kuzzle-device-manager/commit/05b8a53970e76cc2d2a3de3b98173c43b8cb54e0))
- **metadata:** add option field readOnly to prevent editing ([#358](https://github.com/kuzzleio/kuzzle-device-manager/issues/358)) ([e0641b4](https://github.com/kuzzleio/kuzzle-device-manager/commit/e0641b41c82bdbbc6f37a0f275bfd3199fce8156))
- **metadata:** add optional editor hints for metadata ([#370](https://github.com/kuzzleio/kuzzle-device-manager/issues/370)) ([afc5129](https://github.com/kuzzleio/kuzzle-device-manager/commit/afc51298eb33515ef5325d806150ac0ebf22b69c))
- **metadata:** add support nested metadata properties ([#348](https://github.com/kuzzleio/kuzzle-device-manager/issues/348)) ([17eda8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/17eda8b6c3802991eac3678e60ed614bfa8e172d))
- **metadata:** improve asset metadata ([#346](https://github.com/kuzzleio/kuzzle-device-manager/issues/346)) ([2eb5887](https://github.com/kuzzleio/kuzzle-device-manager/commit/2eb5887497d1e7449ca7c401274f6ff94453fe26))
- **roles:** add specific roles for assets and devices ([#365](https://github.com/kuzzleio/kuzzle-device-manager/issues/365)) ([a01982c](https://github.com/kuzzleio/kuzzle-device-manager/commit/a01982cd025d4436617e710aa407e209f0d4f375))
- upsert devices ([#355](https://github.com/kuzzleio/kuzzle-device-manager/issues/355)) ([c75abef](https://github.com/kuzzleio/kuzzle-device-manager/commit/c75abef4c313bbe33ad833189dfcc6fdc50fc15d))

# [2.4.0-beta.21](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.20...v2.4.0-beta.21) (2024-09-18)

### Bug Fixes

- only list asset models for the requested engine group ([#367](https://github.com/kuzzleio/kuzzle-device-manager/issues/367)) ([8a14207](https://github.com/kuzzleio/kuzzle-device-manager/commit/8a14207b14d7f7fd80d9af711f9ba9eed5c58735))

### Features

- add actions to get last measures on digital twins ([#363](https://github.com/kuzzleio/kuzzle-device-manager/issues/363)) ([b8005a2](https://github.com/kuzzleio/kuzzle-device-manager/commit/b8005a2b2fb0071f2efa2ec3adeff9d965840a0c))
- add search actions for the models ([#362](https://github.com/kuzzleio/kuzzle-device-manager/issues/362)) ([9990e57](https://github.com/kuzzleio/kuzzle-device-manager/commit/9990e57db9bc845d6d6df1e64bed05e88e00f377))
- improve search model request types ([#364](https://github.com/kuzzleio/kuzzle-device-manager/issues/364)) ([5310ad1](https://github.com/kuzzleio/kuzzle-device-manager/commit/5310ad1cf8a46b7bce31e6c26d6454f956574a44))
- **metadata:** add optional editor hints for metadata ([#370](https://github.com/kuzzleio/kuzzle-device-manager/issues/370)) ([afc5129](https://github.com/kuzzleio/kuzzle-device-manager/commit/afc51298eb33515ef5325d806150ac0ebf22b69c))
- **roles:** add specific roles for assets and devices ([#365](https://github.com/kuzzleio/kuzzle-device-manager/issues/365)) ([a01982c](https://github.com/kuzzleio/kuzzle-device-manager/commit/a01982cd025d4436617e710aa407e209f0d4f375))

# [2.4.0-beta.20](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.19...v2.4.0-beta.20) (2024-08-12)

### Features

- **assetrole:** add link / unlink device action to asset admin role ([#357](https://github.com/kuzzleio/kuzzle-device-manager/issues/357)) ([febf3a6](https://github.com/kuzzleio/kuzzle-device-manager/commit/febf3a6762e5525563c61776d27aaf31659a4748))
- **metadata:** add option field readOnly to prevent editing ([#358](https://github.com/kuzzleio/kuzzle-device-manager/issues/358)) ([e0641b4](https://github.com/kuzzleio/kuzzle-device-manager/commit/e0641b41c82bdbbc6f37a0f275bfd3199fce8156))

# [2.4.0-beta.19](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.18...v2.4.0-beta.19) (2024-07-19)

### Features

- add tooltip model by asset model ([#341](https://github.com/kuzzleio/kuzzle-device-manager/issues/341)) ([865ae6d](https://github.com/kuzzleio/kuzzle-device-manager/commit/865ae6d5e898f9519b0fccbf3a0a6be5ce55aa57))
- **configuration:** allow to specify Elasticsearch index settings ([#337](https://github.com/kuzzleio/kuzzle-device-manager/issues/337)) ([6d22fa9](https://github.com/kuzzleio/kuzzle-device-manager/commit/6d22fa9dbee7a662e84af660b061171b61b8d9d6))
- **measure:** add device metadata to origin ([#356](https://github.com/kuzzleio/kuzzle-device-manager/issues/356)) ([1ed9d8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/1ed9d8bf1885569350d12287ade2da640f825ab7))
- upsert devices ([#355](https://github.com/kuzzleio/kuzzle-device-manager/issues/355)) ([c75abef](https://github.com/kuzzleio/kuzzle-device-manager/commit/c75abef4c313bbe33ad833189dfcc6fdc50fc15d))

# [2.4.0-beta.18](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.17...v2.4.0-beta.18) (2024-07-12)

### Bug Fixes

- **device:** correct device HTTP API ([#354](https://github.com/kuzzleio/kuzzle-device-manager/issues/354)) ([d9fe9e1](https://github.com/kuzzleio/kuzzle-device-manager/commit/d9fe9e10d14c7abe03f17ce0a3331fae948de8d8))

### Features

- add UTC export by default for devices and assets ([#342](https://github.com/kuzzleio/kuzzle-device-manager/issues/342)) ([878ca58](https://github.com/kuzzleio/kuzzle-device-manager/commit/878ca5803c2e68786b342bc1f3dd15b8a3514a77))

# [2.4.0-beta.17](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.16...v2.4.0-beta.17) (2024-07-08)

### Bug Fixes

- correct release script ([f02c285](https://github.com/kuzzleio/kuzzle-device-manager/commit/f02c2850b8b767e724df72fc907a8e9799baf966))
- **engine:** update conflicts ask return values ([0f817c3](https://github.com/kuzzleio/kuzzle-device-manager/commit/0f817c37560fb311f39c18e8d56838414d2a8379))
- **models:** list asset returns commons assets ([#345](https://github.com/kuzzleio/kuzzle-device-manager/issues/345)) ([2844437](https://github.com/kuzzleio/kuzzle-device-manager/commit/28444377b536614f0a70d397b5f37775464f50aa))

### Features

- add log in decoders ([#339](https://github.com/kuzzleio/kuzzle-device-manager/issues/339)) ([fe08b7c](https://github.com/kuzzleio/kuzzle-device-manager/commit/fe08b7ce093892367a37d6e2f16ee1205071d639))
- **engine:** add mappings update conflict ask call ([#340](https://github.com/kuzzleio/kuzzle-device-manager/issues/340)) ([5cd6aca](https://github.com/kuzzleio/kuzzle-device-manager/commit/5cd6acabe640e3e908db12f8166cd4c3d4e1f637))
- **measuremodels:** add optional local names and unit to measure definitions ([#343](https://github.com/kuzzleio/kuzzle-device-manager/issues/343)) ([50038b2](https://github.com/kuzzleio/kuzzle-device-manager/commit/50038b2361bfa24e71e4df296a6a3ec27b332d7c))
- **metadata:** add support nested metadata properties ([#348](https://github.com/kuzzleio/kuzzle-device-manager/issues/348)) ([17eda8b](https://github.com/kuzzleio/kuzzle-device-manager/commit/17eda8b6c3802991eac3678e60ed614bfa8e172d))
- **metadata:** improve asset metadata ([#346](https://github.com/kuzzleio/kuzzle-device-manager/issues/346)) ([2eb5887](https://github.com/kuzzleio/kuzzle-device-manager/commit/2eb5887497d1e7449ca7c401274f6ff94453fe26))

# [2.4.0-beta.16](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.15...v2.4.0-beta.16) (2024-04-09)

### Bug Fixes

- catch errors when updating the mappings on startup ([#338](https://github.com/kuzzleio/kuzzle-device-manager/issues/338)) ([e09c5a3](https://github.com/kuzzleio/kuzzle-device-manager/commit/e09c5a346d50b645830c82b33f10370e2dcbbd0c))

# [2.4.0-beta.15](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.14...v2.4.0-beta.15) (2024-03-21)

### Bug Fixes

- correct api types ([#333](https://github.com/kuzzleio/kuzzle-device-manager/issues/333)) ([05c426f](https://github.com/kuzzleio/kuzzle-device-manager/commit/05c426fbfaf9602bb46d4b0c8f472fab85280b3a))

### Features

- add group descriptions to models ([#335](https://github.com/kuzzleio/kuzzle-device-manager/issues/335)) ([de00fb7](https://github.com/kuzzleio/kuzzle-device-manager/commit/de00fb73161c50e42ca504ed9c829099cd5ba44a))

# [2.4.0-beta.14](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.13...v2.4.0-beta.14) (2024-03-13)

### Bug Fixes

- improve measure export to be usable with multiple measures in one measure ([#330](https://github.com/kuzzleio/kuzzle-device-manager/issues/330)) ([dab8d57](https://github.com/kuzzleio/kuzzle-device-manager/commit/dab8d57957a4ff2423ae3c29203a1bd7a55a5155))

### Features

- **assets:** remove assetId in upsert ([#326](https://github.com/kuzzleio/kuzzle-device-manager/issues/326)) ([2f286de](https://github.com/kuzzleio/kuzzle-device-manager/commit/2f286de85d286bbd13bdc4c1385a9ce4d4ffcb50))
- implement comprehensible metadata ([#332](https://github.com/kuzzleio/kuzzle-device-manager/issues/332)) ([e80ef8e](https://github.com/kuzzleio/kuzzle-device-manager/commit/e80ef8eb660dd20024b72279007b8aa2f369160c))

# [2.4.0-beta.13](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.12...v2.4.0-beta.13) (2024-01-11)

### Bug Fixes

- **ci:** fix npm glob not working anymore ([18e79aa](https://github.com/kuzzleio/kuzzle-device-manager/commit/18e79aa638be41f8e8ecdb42f2d150f730dcebc5))

# [2.4.0-beta.12](https://github.com/kuzzleio/kuzzle-device-manager/compare/v2.4.0-beta.11...v2.4.0-beta.12) (2024-01-11)

### Bug Fixes

- **npm:** fix repository url ([514dc59](https://github.com/kuzzleio/kuzzle-device-manager/commit/514dc59913950299354b22a99febe525f1190d96))

# [2.4.0-beta.11](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.10...v2.4.0-beta.11) (2024-01-09)

### Bug Fixes

- update semantic-release ([380c8b3](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/380c8b340e925bfca0f1c435c2fcaa6c2f20ced0))

# [2.4.0-beta.10](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.9...v2.4.0-beta.10) (2024-01-09)

### Bug Fixes

- **assetsGroups:** disable checkRights on impersonate ([#325](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/325)) ([eaa3edc](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/eaa3edc678529f0a4b1e0f440764e3c8f8504f62))

### Features

- **asset:** add upsert method ([#323](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/323)) ([5f87787](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/5f8778734849386a796eed6ae6071757978bc956))

# [2.4.0-beta.9](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.8...v2.4.0-beta.9) (2023-11-06)

### Bug Fixes

- improve get internal devices documents ([03ccb29](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/03ccb297c9f86ee6fe78acfe9dace932c96af568))

# [2.4.0-beta.8](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.7...v2.4.0-beta.8) (2023-11-04)

### Bug Fixes

- correct KuzzleRequest for pipes ([ef932d1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/ef932d1b874e3768c091783819e6b063b4f1211a))

# [2.4.0-beta.7](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.6...v2.4.0-beta.7) (2023-11-03)

### Features

- **digitalTwin:** allow to modify mapping from application ([#322](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/322)) ([89d375a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/89d375a97892aad6b4cf976a38581cb0d7a14936))
- **digitalTwin:** implement generic document pipes triggers ([#321](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/321)) ([60a21fc](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/60a21fc8ced1e925efbad9b79cc0de511efac46c))

# [2.4.0-beta.6](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.5...v2.4.0-beta.6) (2023-10-20)

### Bug Fixes

- **asset_migration:** fixes multiple assets migration and optimize ([fd546cf](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/fd546cf4141208f2742f3f0a0b303e6e5903ef56))

# [2.4.0-beta.5](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.4...v2.4.0-beta.5) (2023-10-03)

### Bug Fixes

- **assets:** migrate tenant only if user is admin ([c24f942](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/c24f942673b37e798c9f89a098ad6747fd4977bd))
- **assetsMigrateTenant:** add type for frontend and fix admin only ([e249f13](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/e249f13d3e2bba70023177374c0874d982f78226))
- **migrateTenant:** clear groups of newly created assets ([79f6a5a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/79f6a5a84a34fd526e3820455cdf999364c49ad1))

### Features

- **assets:** assets migrate tenant ([5f05101](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/5f0510120428cbaffaa4569a705a5f20644d8c83))

# [2.4.0-beta.4](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.3...v2.4.0-beta.4) (2023-09-12)

### Bug Fixes

- **export:** correct scroll in getNamedMeasures ([05fe4fd](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/05fe4fd081e049978e1fab06f82bce1bb1dc0950))

# [2.4.0-beta.3](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.2...v2.4.0-beta.3) (2023-09-05)

### Bug Fixes

- **ci:** correct github token in ci ([a5a6b69](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/a5a6b69898defc1cdb22b57d389ad745ee75de8e))

# [2.4.0-beta.2](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.4.0-beta.1...v2.4.0-beta.2) (2023-09-05)

### Bug Fixes

- copy-version script ([72b5e49](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/72b5e496c81700fddd9b475cb77965c3b6091de7))

### Features

- improve export ([#316](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/316)) ([51db84a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/51db84a5f50fa3381454697cee0a06300b07b4ea))

# [2.4.0-beta.1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.2...v2.4.0-beta.1) (2023-08-24)

### Features

- digitaltwin exports ([#315](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/315)) ([aab65af](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/aab65afbc13205ea695c503fbbdf2326fe3cafd2))
- **measures:** add lastMeasuredAt on DigitalTwin ([#314](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/314)) ([05b8a53](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/05b8a53970e76cc2d2a3de3b98173c43b8cb54e0))

## [2.3.2](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.1...v2.3.2) (2023-08-14)

### Bug Fixes

- **types:** correct type package publish ([c0c0375](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/c0c0375409f33615aedf2800c2508402c3ca37cd))

## [2.3.1](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.3.0...v2.3.1) (2023-08-14)

### Bug Fixes

- **types:** correct type package publish ([fa9163a](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/fa9163ab18f7cc4900bb2a8321c815d535f6c41b))

# [2.3.0](https://github.com/kuzzleio/kuzzle-plugin-device-manager/compare/v2.2.8...v2.3.0) (2023-08-14)

### Bug Fixes

- composite measures should be correctly exported to CSV ([#309](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/309)) ([487c1e8](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/487c1e8a94b1f9c3f99efd9ac0c953c576512df8))
- **docs:** wrong arguments in models' getDevice request ([#310](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/310)) ([028c65c](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/028c65cfa29ad0df549523ee43d4b4ad91d68d20))

### Features

- **assetGroups:** add assetGroups roles ([b9d0fae](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/b9d0fae9d5401783083a3c1f504021fd01e5c3c7))
- **assetGroups:** add groups for assets ([#306](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/306)) ([10de8b4](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/10de8b4a85f4693ff76010e44249c7a6bba9302a))
- **assetGroups:** add lastUpdate on changes ([#311](https://github.com/kuzzleio/kuzzle-plugin-device-manager/issues/311)) ([36a4575](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/36a457570e5d8d387fe854f897cc3541ee5be2b2))
- **semantic-release:** add semantic release support to device manager ([99b1683](https://github.com/kuzzleio/kuzzle-plugin-device-manager/commit/99b168369a102f9c91fb63928132a2d54770de41))
