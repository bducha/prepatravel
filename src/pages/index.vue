<template>
  <div id="map" ref="mapContainer"></div>
  <div>
    <v-btn @click="mapState = 'adding_point'">Add a point</v-btn>
    <div v-for="node in (mapNodes ?? [])">
      {{ node.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import "leaflet/dist/leaflet.css"

import L, { Map } from "leaflet"
import { db, type MapNode } from "@/core/db/db"
import { useObservable } from "@vueuse/rxjs"
import { liveQuery } from "dexie"
import {from } from "rxjs";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const mapref = useTemplateRef('mapContainer')

const map = ref<Map | null>(null);

const mapEventStates = ['adding_point']

const mapState = ref<typeof mapEventStates[number] | null>(null)

const mapNodes = useObservable<MapNode[]>(from(liveQuery(() => db.mapNodes.toArray())))

onMounted(() => {
  map.value = L.map(mapref.value as HTMLElement).setView([46, 0], 5)
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map.value)
  console.log(map.value)

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
        ).addTo(map.value)
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
