<template>
  <b-container class="mu-2">
    <b-row>
      <b-col cols="12">
        <Table
          :items="items"
          :fields="fields"
          :filterable="true"
          :selectable="true"
          :current-page="currentPage"
          :per-page="perPage"
          :total-rows="totalRows"
          @sort-changed="onSortChanged"
          @row-selected="handleEvent"
          @filtered="onFilterChanged"
          @page-changed="onPageChanged"
          @per-page-changed="onPerPageChanged"
        >
          <template v-slot:cell(actions)="data">
            <a
              href="#"
              @click.prevent="editRow(data)"
              class="text-info"
              v-b-tooltip.hover
              title="Edit"
            >
              <i class="pointer fa fa-pen" /> </a
            >&nbsp;
            <a
              href="#"
              @click.prevent="removeRow(data)"
              class="text-danger"
              v-b-tooltip.hover
              title="Delete"
            >
              <i class="pointer fa fa-trash" />
            </a>
          </template>
        </Table>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4" align-self="start">
        <b-button variant="info" @click="createRow">Add an item</b-button>
      </b-col>
    </b-row>

    <b-modal :id="uid" :title="modalAction" @hide="modalHidden">
      <b-row>
        <b-col cols="6">
          <vue-form-generator :schema="formSchema" :model="document.metadata">
          </vue-form-generator>
        </b-col>
      </b-row>
    </b-modal>
  </b-container>
</template>

<script>
import { ref, reactive } from '@vue/composition-api';
import VueFormGenerator from 'vue-form-generator';

import Table from '@/components/Table.vue';
import MappingFieldsService from '@/services/MappingFieldsService';
import { formSchemaService } from '@/services/formSchema';

export default {
  name: 'TableView',
  components: {
    Table,
    VueFormGenerator: VueFormGenerator.component
  },
  props: {
    index: {
      type: String,
      required: true
    },
    collection: {
      type: String,
      required: true
    }
  },
  setup(props, ctx) {
    const uid = Math.random().toString();
    const mappingFieldsService = new MappingFieldsService();
    const items = reactive([]);
    let totalRows = ref(0);
    let currentPage = 1;
    let perPage = ref(10);
    let filter = ref('');
    let sort = ref(null);
    let formSchema = ref({});
    let fields = ref([]);
    let document = ref({});
    let modalAction = ref('');

    const fetchItems = () => {
      let query = {};
      if (filter.value.length) {
        query = {
          query: {
            multi_match: {
              query: filter.value,
              type: 'phrase_prefix',
              fields: ['*']
            }
          }
        };
      }
      if (sort.value) {
        query.sort = sort.value;
      }

      ctx.root.$kuzzle.document
        .search(props.index, props.collection, query, {
          from: (currentPage - 1) * perPage.value,
          size: perPage.value
        })
        .then(res => {
          items.splice(items, items.length);
          for (const doc of res.hits) {
            items.push({
              _id: doc._id,
              ...doc._source
            });
          }
          totalRows.value = res.total;
          document.value = JSON.parse(JSON.stringify(items[0]));

          ctx.root.$kuzzle.collection
            .getMapping(props.index, props.collection, {
              includeKuzzleMeta: false
            })
            .then(mapping => {
              fields.value = mappingFieldsService.getFieldsForTable(mapping);
              console.log(fields.value);
              fields.value.push({
                key: 'actions',
                label: 'Actions',
                sortable: false
              });

              formSchema.value = formSchemaService.generate(
                mapping.properties.metadata.properties,
                document.value.metadata
              );
            });
        });
    };

    fetchItems();

    return {
      uid,
      items,
      currentPage,
      perPage,
      totalRows,
      fields,
      formSchema,
      document,
      modalAction,
      editRow: data => {
        document.value = JSON.parse(JSON.stringify(data.item));
        modalAction.value = 'Edit';
        ctx.root.$bvModal.show(uid);
      },
      createRow: data => {
        document.value = {
          metadata: {}
        };
        modalAction.value = 'Create';
        ctx.root.$bvModal.show(uid);
      },
      modalHidden: async event => {
        if (event.trigger === 'ok') {
          if (document.value && document.value._id) {
            const id = document.value._id;
            delete document.value._id;
            await ctx.root.$kuzzle.document.update(
              'tenant1',
              'asset',
              id,
              document.value,
              {
                refresh: 'wait_for'
              }
            );
          } else {
            await ctx.root.$kuzzle.document.create(
              'tenant1',
              'asset',
              document.value,
              '',
              {
                refresh: 'wait_for'
              }
            );
          }

          fetchItems();
        }
      },
      removeRow: data => {
        ctx.root.$bvModal.msgBoxConfirm('Are you sure?').then(async value => {
          if (value) {
            await ctx.root.$kuzzle.document.delete(
              'tenant1',
              'asset',
              data.item._id,
              {
                refresh: 'wait_for'
              }
            );
          }
          fetchItems();
        });
      },
      handleEvent: data => {
        console.log(data);
      },
      onPageChanged: page => {
        currentPage = page;
        fetchItems();
      },
      onPerPageChanged: value => {
        perPage.value = value;
        currentPage = 1;
        fetchItems();
      },
      onFilterChanged: receivedFilter => {
        filter.value = receivedFilter;
        fetchItems();
      },
      onSortChanged: data => {
        sort.value = [
          {
            [data.sortBy]: {
              order: data.sortDesc ? 'desc' : 'asc'
            }
          }
        ];
        fetchItems();
      }
    };
  }
};
</script>

<style lang="sass" scoped>
.pointer
  cursor: pointer
</style>
