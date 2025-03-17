// stampCard.js

// Firebase Storage を利用した写真アップロード
function uploadPhoto(spot, file) {
  const user = auth.currentUser;
  if (!user) {
    alert("ログインしてください");
    return Promise.reject("Not logged in");
  }
  const storageRef = storage.ref();
  const filePath = `castlePhotos/${user.uid}/${spot.id}/${Date.now()}_${file.name}`;
  const fileRef = storageRef.child(filePath);
  return fileRef.put(file)
    .then(snapshot => snapshot.ref.getDownloadURL());
}
// ダミーの写真 URL 配列（グローバル変数として定義）
const dummyPhotoURLs = [
  "https://assets.st-note.com/production/uploads/images/120566836/rectangle_large_type_2_db692b996219eb34650cef420635a31b.png",
  "https://assets.st-note.com/production/uploads/images/120573954/rectangle_large_type_2_0cea5b992f48da3b63c53d7d10ab9a55.png",
  "https://assets.st-note.com/production/uploads/images/120574983/rectangle_large_type_2_564d6de6b67df4446f5a6d961307c928.png",
  "https://assets.st-note.com/production/uploads/images/120581790/rectangle_large_type_2_7c324d27068cba23cd8948fbd9e8d163.png",
  "https://assets.st-note.com/production/uploads/images/120591518/rectangle_large_type_2_ce36d3920374d82d2cd1641dfca48857.png"
];

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
      if (spot.id === highlightedSpotId) { 
        stampItem.classList.add("highlight");
      }
      // 城名と説明文を表示（ダミー画像は使用せず、アップロードされた写真のみ表示）
      stampItem.innerHTML = '<h3>' + spot.name + '</h3>' +
                            '<p class="castle-description">' + spot.description + '</p>';
      
      // 写真ギャラリー
      let galleryDiv = document.createElement('div');
      galleryDiv.className = "photo-gallery";
      if (!spot.uploadedPhotos) {
        spot.uploadedPhotos = [];
      }
      spot.uploadedPhotos.forEach(photoUrl => {
        let img = document.createElement('img');
        img.src = photoUrl;
        img.className = "uploaded-photo";
        galleryDiv.appendChild(img);
      });
      stampItem.appendChild(galleryDiv);
      
      let actionContainer = document.createElement('div');
      if (!userLocation || !isWithinRange(spot.lat, spot.lng)) {
        let btnOut = document.createElement('button');
        btnOut.className = 'stamp-button';
        btnOut.innerText = "圏外";
        btnOut.disabled = true;
        actionContainer.appendChild(btnOut);
      } else {
        // 写真アップロードボタン（Firebase Storage は使わず、ダミー画像をランダムに設定）
        let uploadBtn = document.createElement('button');
        uploadBtn.className = 'stamp-button';
        uploadBtn.innerText = "写真アップロード";
        uploadBtn.onclick = function() {
          // ダミー画像 URL をランダムに選択
          let randomIndex = Math.floor(Math.random() * dummyPhotoURLs.length);
          let dummyURL = dummyPhotoURLs[randomIndex];
          spot.uploadedPhotos.push(dummyURL);
          updateStampCard();
          updateUserData();
        };
        actionContainer.appendChild(uploadBtn);
      }
      stampItem.appendChild(actionContainer);
      cardContainer.appendChild(stampItem);
    });
    groupDiv.appendChild(cardContainer);
    stampCard.appendChild(groupDiv);
  }
}


function updatePointsDisplay() {
  document.getElementById('pointsDisplay').innerText = "総ポイント: " + totalPoints;
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

function updatePointsDisplayAndStampCard() {
  updatePointsDisplay();
  updateStampCard();
}

// 初回表示更新
updateStampCard();
updatePointsDisplay();
