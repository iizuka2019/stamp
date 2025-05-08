// globals.js
let totalPoints = 0;
let userLocation = null;
let currentLocationMarker = null;
let userCircles = []; // グラデーション風サークル用
let highlightedSpotId = null;

// 地図の初期設定 (宣言のみ)
let map; 
let markers; // markerClusterGroupインスタンス

// castleSpots は Firestore から読み込むため、ここでは空の配列として初期化
let castleSpots = [];

// カスタムアイコン定義
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // CDNのシャドウURL
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const stampedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 城の初期データはFirestoreから読み込むため、ここでの大きな配列定義は不要になりました。
// もし、何らかの理由でFirestoreが使えない場合のフォールバックデータとして
// ごく少数のサンプルデータを残しておくことも考えられますが、基本は空で良いでしょう。
/*
// フォールバック用サンプルデータ (通常はコメントアウトまたは削除)
if (castleSpots.length === 0) { // Firestoreからの読み込みに失敗した場合などに使用する可能性
    console.warn("Using fallback castleSpots data. Firestore might not be accessible.");
    castleSpots = [
        { id: 1, name: "サンプル城1", lat: 35.0, lng: 135.0, prefecture: "サンプル県", description: "フォールバックデータです。", defaultImage: "...", points: 1, stamped: false, stampTime: null, uploadedPhotos: [], marker: null },
        { id: 2, name: "サンプル城2", lat: 36.0, lng: 139.0, prefecture: "サンプル県", description: "フォールバックデータです。", defaultImage: "...", points: 1, stamped: false, stampTime: null, uploadedPhotos: [], marker: null }
    ];
}
*/
