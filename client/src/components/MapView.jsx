import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Configure default Leaflet marker icons reliably for Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FitMapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

export default function MapView({
  destinations = [],
  selectedDestinations = [],
  showAttractions = false,
  heightClass = 'h-[480px]',
}) {
  const activeRouteList = selectedDestinations.length > 0 ? selectedDestinations : [];
  const routeCoords = activeRouteList
    .filter((d) => d.coordinates?.lat && d.coordinates?.lng)
    .map((d) => [d.coordinates.lat, d.coordinates.lng]);

  const allCoords = destinations
    .filter((d) => d.coordinates?.lat && d.coordinates?.lng)
    .map((d) => [d.coordinates.lat, d.coordinates.lng]);

  const boundsPoints = routeCoords.length > 0 ? routeCoords : allCoords;
  const center = boundsPoints[0] || [26.5, 73.8];

  return (
    <div className="space-y-2">
      <div className={`w-full overflow-hidden rounded-2xl border border-slate-800 ${heightClass}`}>
        <MapContainer center={center} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapBounds points={boundsPoints} />

          {destinations.map((dest) => {
            if (!dest.coordinates?.lat || !dest.coordinates?.lng) return null;
            const isSelected = activeRouteList.some((s) => s._id === dest._id);
            return (
              <Marker key={dest._id} position={[dest.coordinates.lat, dest.coordinates.lng]}>
                <Popup>
                  <div className="text-slate-900 min-w-[160px]">
                    <p className="font-bold text-sm">{dest.name}</p>
                    <p className="text-xs text-slate-600">
                      {dest.region} · {dest.recommendedDays} day(s) rec.
                    </p>
                    {isSelected && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">
                        Included in selected route
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {showAttractions &&
            destinations.flatMap((dest) =>
              (dest.attractions || []).map((attr) =>
                attr.coordinates?.lat && attr.coordinates?.lng ? (
                  <CircleMarker
                    key={`${dest._id}-${attr.name}`}
                    center={[attr.coordinates.lat, attr.coordinates.lng]}
                    radius={5}
                    pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <div className="text-slate-900">
                        <p className="font-semibold text-xs">{attr.name}</p>
                        <p className="text-[11px] text-slate-600">
                          {dest.name} · {attr.category}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ) : null
              )
            )}

          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#f59e0b', weight: 3.5, dashArray: '8 6' }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-[11px] text-slate-400">
        Map powered by OpenStreetMap & Leaflet using MongoDB destination coordinates. Dashed lines show
        direct coordinate order (not live road-routing distances or drive times).
      </p>
    </div>
  );
}
