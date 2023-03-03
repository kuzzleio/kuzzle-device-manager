TODO:
 - extraire article "Plateforme IoT: Comprendre les jumeaux numériques"

# Digital Twins : Capteurs et Actifs

Un jumeau numérique est un concept informatique qui vise à reproduire à l'identique l'état d'un objet du monde réel dans le monde numérique.

Les changements d'états subis dans le monde physique se répercutent dans le monde numérique afin de traiter l'information dans un système informatique.

La synchronisation se fait également dans le sens inverse en contrôlant le fonctionnement d'un objet du monde réel depuis le monde numérique.

[schéma synchronisation digital twin: mesures et commandes]

Une Plateforme IoT métier comporte généralement deux catégories de jumeaux numériques:
  - les capteurs (Device): représentent les différents systèmes d'acquisition de la donnée
  - les actifs (Asset): représentent les objets caractérisés par la donnée

## Capteurs (Devices)

Dans la Plateforme Kuzzle IoT, les capteurs sont les jumeaux numériques des dispositifs d'acquisition de données.

Exemple:
  - capteur de position GPS
  - sonde de température
  - compteur électrique
  - contrôle d'éclairage publique

Dans la plupart des cas, les capteurs émettent leur donnée sur des réseaux de communication (4G, LoRa, NB-IoT, etc.) mais le relevé de la donnée peut aussi être transmis sous la forme de fichiers plats suite à des saisies manuelles (par exemple dans le cas d'un compteur électrique standard).

Chaque capteur sera responsable de la collecte de un ou plusieurs points de données. Ces mesures remontent ensuite dans la Plateforme Kuzzle IoT pour un traitement standardisé.

Un capteur est caractérisé par les informations suivantes:
  - référence unique (e.g. l'identifiant du device sur un réseau LoRa, `devEUI`)
  - nom du modèle (e.g. `Abeeway`)
  - mesures collectés (e.g. une mesure de type `temperature` appelée `internalTemperature`)
  - métadonnées (e.g. date de dernière maintenance)

Les capteurs sont regroupés en modèles, chaque modèle défini un type de capteur capable de collecter des mesures et possèdant des métadonnées.

La Plateforme Kuzzle IoT est capable de gérer plusieurs modèles de capteurs différents ayant chacun leur propre mesures.

Chaque capteur peut ensuite lié à un actif afin de le caractériser avec ses mesures.

### Réception des mesures

La Plateforme Kuzzle IoT est capable de recevoir les données à travers n'importe quel protocol opérant sur un réseau IP. Elle supporte nativement:
  - HTTP
  - WebSocket
  - MQTT (via gateway)
  - FTP (via gateway)

_Le support d'un nouveau protocol de communication est disponible sous la forme de plugins._

La remontée des mesures des capteurs peut se faire de deux manières:
  - réception de données directement au format accepté par la Plateforme Kuzzle IoT (voir [device-manager/devices:receiveMeasures])
  - réception de données brut et normalisation par un [Decoder]

Les mesures normalisées passent ensuite systématiquement par le [Pipeline d'Ingestion] afin de pouvoir être utilisées par le [Moteur de règles métiers].

## Actifs (Assets)

Les actifs sont les objets du monde réel sur lesquels sont installés des capteurs.

Chaque actif peut ainsi être lié avec un ou plusieurs capteurs afin d'être caractérisé par différentes mesures. Lorsqu'un actif est lié avec un capteur, l'ensemble des mesures réalisés par ce dernier sera historisé avec cet actif.

Cela permet notamment de gérer le cycle de vie des capteurs et d'avoir un historique de mesure cohérent et constant sur les actifs indépendement des opérations de maintenance et de roulement des capteurs.

[schéma 2 capteur sur un asset, historique temp (A) + position (B), changement capteur temp (C), historique constant]

Dans la Plateforme Kuzzle IoT, les actifs portent le métier spécifique à chaque cas d'usage. C'est eux que l'on va spécialiser afin de modéliser le monde réel et répondre aux différents besoin de consultation, de règles métiers, d'alertes, etc.

Un actif est caractérisé par les informations suivantes:
  - référence unique (e.g. numéro de série)
  - nom du modèle (e.g. `Container`)
  - mesures caractérisantes (e.g. deux mesures de type `temperature` appelées `internalTemperature` et `externalTemperature`)
  - métadonnées (e.g. contenance du conteneur, type de cargaison)

Les actifs sont regroupés en modèles, chaque modèle défini un type d'actif capable de recevoir des mesures et possèdant des métadonnées.

La Plateforme Kuzzle IoT est capable de gérer plusieurs modèles d'actifs différents.

### Liaison d'un capteur à un actif

Un actif possède une ou plusieurs mesures caractérisantes. Chacune d'entre elle se doit d'être fournie par un ou plusieurs capteurs qui eux même sont capable de fournir plusieurs mesures différentes.

L'opération de liaison d'un capteur à un actif est réalisée conjointement
  - dans le monde physique avec la fixation d'un capteur sur un actif
  - dans le monde numérique avec la liaison au travers de la Plateforme Kuzzle IoT

Lors de la liaison sur la Plateforme Kuzzle IoT, il est nécessaire d'associer une ou plusieurs mesures du capteur à une ou plusieurs mesures de l'actif.

[ schéma deux capteurs avec nom et type de mesure temperature et deux mesures dans l'asset, liaison]

Une fois liés, les mesures collectées par le device seront historisés pour notre actif avec le nom défini lors de la liaison.

### Historisation de l'état des actifs

Les états successifs des actifs sont systématiquement historisé dans la Plateforme Kuzzle IoT.

Chaque réception de mesure par un capteur lié à un actif entraine un changement d'état de l'actif qui sera historisé.

Il en est de même pour les modification des métadonnées d'un actif.

Les entrées de l'historique des états contiennent l'ensemble des informations nécessaire:
  - référence et modèle
  - mesures
  - métadonnées
  - type de changement d'état

Les différents types de changements d'état sont:
  - réception d'une nouvelle mesure
  - modification d'une métadonnée
  - liaison d'un nouveau device
  - déliaison (???) d'un device

Voir aussi:
 - [Modèle de donnée de l'historique des actifs]()
 - [Consultation de l'historique d'un actif]()
 - [Droits liés]()
