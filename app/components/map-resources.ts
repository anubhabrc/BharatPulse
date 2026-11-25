'use client';
let library:Promise<typeof import('maplibre-gl')>|undefined;
export function loadMapLibrary() {
  return library??=import('maplibre-gl').then(module=>{
    module.setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs',import.meta.url).toString());
    return module;
  }).catch(error=>{library=undefined;throw error;});
}
