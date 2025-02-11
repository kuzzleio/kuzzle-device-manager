---
code: false
type: page
title: Metadata details
description: structure of metadataDetails
---

# Metadata details

Defining metadata details is a way to enhance the user experience by improving the metadata management workflow on an asset or a device. There are multiple features you can use :

- [Translation](#translations-mandatory) (**_mandatory_**)
- [Group](#group-optional) (**_optional_**)
- [Editor hint](#editor-hint-optional) (change UI elements) (**_optional_**)

## Translations (_mandatory_)

This property allows to add a localized user-friendly name and description to the metadata. Those will be automatically substitued according to the user's language.

**Example**

```js
{
  metadataMappings: {
    company: { type: "keyword" },
  },
  metadataDetails: {
    locales: {
      en: {
        friendlyName: "Manufacturer",
        description: "The company that manufactured the plane",
      },
      fr: {
        friendlyName: "Fabricant",
        description: "L'entreprise qui a fabriqué l'avion",
      },
    },
  },
}
```

## Group (_optional_)

This property allows to group metadata together.

First, create a `metadataGroups` object at the same level as `metadataDetails`, using the group's name as a key and mapping them to their localization details. Then in the `metadataDetails` object, specify the group of the metadata by using the `group` property.

**Example**

```js
{
  metadataMappings: {
    company: { type: "keyword" },
  },
  metadataDetails: {
    company: {
      group: "companyInfo",
    },
  },
  metadataGroups: {
    companyInfo: {
      locales: {
        en: {
          groupFriendlyName: "Company Information",
          description: "All company related informations",
        },
        fr: {
          groupFriendlyName: "Informations sur l'entreprise",
          description: "Toutes les informations relatives a l'entreprise",
        },
      },
    },
  },
}
```

## Editor hint (_optional_)

This property allows to specify the frontend whether it should display a custom widget to edit the metadata, like a dropdown of values, a clock picker or date picker with or without time, make a metadata read-only, and so on.

**You have to set** the `enum type` associated to the `hint` you want and fill the properties with your values.

This is the list of the available `hints`:

- [Read only](#read-only)
- [Dropdown of values](#dropdown-of-values)
- [Date/Datetime/Clock picker](#datedatetimeclock-picker)

<h3 id="read-only" style="color: #e94e77">Read only <a href="#read-only" class="heading-anchor-link">#</a></h3>

The read-only feature allows to prevent users to edit a metadata.

**NOTE:** The readOnly property can be set with **any** Enum type.

:warning: Set to BASE if you **only** want the readOnly property.

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="2" align="center">ENUM</th>
    </tr>
    <tr>
      <th>Type</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>BASE</td>
      <td>base</td>
    </tr>
  </tbody>
</table>

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="4" align="center">PROPERTIES</th>
    </tr>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
      <th>Optional</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>readOnly</td>
      <td><code>boolean</code></td>
      <td>It displays or not the edit button</td>
      <td>Yes</td>
    </tr>
  </tbody>
</table>

**Example**

```js
// Typescript
{
  metadataMappings: {
    network: { type: "keyword" },
  },
  metadataDetails: {
    network: {
      editorHint: {
        type: EditorHintEnum.BASE,
        readOnly: true,
      },
    },
  },
},
```
```js
// Javascript
{
  metadataMappings: {
    company: { type: "keyword" },
  },
  metadataDetails: {
    company: {
      editorHint: {
        type: "base",
        readOnly: true,
      },
    },
  },
},
```

<h3 id="dropdown-of-values" style="color: #e94e77">Dropdown of values <a href="#dropdown-of-values" class="heading-anchor-link">#</a></h3>

The dropdown feature allows to display a list of values to choose in a dropdown.

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="2" align="center">ENUM</th>
    </tr>
    <tr>
      <th>Type</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>OPTION_SELECTOR</td>
      <td>optionSelector</td>
    </tr>
  </tbody>
</table>

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="4" align="center">PROPERTIES</th>
    </tr>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
      <th>Optional</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>values</td>
      <td>
        <code>string[]</br>number[]</br>boolean[]</code>
      </td>
      <td>
        A list that represents all the values displayed in a dropdown.
      </td>
      <td>No</td>
    </tr>
    <tr>
      <td>customValueAllowed</td>
      <td>
        <code>boolean</code>
      </td>
      <td>Allows users to add custom values.</td>
      <td>Yes</td>
    </tr>
  </tbody>
</table>

**Example**

```js
{
  metadataMappings: {
    company: { type: "keyword" },
  },
  metadataDetails: {
    company: {
      editorHint: {
        type: EditorHintEnum.OPTION_SELECTOR,
        values: ["red", "blue"],
        customValueAllowed: true,
      },
    },
  },
},
```

```js
{
  metadataMappings: {
    company: { type: "keyword" },
  },
  metadataDetails: {
    company: {
      editorHint: {
        type: "optionSelector",
        values: ["red", "blue"],
        customValueAllowed: true,
      },
    },
  },
},
```

**Visual**

![dropdown-of-values](./dropdown-of-values.png)

<h3 id="datedatetimeclock-picker" style="color: #e94e77">Date/Datetime/Clock picker <a href="#datedatetimeclock-picker" class="heading-anchor-link">#</a></h3>

This feature allows to display either a date picker with or without a time picker, or a clock picker.

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="2" align="center">ENUM</th>
    </tr>
    <tr>
      <th>Type</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>DATETIME</td>
      <td>datetime</td>
    </tr>
  </tbody>
</table>

<table>
  <thead>
    <tr>
      <th style="background-color: #e94e77" colspan="4" align="center">PROPERTIES</th>
    </tr>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
      <th>Optional</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>date</td>
      <td>
        <code>boolean</code>
      </td>
      <td>
        If true, displays a date picker, otherwise displays a clock picker.
      </td>
      <td>No</td>
    </tr>
    <tr>
      <td>time</td>
      <td>
        <code>boolean</code>
      </td>
      <td>
        If `date` is true, setting this to true will add time picking to the date picker.
      </td>
      <td>Yes</td>
    </tr>
  </tbody>
</table>

**Example**

```js
{
  metadataMappings: {
    date: { type: "date" },
  },
  metadataDetails: {
    date: {
      editorHint: {
        type: EditorHintEnum.DATETIME,
        date: true,
        time: true,
        customTimeZoneAllowed: true,
      },
    },
  },
},
```

```js
{
  metadataMappings: {
    date: { type: "date" },
  },
  metadataDetails: {
    date: {
      editorHint: {
        type: "datetime",
        date: true,
        time: true,
        customTimeZoneAllowed: true,
      },
    },
  },
},
```

**Visual**

![clock-picker](./clock-picker.png)
