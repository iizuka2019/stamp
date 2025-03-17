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
      // 城名と説明文を表示（defaultImage は削除）
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
        // 写真アップロードボタン
        let uploadBtn = document.createElement('button');
        uploadBtn.className = 'stamp-button';
        uploadBtn.innerText = "写真アップロード";
        let fileInput = document.createElement('input');
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";
        uploadBtn.onclick = function() { fileInput.click(); };
        fileInput.onchange = function(event) {
          if (event.target.files && event.target.files[0]) {
            let file = event.target.files[0];
            uploadPhoto(spot, file)
              .then(downloadURL => {
                spot.uploadedPhotos.push(downloadURL);
                updateStampCard();
                updateUserData();
              })
              .catch(error => {
                console.error("Upload error: ", error);
                alert("写真のアップロードに失敗しました");
              });
          }
        };
        actionContainer.appendChild(uploadBtn);
        actionContainer.appendChild(fileInput);
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
