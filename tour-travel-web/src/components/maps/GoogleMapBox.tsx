// import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// // interface GoogleMapBoxProps {
// //     lat?: string | number | null;
// //     lng?: string | number | null;
// //     title?: string;
// //     address?: string | null;
// //     height?: number;
// // }

// interface GoogleMapBoxProps {
//     lat?: string | number | null | undefined;
//     lng?: string | number | null | undefined;
//     title?: string | undefined;
//     address?: string | null | undefined;
//     height?: number | undefined;
// }

// const containerStyle = {
//     width: "100%",
//     height: "100%",
// };

// export default function GoogleMapBox({
//     lat,
//     lng,
//     title,
//     address,
//     height = 360,
// }: GoogleMapBoxProps) {
//     const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

//     const latitude = Number(lat);
//     const longitude = Number(lng);

//     const { isLoaded, loadError } = useJsApiLoader({
//         googleMapsApiKey: apiKey || "",
//     });

//     if (!apiKey) {
//         return (
//             <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16 }}>
//                 Chưa cấu hình Google Maps API Key.
//             </div>
//         );
//     }

//     if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
//         return (
//             <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16 }}>
//                 Chưa có tọa độ bản đồ cho điểm đến này.
//             </div>
//         );
//     }

//     if (loadError) {
//         return (
//             <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16 }}>
//                 Không tải được Google Maps.
//             </div>
//         );
//     }

//     if (!isLoaded) {
//         return (
//             <div style={{ height, borderRadius: 16, background: "#f1f5f9" }}>
//                 Đang tải bản đồ...
//             </div>
//         );
//     }

//     const center = {
//         lat: latitude,
//         lng: longitude,
//     };

//     return (
//         <div style={{ height, borderRadius: 16, overflow: "hidden" }}>
//             <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
//                 <Marker position={center} title={title || address || "Địa điểm du lịch"} />
//             </GoogleMap>
//         </div>
//     );
// }