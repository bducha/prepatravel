<template>
  <div id="root">
    <div id="map-wrapper">
      <div id="map" ref="mapContainer"></div>
      <div id="drag-handle" ref="dragHandle" @mousedown="dragMouseDown" @mouseup="dragMouseUp"></div>
    </div>
    <div id="list">
      <v-btn @click="mapState = 'adding_point'">Add a point</v-btn>
      <MapNodesList @node-deleted="handleNodeDeleted" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import "leaflet/dist/leaflet.css"

import L, { Map } from "leaflet"
import { db } from "@/core/db/db"
import MapNodesList from "@/components/MapNodesList.vue"
import { useMapStore } from "@/core/db/store/mapStore"

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const mapref = useTemplateRef('mapContainer')
const mapHeight = ref(500)

const map = ref<Map | null>(null);

const mapEventStates = ['adding_point']

const mapState = ref<typeof mapEventStates[number] | null>(null)

const store = useMapStore()

const mapNodeMarkers = ref<{ [key: number]: L.Marker }>({})


onMounted(() => {
  map.value = L.map(mapref.value as HTMLElement).setView([46, 0], 5)
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map.value as Map)

  map.value.on('click', mapClicked)

  loadNodes();
})

const dragMouseDown = () => {
  document.addEventListener('mousemove', dragMouseMoved, true);
}

const dragMouseUp = () => {
  document.removeEventListener('mousemove', dragMouseMoved, true);
}


const dragMouseMoved = (e: MouseEvent) => {


  mapref.value?.style.setProperty('height', `${mapHeight.value + e.movementY}px`)
  mapHeight.value += e.movementY
  map.value?.invalidateSize()

}

const loadNodes = () => {
  db.mapNodes.toArray().then((nodes) => {
    nodes.forEach((node) => addNodeMarker(node.lat, node.lng, node.id))
  }).catch((err) => {
    console.error(err)
  })
}

watch(() => store.selectedNode, (newId, oldId) => {
  if (!map.value) return
  if (!!newId) {
    db.mapNodes.get(newId).then((node) => {
      if (!node) return
      map.value?.setView([node.lat, node.lng], 7, { animate: true })
    }).catch((err) => {
      console.error(err)
    })
  }
})

const addNodeMarker = (lat: number, lng: number, id: number) => {
  mapNodeMarkers.value[id] = L.marker(
    [lat, lng],
  ).addTo(map.value as Map)

  mapNodeMarkers.value[id].on('click', () => markerClicked(id))
  mapNodeMarkers.value[id].on('mouseover', () => markerMouseEntered(id))
  mapNodeMarkers.value[id].on('mouseout', () => markerMouseLeft(id))
}

const markerClicked = (id: number) => {
  store.setSelectedNode(id)
}

const markerMouseEntered = (id: number) => {
  store.setFocusedNode(id)
}

const markerMouseLeft = (id: number) => {
  store.setFocusedNode(null)
}


const mapClicked = (e: L.LeafletMouseEvent) => {
  console.log("mapClicked", e)
  switch (mapState.value) {
    case 'adding_point':
      console.log(map.value)
      db.mapNodes.add({
        name: 'New point',
        description: '',
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        created_at: new Date(),
        updated_at: new Date()
      }).then((id) => {
        console.log(id)
        addNodeMarker(e.latlng.lat, e.latlng.lng, id)
      }).catch((err) => {
        console.error(err)
      })
        .finally(() => {
          mapState.value = null
        })

      break;
  }
}

const handleNodeDeleted = (id: number) => {
  if (mapNodeMarkers.value[id]) {
    map.value?.removeLayer(mapNodeMarkers.value[id])
    delete mapNodeMarkers.value[id]
  }
  if (store.selectedNode === id) {
    store.setSelectedNode(null)
  }
  if (store.focusedNode === id) {
    store.setFocusedNode(null)
  }

  // Refresh all markers
  Object.values(mapNodeMarkers.value).forEach(marker => {
    map.value?.removeLayer(marker)
  })
  mapNodeMarkers.value = {}
  loadNodes()
}

</script>


<style scoped>
#root {
  height: 100vh;
  display: flex;
  flex-direction: column;

  #list {
    flex: 1;
    overflow-y: auto;
  }

  #map-wrapper {
    width: 100%;
  }

  #map {
    width: 100%;
    height: 500px;
  }

  #drag-handle {
    height: 5px;
    background-color: #ccc;
    cursor: ns-resize;
    position: relative;
    width: 100%;
  }
}
</style>
