<template>
  <div class="list-container" ref="listContainer">
    <v-card :class="{
      'map-node-card': true,
      'focused-card': store.focusedNode === node.id || store.selectedNode === node.id,
    }" v-for="node in (mapNodes ?? [])" :key="node.id" @mouseenter="mouseEnterCard(node.id)"
      @mouseleave="mouseLeaveCard()" :data-node-id="node.id" @click="() => store.setSelectedNode(node.id)">
      <v-card-title class="d-flex align-center">
        <v-text-field v-if="editingNode?.id === node.id" v-model="editingNode.name" @blur="saveEdit"
          @keyup.enter="saveEdit" @keyup.esc="cancelEdit" density="compact" hide-details variant="outlined"
          class="name-edit-field" :ref="el => { if (el) editFields[node.id] = el }"></v-text-field>
        <template v-else>
          <span>{{ node.name }}</span>
          <v-icon icon="mdi-pencil" size="small" class="ms-2 edit-icon" @click.stop="startEditing(node)"></v-icon>
        </template>
      </v-card-title>
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

const props = defineProps<{
  editNodeId?: number | null
}>()

const emit = defineEmits<{
  (e: 'nodeDeleted', id: number): void
}>()

const store = useMapStore()

const mapNodes = useObservable<MapNode[]>(from(liveQuery(() => db.mapNodes.toArray())))

const editingNode = ref<MapNode | null>(null)

const editFields: { [key: number]: any } = {}

watch(() => props.editNodeId, (newId) => {
  if (newId) {
    const node = mapNodes.value?.find(n => n.id === newId)
    if (node) {
      startEditing(node)
    }
  }
})

const startEditing = (node: MapNode) => {
  editingNode.value = { ...node }
  // Focus the field after a short delay to ensure it's mounted
  nextTick(() => {
    const field = editFields[node.id]
    if (field) {
      field.focus()
    }
  })
}

const saveEdit = async () => {
  if (!editingNode.value) return

  try {
    await db.mapNodes.update(editingNode.value.id, {
      name: editingNode.value.name,
      updated_at: new Date()
    })
    editingNode.value = null
  } catch (error) {
    console.error('Failed to update node:', error)
  }
}

const cancelEdit = () => {
  editingNode.value = null
}

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

    .name-edit-field {
      margin: -8px -16px;
      padding: 0 16px;

      :deep(.v-field) {
        border-color: rgb(var(--v-theme-surface-variant));
        background-color: rgb(var(--v-theme-surface));
      }
    }

    .edit-icon {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .edit-icon {
      opacity: 1;
    }
  }

  .focused-card {
    box-shadow: inset 0px 0px 0px 1px rgb(var(--v-theme-primary));
  }
}
</style>