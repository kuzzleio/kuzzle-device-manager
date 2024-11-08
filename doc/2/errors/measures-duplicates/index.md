---
code: false
type: page
title: Measures Names Duplicates
description: Measures Names Duplicates | Kuzzle Documentation
---

# Measures Duplicates

A `MeasuresNamesDuplicatesError` is thrown when one or multiple measures names is defined more than once inside the same model.

**HTTP status**: 400

**Additional Properties:**

| property     | type            | description                       |
| ------------ | --------------- | --------------------------------- |
| `duplicates` | array of string | List of duplicated measures names |