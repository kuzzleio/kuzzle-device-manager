---
code: false
type: page
title: Permissions
description: Default permission system
---

# Permissions

Chaque module du Device Manager expose des rôles spécifiques aux actions possible via l'API.

Ces rôles peuvent ensuite être composés dans des profiles afin de définir les permissions d'un utilisateur.

## Devices permissions

Ces rôles donnent accès aux API concernant les devices avec notamment des actions sur les contrôleurs `device-manager/devices` et `device-manager/models`.

Les rôles sont définis de manière hiérarchique, les permissions des rôles précédents sont incluses dans le rôle courant:

- `devices.reader`: permet de lister les devices et les modèles de devices
- `devices.admin`: permet de créer, modifier, supprimer et lier des devices ainsi que créer et supprimer les modèles de devices
- `devices.platform-admin`: permet d'assigner les devices à un tenant

Les rôles `devices.reader` et `devices.admin` sont destinés à des utilisateurs d'un tenant tandis que le rôle `devices.platform-admin` est destiné aux administrateur de la plateforme IoT.
