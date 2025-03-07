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
let userCircle = null;
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
  // ...（他の城データも同様に追加してください）...
  { id: 31, name: "表木城址",   lat: 35.7861114, lng: 137.874874, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", points: 10, prefecture: "岐阜県", description: "表木城址は特別な価値を持つ城跡として、10ポイントが設定されています。" }
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
    userCircle = L.circle(userLocation, {
      radius: 50000,
      color: '#a2d9ff',
      fillColor: '#a2d9ff',
      fillOpacity: 0.1,
      stroke: false
    }).addTo(map);
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
    if (userCircle) {
      userCircle.setLatLng(userLocation);
    } else {
      // サークルが存在しなければ再生成
      userCircle = L.circle(userLocation, {
        radius: 50000,
        color: '#a2d9ff',
        fillColor: '#a2d9ff',
        fillOpacity: 0.1,
        stroke: false
      }).addTo(map);
    }
    updateStampCard();
  }, error => {
    console.error("watchPosition エラー: " + error.message);
  }, { enableHighAccuracy: true });
}

// 現在地表示ボタン
function locateUser() {
  if (userLocation) {
    map.setView(userLocation, 18);
  }
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
      stampItem.innerHTML = '<img src="' + spot.defaultImage + '" class="default-image" alt="' + spot.name + '"><h3>' + spot.name + '</h3>' +
                            '<p class="castle-description">' + spot.description + '</p>';
      if (spot.stamped && spot.stampTime) {
        stampItem.innerHTML += '<p class="stamp-time">獲得日時: ' + spot.stampTime.toLocaleString("ja-JP") + '</p>';
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
      stampItem.appendChild(actionContainer);
      cardContainer.appendChild(stampItem);
    });
    groupDiv.appendChild(cardContainer);
    stampCard.appendChild(groupDiv);
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
