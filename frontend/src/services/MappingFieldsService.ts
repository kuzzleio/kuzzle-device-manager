import flatten from 'flat';

export default class MappingFieldsService {
  private unwantedPathKeys = [
    '.nested',
    '.properties',
    'properties.',
    '.type',
    '.fields'
  ];
  private sortableFields = ['keyword', 'date', 'integer'];

  public getFieldsForTable(mapping: Object): Array<TableField> {
    const fields: Array<TableField> = [];

    for (const path of Object.keys(flatten(mapping))) {
      if (path !== 'dynamic') {
        let cleanedPath = {
          key: path,
          label: path,
          sortable: this.sortableFields.includes(
            (flatten(mapping) as Array<string>)[path as any]
          )
        };

        this.unwantedPathKeys.forEach(el => {
          cleanedPath.key = cleanedPath.key.replace(el, '');
          cleanedPath.label = cleanedPath.key.substring(
            cleanedPath.key.lastIndexOf('.') + 1,
            cleanedPath.key.length
          );
        });
        fields.push(cleanedPath);
      }
    }
    return fields;
  }
}
