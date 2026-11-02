import React from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import { hasCoords, lineStringToLatLngs } from '../utils/geo';
import { formatTime } from '../utils/format';

export default function TrackingMap({ tracking, route }) {
  const donor = tracking?.donor;
  const recipient = tracking?.recipient;
  const courier = tracking?.last_location;
  const line = lineStringToLatLngs(tracking?.eta?.route_geojson || route);
  const points = [donor, recipient, courier].filter(hasCoords).map((p) => [p.latitude, p.longitude]);
  const center = points[0] || [-1.2921, 36.8219];
  return (
    <MapContainer center={center} zoom={12} bounds={points.length > 1 ? points : undefined} style={{ height: 320, width: '100%' }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#0E3A8C', weight: 4, opacity: 0.7 }} />}
      {hasCoords(donor) && <CircleMarker center={[donor.latitude, donor.longitude]} radius={8} pathOptions={{ color: '#059669' }}><Popup>Donor</Popup></CircleMarker>}
      {hasCoords(recipient) && <CircleMarker center={[recipient.latitude, recipient.longitude]} radius={8} pathOptions={{ color: '#7A1A2B' }}><Popup>Recipient</Popup></CircleMarker>}
      {hasCoords(courier) && (
        <CircleMarker center={[courier.latitude, courier.longitude]} radius={10} pathOptions={{ color: '#F59E0B', fillOpacity: 0.9 }}>
          <Popup>Courier · {courier.speed_kmh ?? '—'} km/h · {formatTime(courier.recorded_at)} EAT</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
