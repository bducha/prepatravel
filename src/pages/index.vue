<template>
  <div id="root">
    <div id="map-wrapper">
      <div id="map" ref="mapContainer"></div>
      <div id="drag-handle" ref="dragHandle" @mousedown="dragMouseDown" @mouseup="dragMouseUp"></div>
    </div>
    <div id="list">
      <v-btn @click="mapState = 'adding_point'">Add a point</v-btn>
      <MapNodesList @node-deleted="handleNodeDeleted" :edit-node-id="newlyCreatedNodeId" />
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
const mapHeight = ref(Math.min(
  Math.max(
    Number(localStorage.getItem('mapHeight')) || 500,
    window.innerHeight * 0.2
  ),
  window.innerHeight * 0.8
))

const newlyCreatedNodeId = ref<number | null>(null)

const map = ref<Map | null>(null);

const mapEventStates = ['adding_point']

const mapState = ref<typeof mapEventStates[number] | null>(null)

const store = useMapStore()

const mapNodeMarkers = ref<{ [key: number]: L.Marker }>({})


onMounted(() => {
  mapref.value?.style.setProperty('height', `${mapHeight.value}px`)
  map.value = L.map(mapref.value as HTMLElement).setView([46, 0], 5)
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map.value as Map)

  map.value.on('click', mapClicked)

  loadNodes();
})

const dragMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  document.addEventListener('mousemove', dragMouseMoved, true);
  document.addEventListener('mouseup', dragMouseUp, true);
}

const dragMouseUp = (e: MouseEvent) => {
  e.preventDefault()
  document.removeEventListener('mousemove', dragMouseMoved, true);
  document.removeEventListener('mouseup', dragMouseUp, true);
}


const dragMouseMoved = (e: MouseEvent) => {
  e.preventDefault()
  const newHeight = mapHeight.value + e.movementY
  const minHeight = window.innerHeight * 0.2
  const maxHeight = window.innerHeight * 0.8

  if (newHeight >= minHeight && newHeight <= maxHeight) {
    mapref.value?.style.setProperty('height', `${newHeight}px`)
    mapHeight.value = newHeight
    localStorage.setItem('mapHeight', mapHeight.value.toString())
    map.value?.invalidateSize()
  }
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

      const currentZoom = map.value?.getZoom() || 0
      const targetZoom = 7

      if (currentZoom <= targetZoom) {
        map.value?.setView([node.lat, node.lng], targetZoom, { animate: true })
      }


    }).catch((err) => {
      console.error(err)
    })
  }
})

const addNodeMarker = (lat: number, lng: number, id: number) => {
  mapNodeMarkers.value[id] = L.marker(
    [lat, lng],
    {draggable: true}
  ).addTo(map.value as Map)

  mapNodeMarkers.value[id].on('click', () => markerClicked(id))
  mapNodeMarkers.value[id].on('mouseover', () => markerMouseEntered(id))
  mapNodeMarkers.value[id].on('mouseout', () => markerMouseLeft(id))

  mapNodeMarkers.value[id].on('dragend', (event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    
    db.mapNodes.update(id, {
      lat: position.lat,
      lng: position.lng,
      updated_at: new Date()
    }).catch((err) => {
      console.error("Failed to update marker position:", err);
    });
  });
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
        name: '',  // Empty name to trigger edit mode
        description: '',
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        created_at: new Date(),
        updated_at: new Date()
      }).then((id) => {
        console.log(id)
        addNodeMarker(e.latlng.lat, e.latlng.lng, id)
        store.setSelectedNode(id)
        newlyCreatedNodeId.value = id
        // Reset the edit node id after a short delay to allow the card to be created
        setTimeout(() => {
          newlyCreatedNodeId.value = null
        }, 100)
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
    height: v-bind(mapHeight + 'px');
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
