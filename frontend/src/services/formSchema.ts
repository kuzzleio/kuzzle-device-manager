import _ from 'lodash';

export const typesCorrespondance = {
  boolean: 'checkbox',
  text: 'textArea',
  search_as_you_type: 'textArea',
  binary: 'input',
  integer: 'input',
  long: 'input',
  short: 'input',
  byte: 'input',
  double: 'input',
  float: 'input',
  half_float: 'input',
  scaled_float: 'input',
  keyword: 'input',
  wildcard: 'input',
  constant_keyword: 'input',
  ip: 'input',
  date: 'text',
  object: 'textArea',
  flattened: 'textArea',
  geo_point: 'textArea',
  geo_shape: 'textArea',
  histogram: 'textArea',
  percolator: 'textArea',
  point: 'textArea',
  integer_range: 'textArea',
  float_range: 'textArea',
  long_range: 'textArea',
  double_range: 'textArea',
  date_range: 'textArea',
  ip_range: 'textArea',
  rank_feature: 'textArea',
  rank_features: 'textArea',
  shape: 'textArea',
  sparse_vector: 'textArea',
  nested: 'textArea',
  join: 'textArea'
};

const inputTypesCorrespondance = {
  binary: 'text',
  ip: 'text',
  integer: 'number',
  long: 'number',
  short: 'number',
  byte: 'number',
  double: 'number',
  float: 'number',
  half_float: 'number',
  scaled_float: 'number',
  keyword: 'text',
  wildcard: 'text',
  constant_keyword: 'text'
};

interface JSONObject {
  [key: string]: any;
}

class FormSchemaService {
  public generate(mapping: Object, document: Object) {
    const schema: Schema = {
      fields: [],
      unavailable: []
    };

    const cleanedMapping = this.cleanMapping(mapping);

    for (const [index, value] of Object.entries(cleanedMapping)) {
      const documentField: object = (document as JSONObject)[index];
      const type: string = value['properties'] ? 'object' : value['type'];

      if (this.isUnavailable(documentField, type)) {
        console.log(type, documentField);
        schema.unavailable.push(index);
      } else {
        const typeCorrespondance = this.getTypeCorrespondance(type);

        const field: FormField = {
          type: typeCorrespondance,
          inputType: this.getInputTypeCorrespondance(type),
          label: index,
          model: index,
          mapping: value
        };
        schema.fields.push(field);
      }
    }

    return schema;
  }

  private cleanMapping(mapping: object) {
    const fieldsToRemove = ['_kuzzle_info'];
    return _.omit(mapping, fieldsToRemove);
  }

  private isUnavailable(documentField: object, type: string) {
    if (!Object.keys(typesCorrespondance).includes(type)) {
      return true;
    }

    return false;
  }

  private getTypeCorrespondance(mappingType: string) {
    return (typesCorrespondance as JSONObject)[mappingType];
  }

  private getInputTypeCorrespondance(mappingType: string) {
    return (inputTypesCorrespondance as JSONObject)[mappingType] || null;
  }
}

interface FormField {
  type: string;
  inputType: string;
  label: string;
  model: string;
  mapping: object;
}

interface Schema {
  fields: FormField[];
  unavailable: string[];
}

export const formSchemaService = new FormSchemaService();
