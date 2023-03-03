# Pipeline d'Ingestion des mesures

Lorsqu'il s'agit de recevoir des données, la Plateforme Kuzzle IoT est capable de recevoir des données brut ou des données formatées sous la forme de mesures.

Ce mesures sont ensuite ingérées dans le pipeline d'ingestion afin de permettre au moteur de règle d'exécuter des traitements à diverses étapes.

## Donnée brut

Afin de traiter les données brut, la Plateforme Kuzzle IoT doit les normaliser en mesures.
Ce processus est nommé "décodage" des données et consiste à extraire des mesures depuis une trame de donnée.

Les données reçues doivent être sous la forme de documents JSON. Les autres formats tels que CSV devront faire l'objet d'un pré-traitement.

La Plateforme Kuzzle IoT inclue un ETL spécialisé pour normaliser les données: les Decoders

Chaque modèle de Capteur peut être associé à un Decoder afin de normaliser les données reçues en mesures utilisables par le capteur.

Chaque Decoder peut recevoir de la donnée sur une action d'API dédiée.

Les données bruts reçues sont systématiquement stockées à des fins d'analyses ultérieurs.

### Decoder

Un Decoder se présente sous la forme d'une interface à implémenter grâce au framework backend de la Plateforme Kuzzle IoT.

Il a la charge de

- déclarer les mesures qu'il va traiter
- enregistrer une action d'API correspondante
- modifier le mappings de la collection contenant les données brut
- valider le format des données reçues
- extraire des mesures des données reçues

### Déclaration des mesures

La déclaration des mesures se fait au travers d'une propriété publique sur la classe.

Cette propriété est marquée `as const` afin d'offrir une vérification de type supplémentaire lors de l'extraction des mesures.

```js
export class AbeewayDecoder extends Decoder {
  // declare the measures decoded by the Decoder
  public measures = [
    { name: "temperature", type: "temperature" },
  ] as const;
}
```

### Enregistrement d'une action d'API

Une action d'API est automatiquement ajoutée à la Plateforme Kuzzle IoT pour chaque Decoder.

Par défaut, cette action utilise le nom de la classe au format `snake-case`:

- `AbeewayDecoder` => `abeeway` (route HTTP: `POST /_/device-manager/payload/abeeway`)
- `ElsysErsDecoder` => `elsys-ers` (route HTTP: `POST /_/device-manager/payload/elsys-ers`)

Il est possible de personnaliser:

- l'action d'API en déclarant le propriété `action` sur la classe
- la route HTTP en déclarant la propriété `http` sur la classe

```js
export class ElsysErsDecoder extends Decoder {
  constructor() {
    super();

    // action will be "elsys" instead of "elsys-ers"
    this.action = "elsys";

    // HTTP route will be "/_/ingestion/elsys"
    this.http = [{ verb: "post", path: "ingestion/elsys" }];
  }
}
```

### Modification des mappings de la collection `payloads`

Chaque trame de donnée reçue par la Plateforme Kuzzle IoT est stockée dans la collection `payloads` de l'index `platform`. (Voir [Stockage des données bruts](#stockage-donnees-bruts))

Il est conseillé de modifier les mappings de cette collection en utilisant la propriété `payloadsMappings` afin de faciliter la recherche de payloads appartenant à un capteur spécifique.

Par exemple, si vos trames de données contiennent la référence du capteur dans la propriété `deviceEUI`, alors il est judicieux d'ajouter cette propriété afin de pouvoir lister toutes les trames appartenant à un capteur.

```js
export class ElsysErsDecoder extends Decoder {
  constructor() {
    super();

    /**
     * Raw payload format
     * {
     *   "deviceEUI": <device reference>,
     *   "temperature": <temperature measure>,
     *   ...
     * }
     */
    this.payloadsMappings = {
      deviceEUI: { type: "keyword" },
    };
  }
}
```

### Validation des données bruts

Pour s'assurer de pouvoir extraire les mesures depuis un format attendu, il est possible d'implémenter la méthode `validate`.

Cette méthode prend en paramètre la trame de données brut et peut indiquer que:

1.  le format est respecté en renvoyant `true`
2.  cette trame de données doit être ignorée en renvoyant `false`
3.  le format de cette trame est incorrect en levant une exception

En fonction du résultat de la méthode `validate`, l'action d'API renverra soit un status `200` (Cas 1 et 2), soit un status `4**` (cas 3).

