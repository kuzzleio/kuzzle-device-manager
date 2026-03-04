## 3.0.0-next.26 (2026-03-04)

* feat(assetModel): add spec artifacts for multi-group asset models (#462) ([e8cff06](https://github.com/kuzzleio/kuzzle-device-manager/commit/e8cff06)), closes [#462](https://github.com/kuzzleio/kuzzle-device-manager/issues/462)


### BREAKING CHANGE

* `engineGroup` field renamed to `engineGroups` (string[])
in model documents, API request/response types, and ask events.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

* feat(models): add multi-group asset model behavior

- Normalize engineGroups containing "commons" to ["commons"] in writeAsset/updateAsset
- Enforce single-group constraint for group models in writeGroup
- Generate multi-group document IDs: model-asset-{sortedGroups}-{ModelName}
- Add 7 functional tests for multi-group scenarios
- Add group model rejection test for multiple engineGroups

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

* fix(models): use request.getArray() for engineGroups parameter validation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

* chore: gitignore .claude/ and openspec/ directories

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## 3.0.0-next.25 (2026-03-04)

* feat(measureModel): tenant scoped measure model (#459) ([7659425](https://github.com/kuzzleio/kuzzle-device-manager/commit/7659425)), closes [#459](https://github.com/kuzzleio/kuzzle-device-manager/issues/459)

## 3.0.0-next.24 (2026-02-23)

* Merge pull request #458 from kuzzleio/feat/KZLPRD-1150_tenant_specific_asset_model ([4fd7f74](https://github.com/kuzzleio/kuzzle-device-manager/commit/4fd7f74)), closes [#458](https://github.com/kuzzleio/kuzzle-device-manager/issues/458)
* Update openspec/changes/tenant-specific-asset-models/design.md ([4d542f4](https://github.com/kuzzleio/kuzzle-device-manager/commit/4d542f4))
* style: fix prettier formatting in ModelService search queries ([351ecfa](https://github.com/kuzzleio/kuzzle-device-manager/commit/351ecfa))
* fix(models): address remaining PR #458 review feedback (KZLPRD-1150) ([1394ac2](https://github.com/kuzzleio/kuzzle-device-manager/commit/1394ac2)), closes [#458](https://github.com/kuzzleio/kuzzle-device-manager/issues/458)
* fix(models): filter undefined from ES must arrays and add lang to getAsset queries (KZLPRD-1150) ([f8185d1](https://github.com/kuzzleio/kuzzle-device-manager/commit/f8185d1))
* fix(tests): replace jest.setTimeout with vitest equivalent (KZLPRD-1150) ([0296f21](https://github.com/kuzzleio/kuzzle-device-manager/commit/0296f21))
* refactor(models): address PR #458 review feedback (KZLPRD-1150) ([0171cf1](https://github.com/kuzzleio/kuzzle-device-manager/commit/0171cf1)), closes [#458](https://github.com/kuzzleio/kuzzle-device-manager/issues/458)
* test(models): add tenant-scoped mapping conflict detection tests (KZLPRD-1150) ([620dff2](https://github.com/kuzzleio/kuzzle-device-manager/commit/620dff2))
* feat(models): add tenant-scoped asset models with 3-level fallback (KZLPRD-1150) ([07be354](https://github.com/kuzzleio/kuzzle-device-manager/commit/07be354))
* feat(models): engine-aware conflict detection and API docs for tenant-scoped models (KZLPRD-1150) ([80b6f17](https://github.com/kuzzleio/kuzzle-device-manager/commit/80b6f17))
* docs(KZLPRD-1150): asset model individual tenant-engine granularity ([f720834](https://github.com/kuzzleio/kuzzle-device-manager/commit/f720834))

## 3.0.0-next.23 (2026-02-23)

* feat(devices): can create orphan devices (#460) ([0d913ae](https://github.com/kuzzleio/kuzzle-device-manager/commit/0d913ae)), closes [#460](https://github.com/kuzzleio/kuzzle-device-manager/issues/460)

## 3.0.0-next.22 (2026-02-13)

* fix: add prefix to build command ([da91fee](https://github.com/kuzzleio/kuzzle-device-manager/commit/da91fee))
* fix: create a workspace for the device manager and one for types ([6ccb890](https://github.com/kuzzleio/kuzzle-device-manager/commit/6ccb890))
* fix: gitignore and ci cd commands ([c3769c1](https://github.com/kuzzleio/kuzzle-device-manager/commit/c3769c1))

## 3.0.0-next.21 (2026-02-13)

* Merge branch 'next' of github.com:kuzzleio/kuzzle-device-manager into next ([9ceac57](https://github.com/kuzzleio/kuzzle-device-manager/commit/9ceac57))
* fix: url of types package ([a548520](https://github.com/kuzzleio/kuzzle-device-manager/commit/a548520))

## 3.0.0-next.20 (2026-02-13)

* fix: little change to trigger release ([e3094a9](https://github.com/kuzzleio/kuzzle-device-manager/commit/e3094a9))

## 3.0.0-next.19 (2026-02-12)

* chore: linting ([14ba308](https://github.com/kuzzleio/kuzzle-device-manager/commit/14ba308))
* chore(eslint): configuration ([f326a7e](https://github.com/kuzzleio/kuzzle-device-manager/commit/f326a7e))
* fix: fix semantic version ([f64ca2f](https://github.com/kuzzleio/kuzzle-device-manager/commit/f64ca2f))
* fix: kuzzle version, semantic version ([c55be75](https://github.com/kuzzleio/kuzzle-device-manager/commit/c55be75))
* fix: launch tests in docker ([a1541a9](https://github.com/kuzzleio/kuzzle-device-manager/commit/a1541a9))
* fix: name the service in docker compose ([dff55c1](https://github.com/kuzzleio/kuzzle-device-manager/commit/dff55c1))
* fix: script in ci ([e782694](https://github.com/kuzzleio/kuzzle-device-manager/commit/e782694))
* fix: semantic-release ([8804514](https://github.com/kuzzleio/kuzzle-device-manager/commit/8804514))
* fix: should fix tests ([8f7c468](https://github.com/kuzzleio/kuzzle-device-manager/commit/8f7c468))
* fix: test app ([f3e3108](https://github.com/kuzzleio/kuzzle-device-manager/commit/f3e3108))
* fix: testing with right node version ([39b8144](https://github.com/kuzzleio/kuzzle-device-manager/commit/39b8144))
* fix: trusted publishing ([691584d](https://github.com/kuzzleio/kuzzle-device-manager/commit/691584d))
* fix: typo in docker compose file ([dd12b2f](https://github.com/kuzzleio/kuzzle-device-manager/commit/dd12b2f))
* fix: use vite, properly launch tests ([37b916a](https://github.com/kuzzleio/kuzzle-device-manager/commit/37b916a))
* fix: version of tests is 24 for now ([396da18](https://github.com/kuzzleio/kuzzle-device-manager/commit/396da18))
