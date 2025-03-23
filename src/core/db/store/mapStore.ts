import { defineStore } from "pinia"

export const useMapStore = defineStore('mapStore', () => {

    const focusedNode = ref<number|null>(null)

    const selectedNode = ref<number|null>(null)

    function setFocusedNode(id: number|null) {
      focusedNode.value = id
    }

    function setSelectedNode(id: number|null) {
      selectedNode.value = id
    }

    return {
        focusedNode,
        selectedNode,
        setFocusedNode,
        setSelectedNode
    }
});