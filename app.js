// ダミーの写真 URL 配列（グローバル変数として定義）
const dummyPhotoURLs = [
  "https://assets.st-note.com/production/uploads/images/120566836/rectangle_large_type_2_db692b996219eb34650cef420635a31b.png",
  "https://assets.st-note.com/production/uploads/images/120573954/rectangle_large_type_2_0cea5b992f48da3b63c53d7d10ab9a55.png",
  "https://assets.st-note.com/production/uploads/images/120574983/rectangle_large_type_2_564d6de6b67df4446f5a6d961307c928.png",
  "https://assets.st-note.com/production/uploads/images/120581790/rectangle_large_type_2_7c324d27068cba23cd8948fbd9e8d163.png",
  "https://assets.st-note.com/production/uploads/images/120591518/rectangle_large_type_2_ce36d3920374d82d2cd1641dfca48857.png"
];



// Firebaseの初期化
const firebaseConfig = {
  apiKey: "AIzaSyDKoSPR75Je99OtMywNCx7Wdufo2sqRo0Q",
  authDomain: "stamprally-202503.firebaseapp.com",
  projectId: "stamprally-202503",
  storageBucket: "stamprally-202503.firebasestorage.app",
  messagingSenderId: "302159612226",
  appId: "1:302159612226:web:b33b58c902b33b00c9a0db"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// グローバル変数
let totalPoints = 0;
let userLocation = null;
let currentLocationMarker = null;
let userCircles = []; // グラデーション風サークル用の配列
let highlightedSpotId = null;

// 地図の初期設定
let map = L.map('map').setView([36, 138], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let markers = L.markerClusterGroup();

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

// 城のデータ（各城に説明文・ダミーテキストを追加）
let castleSpots = [
  { id: 1,  name: "姫路城",     lat: 34.8394, lng: 134.6939, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "兵庫県", description: "この城は歴史的に重要な場所です。多くの伝説が語られています。" },
  { id: 2,  name: "大阪城",     lat: 34.6873, lng: 135.5259, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "大阪府", description: "この城は壮大な天守閣で知られ、訪れる人々を魅了します。" },
  { id: 3,  name: "名古屋城",   lat: 35.1850, lng: 136.9066, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛知県", description: "名古屋城は歴史と現代文化が交差する、重要な観光名所です。" },
  { id: 4,  name: "熊本城",     lat: 32.8031, lng: 130.7079, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "熊本県", description: "熊本城はその美しい城郭と、災害からの復興で知られています。" },
  { id: 5,  name: "松本城",     lat: 36.2381, lng: 137.9681, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "長野県", description: "松本城は現存する国宝級の城郭で、その美しさが評価されています。" },
  { id: 6,  name: "弘前城",     lat: 40.6045, lng: 140.4637, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "青森県", description: "弘前城は桜の名所としても有名で、季節ごとの景観が楽しめます。" },
  { id: 7,  name: "二条城",     lat: 35.0214, lng: 135.7524, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "京都府", description: "二条城は古都京都の歴史を感じさせる、美しい建築物です。" },
  { id: 8,  name: "松山城",     lat: 33.8394, lng: 132.7663, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛媛県", description: "松山城は高台に位置し、四国を一望できる絶景スポットです。" },
  { id: 9,  name: "丸亀城",     lat: 34.2772, lng: 133.7593, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "香川県", description: "丸亀城は独特の風格を持つ、歴史ある城跡です。" },
  { id: 10, name: "高知城",     lat: 33.5597, lng: 133.5311, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "高知県", description: "高知城は高知の中心に位置し、歴史と自然が融合した名城です。" },
  { id: 11, name: "岡山城",     lat: 34.6551, lng: 133.9183, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "岡山県", description: "岡山城は美しい石垣と共に、多くの歴史的エピソードを持っています。" },
  { id: 12, name: "金沢城",     lat: 36.5613, lng: 136.6562, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "石川県", description: "金沢城は兼六園とともに、金沢の歴史を彩る重要な遺産です。" },
  { id: 13, name: "福山城",     lat: 34.4833, lng: 133.3640, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "広島県", description: "福山城はその歴史的価値と美しい景観で、観光客に人気です。" },
  { id: 14, name: "江戸城跡",   lat: 35.6852, lng: 139.7528, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城跡は江戸時代の栄華を偲ばせる、貴重な遺構です。" },
  { id: 15, name: "敦賀城",     lat: 35.6000, lng: 135.2000, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "福井県", description: "敦賀城は海に近く、歴史と自然が感じられる美しい城跡です。" },
  { id: 16, name: "伊賀上野城", lat: 34.7333, lng: 136.1833, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "三重県", description: "伊賀上野城は忍者の里としても有名で、歴史と伝説が息づいています。" },
  { id: 17, name: "彦根城",     lat: 35.2753, lng: 136.1264, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "滋賀県", description: "彦根城は国宝に指定されている、優美な城郭です。" },
  { id: 18, name: "松江城",     lat: 35.4667, lng: 133.0500, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "島根県", description: "松江城は日本で唯一現存する平山城の一つとして知られています。" },
  { id: 19, name: "宇和島城",   lat: 33.9833, lng: 132.7667, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛媛県", description: "宇和島城はその独特な立地と美しい景観が魅力です。" },
  { id: 20, name: "犬山城",     lat: 35.3250, lng: 136.9500, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛知県", description: "犬山城は国宝に指定された、日本最古の木造天守です。" },
  { id: 31, name: "表木城址",   lat: 35.7861114, lng: 137.874874, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", points: 10, prefecture: "長野県", description: "表木城址は特別な価値を持つ城跡として、10ポイントが設定されています。" },
  { id: 41,  name: "皇居（旧江戸城跡）",         lat: 35.6850, lng: 139.7528, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸時代の大名の居城であった江戸城跡。現在は皇居として整備されています。" },
  { id: 42,  name: "皇居本丸跡",                lat: 35.6855, lng: 139.7535, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の中心部であった本丸跡。皇居の歴史的中核を成す場所です。" },
  { id: 43,  name: "皇居二の丸庭園",            lat: 35.6860, lng: 139.7540, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城二の丸跡を利用した美しい庭園。歴史と緑が調和しています。" },
  { id: 44,  name: "皇居三の丸跡",              lat: 35.6865, lng: 139.7545, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城三の丸の跡地。かつての城郭の威容を今に伝えます。" },
  { id: 45,  name: "皇居四の丸跡",              lat: 35.6870, lng: 139.7550, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城四の丸跡。歴史的な城郭文化の象徴です。" },
  { id: 46,  name: "大手門跡",                  lat: 35.6875, lng: 139.7555, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の正門であった大手門跡。壮大な城門の面影が感じられます。" },
  { id: 47,  name: "二重橋",                    lat: 35.6880, lng: 139.7560, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居を象徴する美しい二重橋。東京のシンボルとして有名です。" },
  { id: 48,  name: "北の丸公園（旧江戸城北の丸跡）", lat: 35.6890, lng: 139.7570, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城北の丸跡を中心とした公園。歴史と自然が融合したエリアです。" },
  { id: 49,  name: "東の丸跡",                lat: 35.6895, lng: 139.7580, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の東の丸跡。城郭の一部としての歴史的価値があります。" },
  { id: 50, name: "西の丸跡",                lat: 35.6900, lng: 139.7575, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の西の丸跡。歴史的建造物の面影が残ります。" },
  { id: 51, name: "南の丸跡",                lat: 35.6905, lng: 139.7570, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の南の丸跡。城郭の広大な敷地の一部です。" },
  { id: 52, name: "内堀跡",                  lat: 35.6910, lng: 139.7565, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城内の堀跡。城内の防衛施設として重要でした。" },
  { id: 53, name: "外堀跡",                  lat: 35.6915, lng: 139.7560, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城外の堀跡。城郭全体の構造を理解する手がかりとなります。" },
  { id: 54, name: "大手櫓跡",                lat: 35.6920, lng: 139.7555, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の大手櫓跡。防衛の要として配置されていました。" },
  { id: 55, name: "二の櫓跡",                lat: 35.6925, lng: 139.7550, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の二の櫓跡。城の守りを強化する施設でした。" },
  { id: 56, name: "三の櫓跡",                lat: 35.6930, lng: 139.7545, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の三の櫓跡。歴史的な防衛施設の一つです。" },
  { id: 57, name: "四の櫓跡",                lat: 35.6935, lng: 139.7540, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の四の櫓跡。城の構造を示す重要な遺構です。" },
  { id: 58, name: "外櫓跡",                  lat: 35.6940, lng: 139.7535, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の外櫓跡。外敵から城を守る役割を果たしました。" },
  { id: 59, name: "皇居東御苑",              lat: 35.6950, lng: 139.7525, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居の東側に位置する御苑。歴史と自然が調和した美しい庭園です。" },
  { id: 60, name: "皇居外苑",                lat: 35.6955, lng: 139.7520, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居の外苑。江戸城跡を背景に広がる歴史的な景観が楽しめます。" },
  { id: 61, name: "浅草寺",                  lat: 35.7148, lng: 139.7967, stamped: false, photo: null, defaultImage: "https://example.com/asakusa.jpg", prefecture: "東京都", description: "日本最古の寺院の一つで、東京を代表する史跡です。" },
  { id: 62, name: "上野恩賜公園",            lat: 35.7148, lng: 139.7770, stamped: false, photo: null, defaultImage: "https://example.com/ueno.jpg", prefecture: "東京都", description: "広大な公園内には歴史的な建造物や文化財が点在しています。" },
  { id: 63, name: "神田明神",                lat: 35.6910, lng: 139.7700, stamped: false, photo: null, defaultImage: "https://example.com/kanda.jpg", prefecture: "東京都", description: "古くから信仰を集める神社で、歴史的な文化財としても知られています。" },
  { id: 64, name: "日比谷公園",              lat: 35.6845, lng: 139.7630, stamped: false, photo: null, defaultImage: "https://example.com/hibiya.jpg", prefecture: "東京都", description: "都心に広がる公園で、歴史的な背景を持つスポットです。" },
  { id: 65, name: "丸の内歴史地区",          lat: 35.6812, lng: 139.7671, stamped: false, photo: null, defaultImage: "https://example.com/marunouchi.jpg", prefecture: "東京都", description: "近代東京の歴史が色濃く残るエリアです。" },
  { id: 66, name: "日本橋",                  lat: 35.6840, lng: 139.7745, stamped: false, photo: null, defaultImage: "https://example.com/nihonbashi.jpg", prefecture: "東京都", description: "東京の中心を流れる歴史ある橋。街の発展を支えた重要なランドマークです。" },
  { id: 67, name: "湯島天神",                lat: 35.7020, lng: 139.7570, stamped: false, photo: null, defaultImage: "https://example.com/yushima.jpg", prefecture: "東京都", description: "学問の神様を祀る神社で、古くから多くの人々に信仰されています。" },
  { id: 68, name: "千駄ヶ谷公園",            lat: 35.6910, lng: 139.7100, stamped: false, photo: null, defaultImage: "https://example.com/ sendagaya.jpg", prefecture: "東京都", description: "歴史的な背景を持つ公園で、都心のオアシスとして親しまれています。" },
  { id: 69, name: "台東区歴史文化センター周辺", lat: 35.7110, lng: 139.7960, stamped: false, photo: null, defaultImage: "https://example.com/taito.jpg", prefecture: "東京都", description: "台東区の歴史や文化に触れられるエリアです。" },
  { id: 70, name: "墨田区歴史民俗資料館周辺", lat: 35.7100, lng: 139.8100, stamped: false, photo: null, defaultImage: "https://example.com/sumida.jpg", prefecture: "東京都", description: "墨田区の歴史や民俗が学べる史跡エリアです。" },
  { id: 71, name: "丸の内史跡",            lat: 35.6800, lng: 139.7660, stamped: false, photo: null, defaultImage: "https://example.com/marunouchi2.jpg", prefecture: "東京都", description: "近代東京の発展を支えた歴史的な地域です。" },
  { id: 72, name: "神保町歴史地区",          lat: 35.6900, lng: 139.7600, stamped: false, photo: null, defaultImage: "https://example.com/jinbocho.jpg", prefecture: "東京都", description: "古書店街として有名な、歴史的な雰囲気の漂うエリアです。" },
  { id: 73, name: "湯島文京",              lat: 35.6970, lng: 139.7580, stamped: false, photo: null, defaultImage: "https://example.com/yushima2.jpg", prefecture: "東京都", description: "歴史的な文教地区として知られる、学問と文化の中心地です。" },
  { id: 74, name: "上野城跡",              lat: 35.7140, lng: 139.7750, stamped: false, photo: null, defaultImage: "https://example.com/ueno2.jpg", prefecture: "東京都", description: "上野恩賜公園内に点在する、城跡の一部としての史跡です。" },
  { id: 75, name: "日比谷の石垣跡",         lat: 35.6840, lng: 139.7650, stamped: false, photo: null, defaultImage: "https://example.com/hibiya2.jpg", prefecture: "東京都", description: "日比谷エリアに残る、江戸時代の石垣跡です。" },
  { id: 76, name: "大手町史跡",             lat: 35.6850, lng: 139.7620, stamped: false, photo: null, defaultImage: "https://example.com/ootecho.jpg", prefecture: "東京都", description: "大手町周辺の歴史的な建造物や跡地が集まるエリアです。" },
  { id: 77, name: "有楽町史跡",             lat: 35.6805, lng: 139.7635, stamped: false, photo: null, defaultImage: "https://example.com/yarakucho.jpg", prefecture: "東京都", description: "有楽町エリアに見られる歴史的なスポットです。" },
  { id: 78, name: "銀座城跡",              lat: 35.6710, lng: 139.7660, stamped: false, photo: null, defaultImage: "https://example.com/ginza.jpg", prefecture: "東京都", description: "銀座の一角に伝わる、城跡としての史跡です。（仮称）" },
  { id: 79, name: "日本橋城跡",            lat: 35.6845, lng: 139.7740, stamped: false, photo: null, defaultImage: "https://example.com/nihonbashi2.jpg", prefecture: "東京都", description: "日本橋周辺に伝わる、城跡としての歴史的スポットです。（仮称）" },
  { id: 80, name: "浅草城跡",              lat: 35.7115, lng: 139.7965, stamped: false, photo: null, defaultImage: "https://example.com/asakusa2.jpg", prefecture: "東京都", description: "浅草エリアに存在すると伝えられる、城跡の一部です。（仮称）" },
  { id: 81, name: "葛飾区歴史公園",          lat: 35.7600, lng: 139.8600, stamped: false, photo: null, defaultImage: "https://example.com/katsushika.jpg", prefecture: "東京都", description: "葛飾区内の歴史的な建造物跡を整備した史跡公園です。（仮称）" },
  { id: 82, name: "足立区歴史の森",          lat: 35.7800, lng: 139.8300, stamped: false, photo: null, defaultImage: "https://example.com/adachi.jpg", prefecture: "東京都", description: "足立区内に残る古い史跡や遺構を保存するエリアです。（仮称）" },
  { id: 83, name: "江東区城跡",             lat: 35.6500, lng: 139.8500, stamped: false, photo: null, defaultImage: "https://example.com/koto.jpg", prefecture: "東京都", description: "江東区内にある歴史的な城跡としての史跡です。（仮称）" },
  { id: 84, name: "品川区歴史跡",           lat: 35.6200, lng: 139.7300, stamped: false, photo: null, defaultImage: "https://example.com/shinagawa.jpg", prefecture: "東京都", description: "品川区の歴史あるエリアの一部を示す史跡です。（仮称）" },
  { id: 85, name: "目黒区史跡公園",          lat: 35.6400, lng: 139.7100, stamped: false, photo: null, defaultImage: "https://example.com/meguro.jpg", prefecture: "東京都", description: "目黒区内の古い建造物跡を保存した史跡公園です。（仮称）" },
  { id: 86, name: "世田谷区城跡",           lat: 35.6400, lng: 139.6500, stamped: false, photo: null, defaultImage: "https://example.com/setagaya.jpg", prefecture: "東京都", description: "世田谷区内に伝わる城跡を示す史跡です。（仮称）" },
  { id: 87, name: "中野区史跡",             lat: 35.7100, lng: 139.6700, stamped: false, photo: null, defaultImage: "https://example.com/nakano.jpg", prefecture: "東京都", description: "中野区内に残る歴史的建造物跡の一部です。（仮称）" },
  { id: 88, name: "杉並区史跡",             lat: 35.7000, lng: 139.6500, stamped: false, photo: null, defaultImage: "https://example.com/suginami.jpg", prefecture: "東京都", description: "杉並区内の伝統的な街並みや建造物跡を示す史跡です。（仮称）" },
  { id: 89, name: "練馬区古墳跡",           lat: 35.7400, lng: 139.6800, stamped: false, photo: null, defaultImage: "https://example.com/nerima.jpg", prefecture: "東京都", description: "練馬区に点在する古代遺跡の一部としての史跡です。（仮称）" },
  { id: 90, name: "町田市史跡",             lat: 35.5500, lng: 139.4500, stamped: false, photo: null, defaultImage: "https://example.com/machida.jpg", prefecture: "東京都", description: "町田市内の歴史的な民家群や城跡が見られる地域です。（仮称）" }
];

// マーカーの追加
castleSpots.forEach(spot => {
  let marker = L.marker([spot.lat, spot.lng], { icon: defaultIcon });
  marker.bindPopup(spot.name);
  spot.marker = marker;
  marker.on('click', function(){
    map.setView([spot.lat, spot.lng], 18);
    highlightedSpotId = spot.id;
    updateStampCard();
  });
  markers.addLayer(marker);
});
map.addLayer(markers);

// 認証・ユーザー関連関数
function 新規登録() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      user.updateProfile({ displayName: name }).then(() => {
        alert("新規登録成功: " + user.email);
        db.collection("users").doc(user.uid).set({
          displayName: name,
          totalPoints: 0,
          stampStatuses: {}
        });
        loadRanking();
      });
    })
    .catch((error) => { alert("エラー: " + error.message); });
}

function ログイン() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("ログイン成功: " + userCredential.user.email);
      loadUserData(userCredential.user.uid);
      loadRanking();
    })
    .catch((error) => { alert("エラー: " + error.message); });
}

function ログアウト() {
  auth.signOut().then(() => {
    alert("ログアウトしました");
    totalPoints = 0;
    castleSpots.forEach(spot => { 
      spot.stamped = false; 
      spot.stampTime = null; 
    });
    updatePointsDisplay();
    updateStampCard();
  }).catch((error) => { alert("エラー: " + error.message); });
}

// Firestoreからユーザーデータ読み込み
function loadUserData(uid) {
  db.collection("users").doc(uid).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      totalPoints = data.totalPoints || 0;
      if (data.stampStatuses) {
        castleSpots.forEach(spot => {
          if (data.stampStatuses[spot.id] !== undefined) {
            spot.stamped = data.stampStatuses[spot.id].stamped;
            spot.stampTime = data.stampStatuses[spot.id].stampTime ? new Date(data.stampStatuses[spot.id].stampTime) : null;
          }
        });
      }
      updatePointsDisplay();
      updateStampCard();
    }
  });
}

// Firestoreにユーザーデータ更新
function updateUserData() {
  const user = auth.currentUser;
  if (user) {
    let stampStatuses = {};
    castleSpots.forEach(spot => { 
      stampStatuses[spot.id] = { 
        stamped: spot.stamped, 
        stampTime: spot.stampTime ? spot.stampTime.toISOString() : null 
      }; 
    });
    db.collection("users").doc(user.uid).set({
      totalPoints: totalPoints,
      stampStatuses: stampStatuses
    }, { merge: true });
    loadRanking();
  }
}

// ランキング読み込み（上位10名を表示）
function loadRanking() {
  db.collection("users")
    .orderBy("totalPoints", "desc")
    .limit(10)
    .get()
    .then(querySnapshot => {
      let html = "";
      querySnapshot.forEach(doc => {
        const data = doc.data();
        html += "<div>" + data.displayName + " : " + (data.totalPoints || 0) + "ポイント</div>";
      });
      document.getElementById("rankingList").innerHTML = html;
    })
    .catch(error => {
      console.error("ランキング取得エラー: ", error);
    });
}

// 認証状態監視
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginStatus").innerText = "ログイン中: " + user.displayName;
    document.getElementById("authForm").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";
    loadUserData(user.uid);
    loadRanking();
  } else {
    document.getElementById("loginStatus").innerText = "未ログイン";
    document.getElementById("authForm").style.display = "block";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// ハンバーガーメニュー制御
function openMenu() { document.getElementById("hamburgerMenu").classList.add("active"); }
function closeMenu() { document.getElementById("hamburgerMenu").classList.remove("active"); }

// 地図の初期位置取得とサークル表示（固定50kmの薄い水色サークル）
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    userLocation = L.latLng(lat, lng);
    map.setView(userLocation, 18);
    currentLocationMarker = L.marker(userLocation, { icon: userIcon }).addTo(map);
    currentLocationMarker.bindPopup("あなたの現在地");
    // グラデーション風のサークル（薄い水色で半透明）
    userCircles.forEach(circle => { map.removeLayer(circle); });
    userCircles = [];
    userCircles.push(L.circle(userLocation, {
      radius: 50000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.1,
      stroke: false
    }).addTo(map));
    userCircles.push(L.circle(userLocation, {
      radius: 40000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.07,
      stroke: false
    }).addTo(map));
    userCircles.push(L.circle(userLocation, {
      radius: 30000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.05,
      stroke: false
    }).addTo(map));
    updateStampCard();
  }, error => {
    console.error("getCurrentPosition エラー: " + error.message);
  }, { enableHighAccuracy: true });
} else {
  console.error("Geolocation is not supported by this browser.");
}

// 現在地の連続更新（watchPosition）
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(position => {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    userLocation = L.latLng(lat, lng);
    if (currentLocationMarker) {
      currentLocationMarker.setLatLng(userLocation);
    }
    // サークルが存在している場合は全削除し再生成
    userCircles.forEach(circle => { map.removeLayer(circle); });
    userCircles = [];
    userCircles.push(L.circle(userLocation, {
      radius: 50000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.1,
      stroke: false
    }).addTo(map));
    userCircles.push(L.circle(userLocation, {
      radius: 40000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.07,
      stroke: false
    }).addTo(map));
    userCircles.push(L.circle(userLocation, {
      radius: 30000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.05,
      stroke: false
    }).addTo(map));
    updateStampCard();
  }, error => {
    console.error("watchPosition エラー: " + error.message);
  }, { enableHighAccuracy: true });
}

// 現在地表示ボタン
function locateUser() {
  if (userLocation) { map.setView(userLocation, 18); }
}

// 50km圏内チェック
function isWithinRange(spotLat, spotLng) {
  if (!userLocation) return false;
  return userLocation.distanceTo(L.latLng(spotLat, spotLng)) <= 50000;
}

function updatePointsDisplay() {
  document.getElementById('pointsDisplay').innerText = "総ポイント: " + totalPoints;
}

// スタンプカード更新：50km圏内の城のみ表示（グループ分け）、説明文と取得日時追加
function updateStampCard() {
  let stampCard = document.getElementById('stampCard');
  stampCard.innerHTML = "";
  let groups = {};
  castleSpots.forEach(spot => {
    if (isWithinRange(spot.lat, spot.lng)) {
      let pref = spot.prefecture || "その他";
      if (!groups[pref]) groups[pref] = [];
      groups[pref].push(spot);
    }
  });
  for (let pref in groups) {
    let groupDiv = document.createElement('div');
    groupDiv.className = "prefecture-group";
    let title = document.createElement('div');
    title.className = "prefecture-title";
    title.innerText = pref;
    groupDiv.appendChild(title);
    let cardContainer = document.createElement('div');
    cardContainer.className = "stamp-card";
    groups[pref].forEach(spot => {
      let stampItem = document.createElement('div');
      stampItem.id = "stamp-card-" + spot.id;
      stampItem.className = 'stamp-item' + (spot.stamped ? ' stamped' : '');
      if (spot.id === highlightedSpotId) { stampItem.classList.add("highlight"); }

       // サムネイル画像や説明文などを表示
      stampItem.innerHTML = `
        <img src="${spot.defaultImage}" class="default-image" alt="${spot.name}">
        <h3>${spot.name}</h3>
        <p class="castle-description">${spot.description}</p>
      `;

      if (spot.stamped && spot.stampTime) {
        stampItem.innerHTML += `
          <p class="stamp-time">
            獲得日時: ${spot.stampTime.toLocaleString("ja-JP")}
          </p>`;
      }
      
      let actionContainer = document.createElement('div');
      if (!userLocation || !isWithinRange(spot.lat, spot.lng)) {
        let btnOut = document.createElement('button');
        btnOut.className = 'stamp-button';
        btnOut.innerText = "圏外";
        btnOut.disabled = true;
        actionContainer.appendChild(btnOut);
      } else {
        if (!spot.stamped) {
          if (!spot.photo) {
            let photoBtn = document.createElement('button');
            photoBtn.className = 'stamp-button';
            photoBtn.innerText = "写真を撮る";
            let fileInput = document.createElement('input');
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.style.display = "none";
            photoBtn.onclick = function() { fileInput.click(); };
            fileInput.onchange = function(event) {
              if (event.target.files && event.target.files[0]) {
                let file = event.target.files[0];
                spot.photo = URL.createObjectURL(file);
                spot.photoFile = file;
                updateStampCard();
              }
            };
            actionContainer.appendChild(photoBtn);
            actionContainer.appendChild(fileInput);
          } else {
            let stampBtn = document.createElement('button');
            stampBtn.className = 'stamp-button';
            stampBtn.innerText = "スタンプ取得";
            stampBtn.onclick = function() {
              if (!spot.stamped) {
                spot.stamped = true;
                spot.stampTime = new Date();
                let pts = spot.points || 2;
                totalPoints += pts;
                updatePointsDisplay();
                alert(spot.name + "のスタンプを獲得しました！ " + pts + "ポイント獲得");
                spot.marker.setIcon(stampedIcon);
                updateStampCard();
                updateUserData();
              }
            };
            actionContainer.appendChild(stampBtn);
            let imgPreview = document.createElement('img');
            imgPreview.src = spot.photo;
            imgPreview.className = "preview-image";
            actionContainer.appendChild(imgPreview);
          }
        } else {
          let obtainedBtn = document.createElement('button');
          obtainedBtn.className = 'stamp-button';
          obtainedBtn.innerText = "獲得済み";
          obtainedBtn.disabled = true;
          actionContainer.appendChild(obtainedBtn);
          let shareBtn = document.createElement('button');
          shareBtn.className = 'stamp-button';
          shareBtn.innerText = "SNSでシェア";
          shareBtn.onclick = function() {
            if (navigator.share && spot.photoFile && navigator.canShare && navigator.canShare({ files: [spot.photoFile] })) {
              navigator.share({
                title: spot.name + "のスタンプ",
                text: spot.name + "のスタンプを獲得しました！",
                files: [spot.photoFile]
              }).then(() => console.log("Shared successfully"))
                .catch(error => console.log("Error sharing", error));
            } else {
              let text = encodeURIComponent(spot.name + "のスタンプを獲得しました！");
              let url = encodeURIComponent(window.location.href);
              window.open("https://twitter.com/intent/tweet?text=" + text + "&url=" + url, "_blank");
            }
          };
          actionContainer.appendChild(shareBtn);
          if (spot.photo) {
            let imgPreviewStamped = document.createElement('img');
            imgPreviewStamped.src = spot.photo;
            imgPreviewStamped.className = "preview-image";
            actionContainer.appendChild(imgPreviewStamped);
          }
        }
      }


       // ▼ ▼ ▼ ここからギャラリー追加 ▼ ▼ ▼
      // ダミー写真のURLをタイル状に並べる
      let galleryDiv = document.createElement('div');
      galleryDiv.className = "photo-gallery";

      dummyPhotoURLs.forEach((url) => {
        let thumb = document.createElement('img');
        thumb.src = url;
        thumb.className = "uploaded-photo";
        thumb.alt = "サンプル写真";
        // クリックで拡大表示
        thumb.onclick = function() {
          openPhotoModal(url);
        };
        galleryDiv.appendChild(thumb);
      });

      // アクションコンテナにギャラリーをまとめて追加
      actionContainer.appendChild(galleryDiv);
      // ▲ ▲ ▲ ここまでギャラリー追加 ▲ ▲ ▲

      
      stampItem.appendChild(actionContainer);
      cardContainer.appendChild(stampItem);
    });
    groupDiv.appendChild(cardContainer);
    stampCard.appendChild(groupDiv);
  }
}

// 写真を拡大表示するモーダルを開く関数
function openPhotoModal(imageUrl) {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  modalImage.src = imageUrl;
  modal.style.display = "block";
}

// モーダルを閉じる関数
function closePhotoModal(event) {
  // イベント元が画像や×ボタンではなく、モーダル背景そのものの場合も閉じる
  const modal = document.getElementById("photoModal");
  if (event.target.id === "photoModal" || event.target.id === "modalClose") {
    modal.style.display = "none";
  }
}


function updateUserData() {
  const user = auth.currentUser;
  if (user) {
    let stampStatuses = {};
    castleSpots.forEach(spot => { 
      stampStatuses[spot.id] = { 
        stamped: spot.stamped, 
        stampTime: spot.stampTime ? spot.stampTime.toISOString() : null 
      }; 
    });
    db.collection("users").doc(user.uid).set({
      totalPoints: totalPoints,
      stampStatuses: stampStatuses
    }, { merge: true });
    loadRanking();
  }
}

function loadRanking() {
  db.collection("users")
    .orderBy("totalPoints", "desc")
    .limit(10)
    .get()
    .then(querySnapshot => {
      let html = "";
      querySnapshot.forEach(doc => {
        const data = doc.data();
        html += "<div>" + data.displayName + " : " + (data.totalPoints || 0) + "ポイント</div>";
      });
      document.getElementById("rankingList").innerHTML = html;
    })
    .catch(error => {
      console.error("ランキング取得エラー: ", error);
    });
}

// 初回表示更新
updateStampCard();
updatePointsDisplay();

// 現在地表示ボタン
function locateUser() {
  if (userLocation) { map.setView(userLocation, 18); }
}

// 50km圏内チェック
function isWithinRange(spotLat, spotLng) {
  if (!userLocation) return false;
  return userLocation.distanceTo(L.latLng(spotLat, spotLng)) <= 50000;
}
