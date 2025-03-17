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

  // 以下、東京都の城址・史跡ダミーデータ（全50件）
  { id: 41, name: "皇居（旧江戸城跡）",         lat: 35.6850, lng: 139.7528, stamped: false, prefecture: "東京都", description: "江戸時代の大名の居城であった江戸城跡。現在は皇居として整備されています。", uploadedPhotos: [] },
  { id: 42, name: "皇居本丸跡",                lat: 35.6855, lng: 139.7535, stamped: false, prefecture: "東京都", description: "江戸城の中心部であった本丸跡。皇居の歴史的中核を成す場所です。", uploadedPhotos: [] },
  { id: 43, name: "皇居二の丸庭園",            lat: 35.6860, lng: 139.7540, stamped: false, prefecture: "東京都", description: "江戸城二の丸跡を利用した美しい庭園。歴史と緑が調和しています。", uploadedPhotos: [] },
  { id: 44, name: "皇居三の丸跡",              lat: 35.6865, lng: 139.7545, stamped: false, prefecture: "東京都", description: "江戸城三の丸の跡地。かつての城郭の威容を今に伝えます。", uploadedPhotos: [] },
  { id: 45, name: "皇居四の丸跡",              lat: 35.6870, lng: 139.7550, stamped: false, prefecture: "東京都", description: "江戸城四の丸跡。歴史的な城郭文化の象徴です。", uploadedPhotos: [] },
  { id: 46, name: "大手門跡",                  lat: 35.6875, lng: 139.7555, stamped: false, prefecture: "東京都", description: "江戸城の正門であった大手門跡。壮大な城門の面影が感じられます。", uploadedPhotos: [] },
  { id: 47, name: "二重橋",                    lat: 35.6880, lng: 139.7560, stamped: false, prefecture: "東京都", description: "皇居を象徴する美しい二重橋。東京のシンボルとして有名です。", uploadedPhotos: [] },
  { id: 48, name: "北の丸公園（旧江戸城北の丸跡）", lat: 35.6890, lng: 139.7570, stamped: false, prefecture: "東京都", description: "江戸城北の丸跡を中心とした公園。歴史と自然が融合したエリアです。", uploadedPhotos: [] },
  { id: 49, name: "東の丸跡",                lat: 35.6895, lng: 139.7580, stamped: false, prefecture: "東京都", description: "旧江戸城の東の丸跡。城郭の一部としての歴史的価値があります。", uploadedPhotos: [] },
  { id: 50, name: "西の丸跡",                lat: 35.6900, lng: 139.7575, stamped: false, prefecture: "東京都", description: "旧江戸城の西の丸跡。歴史的建造物の面影が残ります。", uploadedPhotos: [] },
  { id: 51, name: "南の丸跡",                lat: 35.6905, lng: 139.7570, stamped: false, prefecture: "東京都", description: "旧江戸城の南の丸跡。城郭の広大な敷地の一部です。", uploadedPhotos: [] },
  { id: 52, name: "内堀跡",                  lat: 35.6910, lng: 139.7565, stamped: false, prefecture: "東京都", description: "江戸城内の堀跡。城内の防衛施設として重要でした。", uploadedPhotos: [] },
  { id: 53, name: "外堀跡",                  lat: 35.6915, lng: 139.7560, stamped: false, prefecture: "東京都", description: "江戸城外の堀跡。城郭全体の構造を理解する手がかりとなります。", uploadedPhotos: [] },
  { id: 54, name: "大手櫓跡",                lat: 35.6920, lng: 139.7555, stamped: false, prefecture: "東京都", description: "江戸城の大手櫓跡。防衛の要として配置されていました。", uploadedPhotos: [] },
  { id: 55, name: "二の櫓跡",                lat: 35.6925, lng: 139.7550, stamped: false, prefecture: "東京都", description: "江戸城の二の櫓跡。城の守りを強化する施設でした。", uploadedPhotos: [] },
  { id: 56, name: "三の櫓跡",                lat: 35.6930, lng: 139.7545, stamped: false, prefecture: "東京都", description: "江戸城の三の櫓跡。歴史的な防衛施設の一つです。", uploadedPhotos: [] },
  { id: 57, name: "四の櫓跡",                lat: 35.6935, lng: 139.7540, stamped: false, prefecture: "東京都", description: "江戸城の四の櫓跡。城の構造を示す重要な遺構です。", uploadedPhotos: [] },
  { id: 58, name: "外櫓跡",                  lat: 35.6940, lng: 139.7535, stamped: false, prefecture: "東京都", description: "江戸城の外櫓跡。外敵から城を守る役割を果たしました。", uploadedPhotos: [] },
  { id: 59, name: "皇居東御苑",              lat: 35.6950, lng: 139.7525, stamped: false, prefecture: "東京都", description: "皇居の東側に位置する御苑。歴史と自然が調和した美しい庭園です。", uploadedPhotos: [] },
  { id: 60, name: "皇居外苑",                lat: 35.6955, lng: 139.7520, stamped: false, prefecture: "東京都", description: "皇居の外苑。江戸城跡を背景に広がる歴史的な景観が楽しめます。", uploadedPhotos: [] },
  { id: 61, name: "浅草寺",                  lat: 35.7148, lng: 139.7967, stamped: false, prefecture: "東京都", description: "日本最古の寺院の一つで、東京を代表する史跡です。", uploadedPhotos: [] },
  { id: 62, name: "上野恩賜公園",            lat: 35.7148, lng: 139.7770, stamped: false, prefecture: "東京都", description: "広大な公園内には歴史的な建造物や文化財が点在しています。", uploadedPhotos: [] },
  { id: 63, name: "神田明神",                lat: 35.6910, lng: 139.7700, stamped: false, prefecture: "東京都", description: "古くから信仰を集める神社で、歴史的な文化財としても知られています。", uploadedPhotos: [] },
  { id: 64, name: "日比谷公園",              lat: 35.6845, lng: 139.7630, stamped: false, prefecture: "東京都", description: "都心に広がる公園で、歴史的な背景を持つスポットです。", uploadedPhotos: [] },
  { id: 65, name: "丸の内歴史地区",          lat: 35.6812, lng: 139.7671, stamped: false, prefecture: "東京都", description: "近代東京の歴史が色濃く残るエリアです。", uploadedPhotos: [] },
  { id: 66, name: "日本橋",                  lat: 35.6840, lng: 139.7745, stamped: false, prefecture: "東京都", description: "東京の中心を流れる歴史ある橋。街の発展を支えた重要なランドマークです。", uploadedPhotos: [] },
  { id: 67, name: "湯島天神",                lat: 35.7020, lng: 139.7570, stamped: false, prefecture: "東京都", description: "学問の神様を祀る神社で、古くから多くの人々に信仰されています。", uploadedPhotos: [] },
  { id: 68, name: "千駄ヶ谷公園",            lat: 35.6910, lng: 139.7100, stamped: false, prefecture: "東京都", description: "歴史的な背景を持つ公園で、都心のオアシスとして親しまれています。", uploadedPhotos: [] },
  { id: 69, name: "台東区歴史文化センター周辺", lat: 35.7110, lng: 139.7960, stamped: false, prefecture: "東京都", description: "台東区の歴史や文化に触れられるエリアです。", uploadedPhotos: [] },
  { id: 70, name: "墨田区歴史民俗資料館周辺", lat: 35.7100, lng: 139.8100, stamped: false, prefecture: "東京都", description: "墨田区の歴史や民俗が学べる史跡エリアです。", uploadedPhotos: [] },
  { id: 71, name: "丸の内史跡",            lat: 35.6800, lng: 139.7660, stamped: false, prefecture: "東京都", description: "近代東京の発展を支えた歴史的な地域です。", uploadedPhotos: [] },
  { id: 72, name: "神保町歴史地区",          lat: 35.6900, lng: 139.7600, stamped: false, prefecture: "東京都", description: "古書店街として有名な、歴史的な雰囲気の漂うエリアです。", uploadedPhotos: [] },
  { id: 73, name: "湯島文京",              lat: 35.6970, lng: 139.7580, stamped: false, prefecture: "東京都", description: "歴史的な文教地区として知られる、学問と文化の中心地です。", uploadedPhotos: [] },
  { id: 74, name: "上野城跡",              lat: 35.7140, lng: 139.7750, stamped: false, prefecture: "東京都", description: "上野恩賜公園内に点在する、城跡の一部としての史跡です。", uploadedPhotos: [] },
  { id: 75, name: "日比谷の石垣跡",         lat: 35.6840, lng: 139.7650, stamped: false, prefecture: "東京都", description: "日比谷エリアに残る、江戸時代の石垣跡です。", uploadedPhotos: [] },
  { id: 76, name: "大手町史跡",             lat: 35.6850, lng: 139.7620, stamped: false, prefecture: "東京都", description: "大手町周辺の歴史的な建造物や跡地が集まるエリアです。", uploadedPhotos: [] },
  { id: 77, name: "有楽町史跡",             lat: 35.6805, lng: 139.7635, stamped: false, prefecture: "東京都", description: "有楽町エリアに見られる歴史的なスポットです。", uploadedPhotos: [] },
  { id: 78, name: "銀座城跡",              lat: 35.6710, lng: 139.7660, stamped: false, prefecture: "東京都", description: "銀座の一角に伝わる、城跡としての史跡です。（仮称）", uploadedPhotos: [] },
  { id: 79, name: "日本橋城跡",            lat: 35.6845, lng: 139.7740, stamped: false, prefecture: "東京都", description: "日本橋周辺に伝わる、城跡としての歴史的スポットです。（仮称）", uploadedPhotos: [] },
  { id: 80, name: "浅草城跡",              lat: 35.7115, lng: 139.7965, stamped: false, prefecture: "東京都", description: "浅草エリアに存在すると伝えられる、城跡の一部です。（仮称）", uploadedPhotos: [] },
  { id: 81, name: "葛飾区歴史公園",          lat: 35.7600, lng: 139.8600, stamped: false, prefecture: "東京都", description: "葛飾区内の歴史的な建造物跡を整備した史跡公園です。（仮称）", uploadedPhotos: [] },
  { id: 82, name: "足立区歴史の森",          lat: 35.7800, lng: 139.8300, stamped: false, prefecture: "東京都", description: "足立区内に残る古い史跡や遺構を保存するエリアです。（仮称）", uploadedPhotos: [] },
  { id: 83, name: "江東区城跡",             lat: 35.6500, lng: 139.8500, stamped: false, prefecture: "東京都", description: "江東区内にある歴史的な城跡としての史跡です。（仮称）", uploadedPhotos: [] },
  { id: 84, name: "品川区歴史跡",           lat: 35.6200, lng: 139.7300, stamped: false, prefecture: "東京都", description: "品川区の歴史あるエリアの一部を示す史跡です。（仮称）", uploadedPhotos: [] },
  { id: 85, name: "目黒区史跡公園",          lat: 35.6400, lng: 139.7100, stamped: false, prefecture: "東京都", description: "目黒区内の古い建造物跡を保存した史跡公園です。（仮称）", uploadedPhotos: [] },
  { id: 86, name: "世田谷区城跡",           lat: 35.6400, lng: 139.6500, stamped: false, prefecture: "東京都", description: "世田谷区内に伝わる城跡を示す史跡です。（仮称）", uploadedPhotos: [] },
  { id: 87, name: "中野区史跡",             lat: 35.7100, lng: 139.6700, stamped: false, prefecture: "東京都", description: "中野区内に残る歴史的建造物跡の一部です。（仮称）", uploadedPhotos: [] },
  { id: 88, name: "杉並区史跡",             lat: 35.7000, lng: 139.6500, stamped: false, prefecture: "東京都", description: "杉並区内の伝統的な街並みや建造物跡を示す史跡です。（仮称）", uploadedPhotos: [] },
  { id: 89, name: "練馬区古墳跡",           lat: 35.7400, lng: 139.6800, stamped: false, prefecture: "東京都", description: "練馬区に点在する古代遺跡の一部としての史跡です。（仮称）", uploadedPhotos: [] },
  { id: 90, name: "町田市史跡",             lat: 35.5500, lng: 139.4500, stamped: false, prefecture: "東京都", description: "町田市内の歴史的な民家群や城跡が見られる地域です。（仮称）", uploadedPhotos: [] }
];


