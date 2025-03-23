<template>
  <div class="list-container" ref="listContainer">
    <v-card :class="{
      'map-node-card': true,
      'focused-card': store.focusedNode === node.id || store.selectedNode === node.id,
    }" v-for="node in (mapNodes ?? [])" :key="node.id" :title="node.name" @mouseenter="mouseEnterCard(node.id)"
      @mouseleave="mouseLeaveCard()" :data-node-id="node.id" @click="() => store.setSelectedNode(node.id)">
      <v-card-text>
        {{ node.description }}
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" @click.stop="deleteNode(node.id)">Delete</v-btn>
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

const emit = defineEmits<{
  (e: 'nodeDeleted', id: number): void
}>()

const store = useMapStore()

const mapNodes = useObservable<MapNode[]>(from(liveQuery(() => db.mapNodes.toArray())))

const mouseEnterCard = (id: number) => {
  store.setFocusedNode(id)
}

const mouseLeaveCard = () => {
  store.setFocusedNode(null)
}

const listContainer = ref<HTMLElement | null>(null)

watch(() => store.selectedNode, (newVal) => {
  if (!!listContainer.value) {
    const selectedCard = listContainer.value.querySelector(`[data-node-id="${newVal}"]`)
    if (selectedCard) {
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

const deleteNode = async (id: number) => {
  try {
    await db.mapNodes.delete(id)
    emit('nodeDeleted', id)
  } catch (error) {
    console.error('Failed to delete node:', error)
  }
}

</script>

<style lang="scss" scoped>
:root {
  width: 100%;

  .list-container {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
  }

  .map-node-card {
    box-sizing: border-box;
    max-width: 500px;
    width: 40%;
    min-width: 300px;
    margin: 10px;

  }

  .focused-card {
    box-shadow: inset 0px 0px 0px 1px rgb(var(--v-theme-primary));
  }
}
</style>