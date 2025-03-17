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

// 城のデータ（写真アップロード用フォーマットに変換済み）
let castleSpots = [
  { id: 1,  name: "姫路城",     lat: 34.8394, lng: 134.6939, stamped: false, prefecture: "兵庫県", description: "この城は歴史的に重要な場所です。多くの伝説が語られています。", uploadedPhotos: [] },
  { id: 2,  name: "大阪城",     lat: 34.6873, lng: 135.5259, stamped: false, prefecture: "大阪府", description: "この城は壮大な天守閣で知られ、訪れる人々を魅了します。", uploadedPhotos: [] },
  { id: 3,  name: "名古屋城",   lat: 35.1850, lng: 136.9066, stamped: false, prefecture: "愛知県", description: "名古屋城は歴史と現代文化が交差する、重要な観光名所です。", uploadedPhotos: [] },
  { id: 4,  name: "熊本城",     lat: 32.8031, lng: 130.7079, stamped: false, prefecture: "熊本県", description: "熊本城はその美しい城郭と、災害からの復興で知られています。", uploadedPhotos: [] },
  { id: 5,  name: "松本城",     lat: 36.2381, lng: 137.9681, stamped: false, prefecture: "長野県", description: "松本城は現存する国宝級の城郭で、その美しさが評価されています。", uploadedPhotos: [] },
  { id: 6,  name: "弘前城",     lat: 40.6045, lng: 140.4637, stamped: false, prefecture: "青森県", description: "弘前城は桜の名所としても有名で、季節ごとの景観が楽しめます。", uploadedPhotos: [] },
  { id: 7,  name: "二条城",     lat: 35.0214, lng: 135.7524, stamped: false, prefecture: "京都府", description: "二条城は古都京都の歴史を感じさせる、美しい建築物です。", uploadedPhotos: [] },
  { id: 8,  name: "松山城",     lat: 33.8394, lng: 132.7663, stamped: false, prefecture: "愛媛県", description: "松山城は高台に位置し、四国を一望できる絶景スポットです。", uploadedPhotos: [] },
  { id: 9,  name: "丸亀城",     lat: 34.2772, lng: 133.7593, stamped: false, prefecture: "香川県", description: "丸亀城は独特の風格を持つ、歴史ある城跡です。", uploadedPhotos: [] },
  { id: 10, name: "高知城",     lat: 33.5597, lng: 133.5311, stamped: false, prefecture: "高知県", description: "高知城は高知の中心に位置し、歴史と自然が融合した名城です。", uploadedPhotos: [] },
  { id: 11, name: "岡山城",     lat: 34.6551, lng: 133.9183, stamped: false, prefecture: "岡山県", description: "岡山城は美しい石垣と共に、多くの歴史的エピソードを持っています。", uploadedPhotos: [] },
  { id: 12, name: "金沢城",     lat: 36.5613, lng: 136.6562, stamped: false, prefecture: "石川県", description: "金沢城は兼六園とともに、金沢の歴史を彩る重要な遺産です。", uploadedPhotos: [] },
  { id: 13, name: "福山城",     lat: 34.4833, lng: 133.3640, stamped: false, prefecture: "広島県", description: "福山城はその歴史的価値と美しい景観で、観光客に人気です。", uploadedPhotos: [] },
  { id: 14, name: "江戸城跡",   lat: 35.6852, lng: 139.7528, stamped: false, prefecture: "東京都", description: "江戸城跡は江戸時代の栄華を偲ばせる、貴重な遺構です。", uploadedPhotos: [] },
  { id: 15, name: "敦賀城",     lat: 35.6000, lng: 135.2000, stamped: false, prefecture: "福井県", description: "敦賀城は海に近く、歴史と自然が感じられる美しい城跡です。", uploadedPhotos: [] },
  { id: 16, name: "伊賀上野城", lat: 34.7333, lng: 136.1833, stamped: false, prefecture: "三重県", description: "伊賀上野城は忍者の里としても有名で、歴史と伝説が息づいています。", uploadedPhotos: [] },
  { id: 17, name: "彦根城",     lat: 35.2753, lng: 136.1264, stamped: false, prefecture: "滋賀県", description: "彦根城は国宝に指定されている、優美な城郭です。", uploadedPhotos: [] },
  { id: 18, name: "松江城",     lat: 35.4667, lng: 133.0500, stamped: false, prefecture: "島根県", description: "松江城は日本で唯一現存する平山城の一つとして知られています。", uploadedPhotos: [] },
  { id: 19, name: "宇和島城",   lat: 33.9833, lng: 132.7667, stamped: false, prefecture: "愛媛県", description: "宇和島城はその独特な立地と美しい景観が魅力です。", uploadedPhotos: [] },
  { id: 20, name: "犬山城",     lat: 35.3250, lng: 136.9500, stamped: false, prefecture: "愛知県", description: "犬山城は国宝に指定された、日本最古の木造天守です。", uploadedPhotos: [] }
];

