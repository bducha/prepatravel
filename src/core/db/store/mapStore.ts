import { defineStore } from "pinia"

export const useMapStore = defineStore('mapStore', () => {

    const focusedNode = ref<number|null>(null)

    function setFocusedNode(id: number|null) {
      console.log("setfocusednode", id)
      focusedNode.value = id
    }

    return {
        focusedNode,
        setFocusedNode
    }
});