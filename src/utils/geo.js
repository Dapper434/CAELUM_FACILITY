/** Convert a GeoJSON LineString ([lng, lat]) into Leaflet [lat, lng] pairs. */
export function lineStringToLatLngs(geojson) {
  if (!geojson || geojson.type !== 'LineString' || !Array.isArray(geojson.coordinates)) return [];
  return geojson.coordinates
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map(([lng, lat]) => [lat, lng]);
}

export function hasCoords(p) {
  return p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
}
