import Dexie, { type EntityTable } from 'dexie';

interface MapNode {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
  created_at: Date;
  updated_at: Date;
}

const db = new Dexie('prepatraveldb') as Dexie & {
  mapNodes: EntityTable<
    MapNode,
    'id'
  >;
};

db.version(1).stores({
  mapNodes: '++id, name, description, lat, lng, created_at, updated_at'
});

export type { MapNode };
export { db };

