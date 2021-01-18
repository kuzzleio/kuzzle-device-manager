<template>
  <b-row>
    <b-col cols="6">
      <b-card header="Assets" align="center">
        <TableView index="tenant1" collection="asset"></TableView>
      </b-card>
    </b-col>
    <b-col cols="6">
      <b-card header="Sensors" align="center">
        <TableView index="tenant1" collection="sensor"></TableView>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
import TableView from '@/components/TableView';

export default {
  components: {
    TableView
  }
};
</script>

<style></style>
