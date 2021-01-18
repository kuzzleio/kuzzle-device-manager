<template>
  <b-container>
    <b-row class="mb-1">
      <b-col cols="12">
        <b-form-input
          v-if="filterable"
          v-model="filter"
          type="search"
          placeholder="Type to Filter"
          @input="onFiltered"
        ></b-form-input>
      </b-col>
    </b-row>

    <b-row class="mb-1">
      <b-col cols="12" align-self="end">
        <b-form-group
          label="Per page"
          label-cols-sm="10"
          label-cols-md="10"
          label-cols-lg="10"
          label-align-sm="right"
          label-size="sm"
          label-for="perPageSelect"
          class="mb-0"
        >
          <b-form-select
            v-model="_perPage"
            id="perPageSelect"
            size="sm"
            :options="pageOptions"
            @change="onPerPageChanged"
          ></b-form-select>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col cols="12">
        <b-table
          data-cy="table"
          striped
          hover
          bordered
          small
          no-sort-reset
          responsive="sm"
          :selectable="selectable"
          :items="items"
          :fields="fields"
          :no-local-sorting="true"
          @sort-changed="onSortChanged"
          @row-selected="onRowSelected"
        >
          <template
            v-for="slotName of Object.keys($scopedSlots)"
            v-slot:[slotName]="slotScope"
          >
            <slot :name="slotName" v-bind="slotScope"></slot>
          </template>
        </b-table>
        <b-pagination
          v-model="_currentPage"
          :total-rows="totalRows"
          align="fill"
          size="sm"
          class="my-0 d-flex pull-right"
          :per-page="_perPage"
        ></b-pagination>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { ref, watch, reactive } from '@vue/composition-api';

export default {
  name: 'Table',
  props: {
    items: {
      type: Array,
      required: true
    },
    fields: {
      type: Array,
      required: true
    },
    filterable: {
      type: Boolean,
      required: false,
      default: false
    },
    selectable: {
      type: Boolean,
      required: false,
      default: false
    },
    currentPage: {
      type: Number,
      required: false,
      default: 1
    },
    perPage: {
      type: Number,
      required: false,
      default: 10
    },
    pageOptions: {
      type: Array,
      required: false,
      default: () => [1, 10, 15, 100]
    },
    totalRows: {
      type: Number,
      required: false,
      default: 0
    }
  },
  setup(props, { emit }) {
    let _currentPage = ref(props.currentPage);
    let _perPage = ref(props.perPage);

    watch(_currentPage, value => {
      emit('page-changed', value);
    });

    return {
      filter: ref(''),
      _currentPage,
      _perPage: reactive(props.perPage),
      onSortChanged: data => {
        emit('sort-changed', data);
      },
      onRowSelected: data => {
        emit('row-selected', data);
      },
      onFiltered: filter => {
        emit('filtered', filter);
      },
      onPerPageChanged: data => {
        emit('per-page-changed', data);
      }
    };
  }
};
</script>
