<template>
  <div class="list-container">
    <v-card 
      class="map-node-card"
      v-for="node in (mapNodes ?? [])"
      :key="node.id"
      :title="node.name"
      :elevation="store.focusedNode === node.id ? 24 : 2"
      @mouseenter="mouseEnterCard(node.id)"
      @mouseleave="mouseLeaveCard()"

      >
      <v-card-text>
        {{ node.description }}
      </v-card-text>
      <v-card-actions>
        <v-btn color="error">Delete</v-btn>
      </v-card-actions>
  </v-card>
  </div>
</template>

<script setup lang="ts">

import { db, type MapNode } from '@/core/db/db';
import { useMapStore } from '@/core/db/store/mapStore';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';

const store = useMapStore()

const mapNodes = useObservable<MapNode[]>(from(liveQuery(() => db.mapNodes.toArray())))

const mouseEnterCard = (id: number) => {
  console.log("mouseenter", id)
  store.setFocusedNode(id)
}

const mouseLeaveCard = () => {
  console.log("mouseleave")
  store.setFocusedNode(null)
}


</script>

<style scoped>
:root {
  width: 100%;

  .list-container {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
  }

  .map-node-card {
    max-width: 500px;
    width: 40%;
    min-width: 300px;
    margin: 10px;
  }
}
</style>