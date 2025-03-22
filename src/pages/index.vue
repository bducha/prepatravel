<template>
  <div id="map" ref="mapContainer"></div>
  <div>
    <v-btn @click="mapState = 'adding_point'">Add a point</v-btn>
    <MapNodesList />
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

const map = ref<Map | null>(null);

const mapEventStates = ['adding_point']

const mapState = ref<typeof mapEventStates[number] | null>(null)

const store = useMapStore()


onMounted(() => {
  map.value = L.map(mapref.value as HTMLElement).setView([46, 0], 5)
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map.value as Map)

  map.value.on('click', mapClicked)

  db.mapNodes.toArray().then((nodes) => {
    nodes.forEach((node) => {
      L.marker(
        [node.lat, node.lng],
      ).addTo(map.value as Map)
    })
  }).catch((err) => {
    console.error(err)
  })
})

watch(() => store.focusedNode, (newId, oldId) => {
  if (!map.value) return
  if (!!newId) {
    db.mapNodes.get(newId).then((node) => {
      if (!node) return
      map.value?.setView([node.lat, node.lng], 7, {animate: true})
    }).catch((err) => {
      console.error(err)
    })
  }
})


const mapClicked = (e: L.LeafletMouseEvent) => {
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

        L.marker(
          [e.latlng.lat, e.latlng.lng],
        ).addTo(map.value as Map)
      }).catch((err) => {
        console.error(err)
      })
        .finally(() => {
          mapState.value = null
        })

      break;
  }
}

</script>


<style>
#map {
  height: 500px;
}
</style>
