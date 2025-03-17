// globals.js
let totalPoints = 0;
let userLocation = null;
let currentLocationMarker = null;
let userCircles = []; // グラデーション風サークル用
let highlightedSpotId = null;

// 地図の初期設定
let map = L.map('map').setView([36, 138], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let markers = L.markerClusterGroup();
map.addLayer(markers);

// カスタムアイコン定義
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const stampedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 城のデータ
let castleSpots = [
  { id: 1,  name: "姫路城", lat: 34.8394, lng: 134.6939, stamped: false, photo: null, prefecture: "兵庫県", description: "この城は歴史的に重要な場所です。多くの伝説が語られています。", uploadedPhotos: [] },
  { id: 2,  name: "大阪城", lat: 34.6873, lng: 135.5259, stamped: false, photo: null, prefecture: "大阪府", description: "この城は壮大な天守閣で知られ、訪れる人々を魅了します。", uploadedPhotos: [] },
 
];
