import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

interface OpenStreetMapBoxProps {
    lat?: string | number | null | undefined;
    lng?: string | number | null | undefined;
    title?: string | undefined;
    address?: string | null | undefined;
    height?: number | undefined;
    zoom?: number | undefined;
}

/**
 * Fix lỗi icon marker không hiện đúng khi dùng Leaflet với Vite/Webpack.
 */
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function OpenStreetMapBox({
    lat,
    lng,
    title,
    address,
    height = 380,
    zoom = 12,
}: OpenStreetMapBoxProps) {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return (
            <div
                style={{
                    height,
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    color: '#64748b',
                    textAlign: 'center',
                }}
            >
                Chưa có tọa độ bản đồ cho điểm đến này.
            </div>
        );
    }

    const position: [number, number] = [latitude, longitude];

    return (
        <div
            style={{
                height,
                width: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
            }}
        >
            <MapContainer
                center={position}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{
                    height: '100%',
                    width: '100%',
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={position} icon={defaultIcon}>
                    <Popup>
                        <strong>{title || 'Địa điểm du lịch'}</strong>
                        <br />
                        {address || `${latitude}, ${longitude}`}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}