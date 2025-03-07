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
  { id: 1,  name: "姫路城",   lat: 34.8394, lng: 134.6939, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "兵庫県", description: "この城は歴史的に重要な場所です。多くの伝説が語られています。" },
  { id: 2,  name: "大阪城",   lat: 34.6873, lng: 135.5259, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "大阪府", description: "この城は壮大な天守閣で知られ、訪れる人々を魅了します。" },
  { id: 3,  name: "名古屋城", lat: 35.1850, lng: 136.9066, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "愛知県", description: "名古屋城は歴史と現代文化が交差する、重要な観光名所です。" },
  { id: 4,  name: "熊本城",   lat: 32.8031, lng: 130.7079, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "熊本県", description: "熊本城はその美しい城郭と、災害からの復興で知られています。" },
  { id: 5,  name: "松本城",   lat: 36.2381, lng: 137.9681, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", prefecture: "長野県", description: "松本城は現存する国宝級の城郭で、その美しさが評価されています。" },
  // ... 他の城データ（同様に記述）...
  { id: 31, name: "表木城址", lat: 35.7861114, lng: 137.874874, stamped: false, photo: null, defaultImage: "https://gigaplus.makeshop.jp/hw2019/images/pages/page2/takane_img06.jpg", points: 10, prefecture: "岐阜県", description: "表木城址は特別な価値を持つ城跡として、10ポイントが設定されています。" }
];

// マーカーの追加
castleSpots.forEach(spot => {
  let marker = L.marker([spot.lat, spot.lng], {icon: defaultIcon});
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

// 認証系の関数
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
    castleSpots.forEach(spot => { spot.stamped = false; spot.stampTime = null; });
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
    }
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

// スタンプカード更新：50km圏内の城のみ表示（グループ分け）
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
            if (navigator.share && spot.photoFile && navigator.canShare && navigator.canShare({files: [spot.photoFile]})) {
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
