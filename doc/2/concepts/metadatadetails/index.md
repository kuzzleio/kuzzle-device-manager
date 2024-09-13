---
code: true
type: page
title: Metadata details
description: structure of metadataDetails
---

# Metadata details

## Group

...

## Translations

...

## Editor hint

This property allows to improve the user experience to manage metadata. In the frontend, it can unlock the possibility to display dropdown of values, to chose between a clock picker or datepicker with time or not, a read only metadata and so on. You have to set the enum type according to the following list :
- BASE
- OPTION_SELECTOR
- DATETIME

<h3 style="color: #e94e77">Read only</h3>
In the Iot platform it allows the user to edit or to only read the metadata.

**NOTE: The readOnly property can be set with any Enum type.**

Enum type: `BASE` **_(set to BASE if you just want the readOnly property)_**

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
	}
},
```

<h3 style="color: #e94e77">Dropdown of values</h3>

In the Iot platform it allows to display a list of values to choose in a dropdown, it has to be defined in the the editorHint property of the asset/device metadatadetails.
 
Enum type: `OPTION_SELECTOR`

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
		}
  },
},
```

<h3 style="color: #e94e77">Date/Datetime/Clock picker</h3>

In the Iot platform, it allows to display either a calendar picker with or not a time picker or either a clock picker, it has to be defined in the editorHint property of the asset/device.

Enum type: `DATETIME`

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
      <td><code>boolean</code></td>
      <td>It defines either a calendar picker is displayed if set at true or either a clock picker otherwise.</td>
      <td>No</td>
    </tr>
    <tr>
      <td>time</td>
      <td><code>boolean</code></td>
      <td>It defines if the time picker is displayed alongside the calendar picker.</td>
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
    }
  },
},
```