```js
class AbeewayDecoder extends Decoder {
  async validate(payload: JSONObject) {
    if (payload.deviceEUI === undefined) {
      throw new BadRequestError('Invalid payload: missing "deviceEUI"');
    }

    // Skip payload without data
    if (payload.type === "ping") {
      return false;
    }

    return true;
  }
}
```

### Extraction des mesures

La méthode `decode` est en charge de transformer la donnée brut en mesures standardisés.

Elle reçoit deux arguments:

- `decodedPayload`: instance de [DecodedPayload]() servant à extraire les mesures
- `payload`: donnée brut

Chaque mesure doit être extraite en utilisant la méthode `addMeasurement` de l'objet `decodedPayload`. Cette méthode possède plus arguments:

- `reference`: reference unique du device pour lequel on extrait la mesure
- `measureName`: nom de la mesure extraite (doit correspondre à une [mesure déclarée](#declaration-des-mesures))
- `measurement`: un objet contenant la mesure
  - `measurement.measuredAt`: timestamp à laquelle la mesure a été effectué (en millisecondes)
  - `measurement.type`: type de la mesure (doit correspondre à une [mesure déclarée](#declaration-des-mesures))
  - `measurement.values`: contient les valeurs de la mesure

```js
export class AbeewayDecoder extends Decoder {
  // declare the measures decoded by the Decoder
  public measures = [
    { name: "temperature", type: "temperature" },
  ] as const;

  async decode(
    decodedPayload: DecodedPayload<AbeewayDecoder>,
    payload: JSONObject
  ) {
    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI, // device reference
      "temperature", // measure name
      {
        measuredAt: Date.now(), // measure timestamp
        type: "temperature", // measure type
        values: {
          temperature: payload.temp, // measure value
        },
      }
    );

    return decodedPayload;
  }
}
```

### Enregistrement sur le framework

Finalement, il est nécessaire d'enregistrer notre Decoder pour un Capteur en particulier à l'aide du framework.

Pour cela, il faut utiliser la méthode `models.registerDevice` du plugin Device Manager:

```js
// Retrieve the Device Manager plugin from the framework
const deviceManager = app.plugins.get < DeviceManagerPlugin > "device-manager";

deviceManager.models.registerDevice("Abeeway", {
  decoder: new AbeewayDecoder(),
});
```

## Donnée normalisée

La Plateforme Kuzzle IoT est également capable de recevoir directement des mesures normalisées sans passer par un Decoder.

L'action d'API [device-manager/devices:receiveMeasures](#) est capable de d'ingérer plusieurs mesures d'un device.

Cela évite de devoir passer par l'étape d'écriture du Decoder et de re-déployer l'application mais nécessite de pouvoir formater correctement la donnée.

Les données normalisées reçues sont systématiquement stockées à des fins d'analyses ultérieurs.

_Exemple d'envoi de mesures avec le SDK_

```js
(await sdk.query) <
  ApiDeviceReceiveMeasuresRequest >
  {
    controller: "device-manager/devices",
    action: "receiveMeasures",

    // Tenant index
    engineId: "tenant-hypervisor-kuzzle",

    // Device ID
    _id: "Abeeway-BKX001",

    body: {
      measures: [
        {
          measureName: "temperature",
          type: "temperature",
          measuredAt: 1677266659115,
          values: {
            temperature: 21,
          },
        },
      ],
    },
  };
```

## Traçabilité des données bruts

L'ensemble des données reçues par la Plateforme Kuzzle IoT sont systématiquement stockées dans une collection afin de permettre une analyse ultérieur.

La collection `payloads` de l'index `platform` contient les informations suivantes pour chaque donnée reçue:

- `deviceModel`: modèle de device pour lequel était destiné la donnée
- `uuid`: identifiant unique de la donnée reçue
- `valid`: booléen indiquant si la donnée a pu être traité correctement
- `apiAction`: action d'API ayant été utilisée pour envoyer la donnée

Pour chaque mesure contenue dans la Plateforme Kuzzle IoT, il est possible de remonter jusqu'à la donnée brut afin d'analyser d'éventuels problèmes dans l'étape de normalisation.

La propriété `payloadUuid` contenu dans les mesures permet de faire une recherche dans la collection `payloads` afin de retrouver les trames de données correspondantes.

## Utilisation du pipeline

events backend avec pipe
modification mesures
ajout mesures
modification métadonnées
