// firebase-config.js
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
const storage = firebase.storage();


// --- ここから一時的な移行スクリプト ---
async function migrateCastleSpotsToFirestore() {
    if (!db) {
        console.error("Firestore (db) is not initialized.");
        return;
    }
    console.log("Attempting to migrate castle spots..."); // 実行開始ログ

    const spotsToMigrate = [
  { id: 1,  name: "姫路城",     lat: 34.8394, lng: 134.6939,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "兵庫県", description: "この城は歴史的に重要な場所です。多くの伝説が語られています。", points: 2 },
  { id: 2,  name: "大阪城",     lat: 34.6873, lng: 135.5259,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "大阪府", description: "この城は壮大な天守閣で知られ、訪れる人々を魅了します。", points: 2 },
  { id: 3,  name: "名古屋城",   lat: 35.1850, lng: 136.9066,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛知県", description: "名古屋城は歴史と現代文化が交差する、重要な観光名所です。", points: 2 },
  { id: 4,  name: "熊本城",     lat: 32.8031, lng: 130.7079,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "熊本県", description: "熊本城はその美しい城郭と、災害からの復興で知られています。",  points: 2 },
  { id: 5,  name: "松本城",     lat: 36.2381, lng: 137.9681,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "長野県", description: "松本城は現存する国宝級の城郭で、その美しさが評価されています。" , points: 2 },
  { id: 6,  name: "弘前城",     lat: 40.6045, lng: 140.4637,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "青森県", description: "弘前城は桜の名所としても有名で、季節ごとの景観が楽しめます。",  points: 2 },
  { id: 7,  name: "二条城",     lat: 35.0214, lng: 135.7524,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "京都府", description: "二条城は古都京都の歴史を感じさせる、美しい建築物です。", points: 2 },
  { id: 8,  name: "松山城",     lat: 33.8394, lng: 132.7663,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛媛県", description: "松山城は高台に位置し、四国を一望できる絶景スポットです。", points: 2 },
  { id: 9,  name: "丸亀城",     lat: 34.2772, lng: 133.7593,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "香川県", description: "丸亀城は独特の風格を持つ、歴史ある城跡です。", points: 2 },
  { id: 10, name: "高知城",     lat: 33.5597, lng: 133.5311,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "高知県", description: "高知城は高知の中心に位置し、歴史と自然が融合した名城です。", points: 2 },
  { id: 11, name: "岡山城",     lat: 34.6551, lng: 133.9183,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "岡山県", description: "岡山城は美しい石垣と共に、多くの歴史的エピソードを持っています。", points: 2 },
  { id: 12, name: "金沢城",     lat: 36.5613, lng: 136.6562,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "石川県", description: "金沢城は兼六園とともに、金沢の歴史を彩る重要な遺産です。", points: 2 },
  { id: 13, name: "福山城",     lat: 34.4833, lng: 133.3640,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "広島県", description: "福山城はその歴史的価値と美しい景観で、観光客に人気です。",  points: 2 },
  { id: 14, name: "江戸城跡",   lat: 35.6852, lng: 139.7528,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城跡は江戸時代の栄華を偲ばせる、貴重な遺構です。", points: 2 },
  { id: 15, name: "敦賀城",     lat: 35.6000, lng: 135.2000,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "福井県", description: "敦賀城は海に近く、歴史と自然が感じられる美しい城跡です。", points: 2 },
  { id: 16, name: "伊賀上野城", lat: 34.7333, lng: 136.1833,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "三重県", description: "伊賀上野城は忍者の里としても有名で、歴史と伝説が息づいています。", points: 2 },
  { id: 17, name: "彦根城",     lat: 35.2753, lng: 136.1264,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "滋賀県", description: "彦根城は国宝に指定されている、優美な城郭です。", points: 2 },
  { id: 18, name: "松江城",     lat: 35.4667, lng: 133.0500,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "島根県", description: "松江城は日本で唯一現存する平山城の一つとして知られています。",  points: 2 },
  { id: 19, name: "宇和島城",   lat: 33.9833, lng: 132.7667,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛媛県", description: "宇和島城はその独特な立地と美しい景観が魅力です。",  points: 2 },
  { id: 20, name: "犬山城",     lat: 35.3250, lng: 136.9500,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛知県", description: "犬山城は国宝に指定された、日本最古の木造天守です。",  points: 2 },
  { id: 31, name: "表木城址",   lat: 35.7862008, lng: 137.9445543,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", points: 10, prefecture: "長野県", description: "作者の子供の頃の隠れ家兼遊び場。表木城址は特別な価値を持つ城跡として、10ポイントが設定されています。", points: 10 },
  { id: 41,  name: "皇居（旧江戸城跡）", lat: 35.6850, lng: 139.7528,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸時代の大名の居城であった江戸城跡。現在は皇居として整備されています。",  points: 2 },
  { id: 42,  name: "皇居本丸跡", lat: 35.6855, lng: 139.7535,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の中心部であった本丸跡。皇居の歴史的中核を成す場所です。",  points: 2 },
  { id: 43,  name: "皇居二の丸庭園", lat: 35.6860, lng: 139.7540,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城二の丸跡を利用した美しい庭園。歴史と緑が調和しています。",  points: 2 },
  { id: 44,  name: "皇居三の丸跡", lat: 35.6865, lng: 139.7545,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城三の丸の跡地。かつての城郭の威容を今に伝えます。",  points: 2 },
  { id: 45,  name: "皇居四の丸跡", lat: 35.6870, lng: 139.7550,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城四の丸跡。歴史的な城郭文化の象徴です。",  points: 2 },
  { id: 46,  name: "大手門跡", lat: 35.6875, lng: 139.7555,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の正門であった大手門跡。壮大な城門の面影が感じられます。",  points: 2 },
  { id: 47,  name: "二重橋", lat: 35.6880, lng: 139.7560,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居を象徴する美しい二重橋。東京のシンボルとして有名です。",  points: 2 },
  { id: 48,  name: "北の丸公園（旧江戸城北の丸跡）", lat: 35.6890, lng: 139.7570,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城北の丸跡を中心とした公園。歴史と自然が融合したエリアです。" ,points: 2 },
  { id: 49,  name: "東の丸跡", lat: 35.6895, lng: 139.7580,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の東の丸跡。城郭の一部としての歴史的価値があります。",  points: 2 },
  { id: 50, name: "西の丸跡", lat: 35.6900, lng: 139.7575,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の西の丸跡。歴史的建造物の面影が残ります。", points: 2 },
  { id: 51, name: "南の丸跡", lat: 35.6905, lng: 139.7570,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "旧江戸城の南の丸跡。城郭の広大な敷地の一部です。",  points: 2 },
  { id: 52, name: "内堀跡", lat: 35.6910, lng: 139.7565,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城内の堀跡。城内の防衛施設として重要でした。",  points: 2 },
  { id: 53, name: "外堀跡", lat: 35.6915, lng: 139.7560,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城外の堀跡。城郭全体の構造を理解する手がかりとなります。", points: 2 },
  { id: 54, name: "大手櫓跡", lat: 35.6920, lng: 139.7555,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の大手櫓跡。防衛の要として配置されていました。",  points: 2 },
  { id: 55, name: "二の櫓跡", lat: 35.6925, lng: 139.7550,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の二の櫓跡。城の守りを強化する施設でした。", points: 2 },
  { id: 56, name: "三の櫓跡", lat: 35.6930, lng: 139.7545,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の三の櫓跡。歴史的な防衛施設の一つです。",  points: 2 },
  { id: 57, name: "四の櫓跡", lat: 35.6935, lng: 139.7540,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の四の櫓跡。城の構造を示す重要な遺構です。",  points: 2 },
  { id: 58, name: "外櫓跡", lat: 35.6940, lng: 139.7535,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "江戸城の外櫓跡。外敵から城を守る役割を果たしました。",  points: 2 },
  { id: 59, name: "皇居東御苑", lat: 35.6950, lng: 139.7525,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居の東側に位置する御苑。歴史と自然が調和した美しい庭園です。",  points: 2 },
  { id: 60, name: "皇居外苑", lat: 35.6955, lng: 139.7520,  defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "東京都", description: "皇居の外苑。江戸城跡を背景に広がる歴史的な景観が楽しめます。",  points: 2 },
  { id: 61, name: "浅草寺", lat: 35.7148, lng: 139.7967,  defaultImage: "https://example.com/asakusa.jpg", prefecture: "東京都", description: "日本最古の寺院の一つで、東京を代表する史跡です。" , points: 2 },
  { id: 62, name: "上野恩賜公園", lat: 35.7148, lng: 139.7770,  defaultImage: "https://example.com/ueno.jpg", prefecture: "東京都", description: "広大な公園内には歴史的な建造物や文化財が点在しています。",  points: 2 },
  { id: 63, name: "神田明神", lat: 35.6910, lng: 139.7700,  defaultImage: "https://example.com/kanda.jpg", prefecture: "東京都", description: "古くから信仰を集める神社で、歴史的な文化財としても知られています。", points: 2 },
  { id: 64, name: "日比谷公園", lat: 35.6845, lng: 139.7630,  defaultImage: "https://example.com/hibiya.jpg", prefecture: "東京都", description: "都心に広がる公園で、歴史的な背景を持つスポットです。", points: 2 },
  { id: 65, name: "丸の内歴史地区", lat: 35.6812, lng: 139.7671,  defaultImage: "https://example.com/marunouchi.jpg", prefecture: "東京都", description: "近代東京の歴史が色濃く残るエリアです。",  points: 2 },
  { id: 66, name: "日本橋", lat: 35.6840, lng: 139.7745,  defaultImage: "https://example.com/nihonbashi.jpg", prefecture: "東京都", description: "東京の中心を流れる歴史ある橋。街の発展を支えた重要なランドマークです。",  points: 2 },
  { id: 67, name: "湯島天神", lat: 35.7020, lng: 139.7570,  defaultImage: "https://example.com/yushima.jpg", prefecture: "東京都", description: "学問の神様を祀る神社で、古くから多くの人々に信仰されています。" , points: 2 },
  { id: 68, name: "千駄ヶ谷公園", lat: 35.6910, lng: 139.7100,  defaultImage: "https://example.com/sendagaya.jpg", prefecture: "東京都", description: "歴史的な背景を持つ公園で、都心のオアシスとして親しまれています。", points: 2 },
  { id: 69, name: "台東区歴史文化センター周辺", lat: 35.7110, lng: 139.7960,  defaultImage: "https://example.com/taito.jpg", prefecture: "東京都", description: "台東区の歴史や文化に触れられるエリアです。",  points: 2 },
  { id: 70, name: "墨田区歴史民俗資料館周辺", lat: 35.7100, lng: 139.8100,  defaultImage: "https://example.com/sumida.jpg", prefecture: "東京都", description: "墨田区の歴史や民俗が学べる史跡エリアです。", points: 2 },
  { id: 71, name: "丸の内史跡", lat: 35.6800, lng: 139.7660,  defaultImage: "https://example.com/marunouchi2.jpg", prefecture: "東京都", description: "近代東京の発展を支えた歴史的な地域です。" , points: 2 },
  { id: 72, name: "神保町歴史地区", lat: 35.6900, lng: 139.7600,  defaultImage: "https://example.com/jinbocho.jpg", prefecture: "東京都", description: "古書店街として有名な、歴史的な雰囲気の漂うエリアです。",  points: 2 },
  { id: 73, name: "湯島文京", lat: 35.6970, lng: 139.7580,  defaultImage: "https://example.com/yushima2.jpg", prefecture: "東京都", description: "歴史的な文教地区として知られる、学問と文化の中心地です。", points: 2 },
  { id: 74, name: "上野城跡", lat: 35.7140, lng: 139.7750,  defaultImage: "https://example.com/ueno2.jpg", prefecture: "東京都", description: "上野恩賜公園内に点在する、城跡の一部としての史跡です。", points: 2 },
  { id: 75, name: "日比谷の石垣跡", lat: 35.6840, lng: 139.7650,  defaultImage: "https://example.com/hibiya2.jpg", prefecture: "東京都", description: "日比谷エリアに残る、江戸時代の石垣跡です。",  points: 2 },
  { id: 76, name: "大手町史跡", lat: 35.6850, lng: 139.7620,  defaultImage: "https://example.com/ootecho.jpg", prefecture: "東京都", description: "大手町周辺の歴史的な建造物や跡地が集まるエリアです。",  points: 2 },
  { id: 77, name: "有楽町史跡", lat: 35.6805, lng: 139.7635,  defaultImage: "https://example.com/yarakucho.jpg", prefecture: "東京都", description: "有楽町エリアに見られる歴史的なスポットです。",  points: 2 },
  { id: 78, name: "銀座城跡", lat: 35.6710, lng: 139.7660,  defaultImage: "https://example.com/ginza.jpg", prefecture: "東京都", description: "銀座の一角に伝わる、城跡としての史跡です。（仮称）",  points: 2 },
  { id: 79, name: "日本橋城跡", lat: 35.6845, lng: 139.7740,  defaultImage: "https://example.com/nihonbashi2.jpg", prefecture: "東京都", description: "日本橋周辺に伝わる、城跡としての歴史的スポットです。（仮称）",  points: 2 },
  { id: 80, name: "浅草城跡", lat: 35.7115, lng: 139.7965,  defaultImage: "https://example.com/asakusa2.jpg", prefecture: "東京都", description: "浅草エリアに存在すると伝えられる、城跡の一部です。（仮称）",  points: 2 },
  { id: 81, name: "葛飾区歴史公園", lat: 35.7600, lng: 139.8600,  defaultImage: "https://example.com/katsushika.jpg", prefecture: "東京都", description: "葛飾区内の歴史的な建造物跡を整備した史跡公園です。（仮称）",  points: 2 },
  { id: 82, name: "足立区歴史の森", lat: 35.7800, lng: 139.8300,  defaultImage: "https://example.com/adachi.jpg", prefecture: "東京都", description: "足立区内に残る古い史跡や遺構を保存するエリアです。（仮称）",  points: 2 },
  { id: 83, name: "江東区城跡", lat: 35.6500, lng: 139.8500,  defaultImage: "https://example.com/koto.jpg", prefecture: "東京都", description: "江東区内にある歴史的な城跡としての史跡です。（仮称）" , points: 2 },
  { id: 84, name: "品川区歴史跡", lat: 35.6200, lng: 139.7300,  defaultImage: "https://example.com/shinagawa.jpg", prefecture: "東京都", description: "品川区の歴史あるエリアの一部を示す史跡です。（仮称）",  points: 2 },
  { id: 85, name: "目黒区史跡公園", lat: 35.6400, lng: 139.7100,  defaultImage: "https://example.com/meguro.jpg", prefecture: "東京都", description: "目黒区内の古い建造物跡を保存した史跡公園です。（仮称）",  points: 2 },
  { id: 86, name: "世田谷区城跡", lat: 35.6400, lng: 139.6500,  defaultImage: "https://example.com/setagaya.jpg", prefecture: "東京都", description: "世田谷区内に伝わる城跡を示す史跡です。（仮称）" , points: 2 },
  { id: 87, name: "中野区史跡", lat: 35.7100, lng: 139.6700,  defaultImage: "https://example.com/nakano.jpg", prefecture: "東京都", description: "中野区内に残る歴史的建造物跡の一部です。（仮称）" , points: 2 },
  { id: 88, name: "杉並区史跡", lat: 35.7000, lng: 139.6500,  defaultImage: "https://example.com/suginami.jpg", prefecture: "東京都", description: "杉並区内の伝統的な街並みや建造物跡を示す史跡です。（仮称）",  points: 2 },
  { id: 89, name: "練馬区古墳跡", lat: 35.7400, lng: 139.6800,  defaultImage: "https://example.com/nerima.jpg", prefecture: "東京都", description: "練馬区に点在する古代遺跡の一部としての史跡です。（仮称）",  points: 2 },
  { id: 90, name: "ルビーの里 エクステリアガーデン", lat: 35.7048771, lng: 137.9268813,  defaultImage: "https://assets.st-note.com/production/uploads/images/120566836/rectangle_large_type_2_db692b996219eb34650cef420635a31b.png", prefecture: "長野県", description: "弊社工場に隣接するオーニング展示場を、公園として開放しています。赤ソバ畑をはじめ、四季折々の花々をお楽しみいただける憩いの空間です。", points: 2 },
  { id: 91, name: "ルビーの里 駒ヶ岳ガーデン", lat: 35.7496853, lng: 137.9041551,  defaultImage: "https://assets.st-note.com/production/uploads/images/120573954/rectangle_large_type_2_0cea5b992f48da3b63c53d7d10ab9a55.png", prefecture: "長野県", description: "中央アルプス西駒ケ岳山麓。カラマツやシラカバに囲まれ、赤い花のソバが幻想的に咲いています。この一帯は「アサギマダラの里」や「こもれ陽の径」とも隣接する貴重な里山林で、散策をお楽しみいただけます。" , points: 2 },
  { id: 92, name: "タカノ株式会社", lat: 35.7694623, lng: 137.9416554,  defaultImage: "https://www.takano-net.co.jp/image/portal/branches/honsya.jpg", prefecture: "長野県", description: "製造業から「創造業」へばねの製造に始まり、オフィスチェア・エクステリア製品へ。そして、先進のエレクトロニクス関連事業、さらには今後需要の拡大が見込まれる福祉・医療機器関連事業への参入を実現し、常に新しい製品の開発にチャレンジしてまいりました。", points: 2 },
  { id: 93, name: "町田市史跡", lat: 35.5500, lng: 139.4500,  defaultImage: "https://example.com/machida.jpg", prefecture: "東京都", description: "町田市内の歴史的な民家群や城跡が見られる地域です。（仮称）" , points: 2 }
    ];

    if (spotsToMigrate.length === 0) {
        console.warn("No spots data provided in spotsToMigrate array.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    spotsToMigrate.forEach(spot => {
        if (spot.id === undefined || spot.name === undefined) {
            console.warn("Skipping spot due to missing id or name:", spot);
            return;
        }
        const spotIdStr = String(spot.id);
        const spotRef = db.collection("castleSpots").doc(spotIdStr);

        const spotData = {
            id: spot.id,
            name: spot.name,
            lat: spot.lat,
            lng: spot.lng,
            prefecture: spot.prefecture || "未分類",
            description: spot.description || "説明がありません。",
            defaultImage: spot.defaultImage || null,
            points: spot.points || 2
        };
        batch.set(spotRef, spotData);
        count++;
    });

    if (count === 0) {
        console.warn("No valid spots were prepared for batch commit.");
        return;
    }

    try {
        await batch.commit();
        console.log(`${count} castle spots data successfully migrated to Firestore!`);
    } catch (error) {
        console.error("Error migrating castle spots data: ", error);
    }
}
// --- 一時的な移行スクリプトここまで ---
