// stampCard.js

// スポットごとに投稿された全写真を読み込む関数
function loadAllPhotosForSpot(spot) {
  // すでに写真がロードされている場合はスキップ
  if (spot.uploadedPhotos && spot.uploadedPhotos.length > 0) return Promise.resolve();
  
  return db.collection("spotPhotos")
    .where("spotId", "==", spot.id)
    .limit(10) // 表示する写真数を制限
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) return;
      
      if (!spot.uploadedPhotos) spot.uploadedPhotos = [];
      
      querySnapshot.forEach(doc => {
        const photoData = doc.data();
        if (photoData.photoUrl) {
          spot.uploadedPhotos.push(photoData.photoUrl);
        }
      });
    })
    .catch(error => {
      console.error(`スポット${spot.id}の写真読み込みエラー:`, error);
    });
}

// Firebase Storage を利用した写真アップロード
function uploadPhoto(spot, file) {
  const user = auth.currentUser;
  if (!user) {
    alert("写真アップロードにはログインが必要です。");
    return Promise.reject("Not logged in");
  }
  const filePath = `castlePhotos/${user.uid}/${spot.id}/${Date.now()}_${file.name}`;
  const fileRef = storage.ref().child(filePath);

  return fileRef.put(file)
    .then(snapshot => {
      console.log('ファイルのアップロード完了!', snapshot);
      return snapshot.ref.getDownloadURL();
    })
    .then(downloadURL => {
      console.log('ファイルのURL:', downloadURL);
      
      // ユーザーデータに写真URLを追加
      if (!spot.uploadedPhotos) spot.uploadedPhotos = [];
      spot.uploadedPhotos.push(downloadURL);
      
      // 公開コレクションにも写真データを保存
      return db.collection("spotPhotos").add({
        spotId: spot.id,
        userId: user.uid,
        photoUrl: downloadURL,
        uploadTime: firebase.firestore.FieldValue.serverTimestamp(),
        spotName: spot.name
      }).then(() => {
        return downloadURL;
      });
    })
    .catch(error => {
      console.error("アップロード失敗:", error);
      alert("写真のアップロードに失敗しました: " + error.message);
      return Promise.reject(error);
    });
}

async function updateStampCard() {
  console.log("updateStampCard called. User location:", userLocation, "Total spots from global:", castleSpots.length);
  let stampCardContainer = document.getElementById('stampCard');
  if (!stampCardContainer) {
      console.error("Stamp card container not found!");
      return;
  }
  stampCardContainer.innerHTML = ""; // コンテナをクリア
  let groups = {};
  let spotsAvailable = false;

  if (!castleSpots || castleSpots.length === 0) {
      stampCardContainer.innerHTML = "<p style='text-align:center;'>城データがまだ読み込まれていません。少々お待ちください...</p>";
      // データ読み込みを促すか、リトライ処理を検討
      // もし map.js の loadCastleSpotsFromFirestore がまだ終わっていない場合、この状態になる可能性がある
      // 再度 loadCastleSpotsFromFirestore を呼び出すか、それが完了するのを待つ仕組みが必要かもしれない
      // (ただし、通常は map.js の初期化フローで解決されるはず)
      console.warn("castleSpots array is empty or not yet loaded in updateStampCard.");
      return;
  }

  // 表示する前に各スポットの写真を読み込む
  const photoLoadPromises = castleSpots.map(spot => loadAllPhotosForSpot(spot));
  await Promise.all(photoLoadPromises);

  castleSpots.forEach(spot => {
    let pref = spot.prefecture || "その他";
    if (!groups[pref]) groups[pref] = [];
    groups[pref].push(spot);
  });
  
  for (let pref in groups) {
    if (groups[pref].length === 0) continue;
    spotsAvailable = true;

    let groupDiv = document.createElement('div');
    groupDiv.className = "prefecture-group";
    
    let title = document.createElement('h2');
    title.className = "prefecture-title";
    title.innerText = pref;
    groupDiv.appendChild(title);
    
    let cardInnerContainer = document.createElement('div');
    cardInnerContainer.className = "stamp-card";

    groups[pref].forEach(spot => {
      let stampItem = document.createElement('div');
      stampItem.id = "stamp-card-" + spot.id;
      stampItem.className = 'stamp-item' + (spot.stamped ? ' stamped' : '');
      if (spot.id === highlightedSpotId) { 
        stampItem.classList.add("highlight");
      }

      let contentHTML = `<h3>${spot.name}</h3>`;

      // 画像表示ロジック: アップロード写真があればそれを優先、なければdefaultImage
      if (!(spot.uploadedPhotos && spot.uploadedPhotos.length > 0) && spot.defaultImage) {
          contentHTML += `<img src="${spot.defaultImage}" alt="${spot.name}のデフォルト画像" class="default-image">`;
      }
      
      contentHTML += `<p class="castle-description">${spot.description || '説明がありません。'}</p>`; // 説明がない場合のフォールバック
      
      if (spot.stamped && spot.stampTime) {
        contentHTML += `<p class="stamp-time">獲得日時: ${new Date(spot.stampTime).toLocaleString("ja-JP")}</p>`;
      }
      stampItem.innerHTML = contentHTML;
      
      // 写真ギャラリー (アップロードされた写真があれば表示)
      if (spot.uploadedPhotos && spot.uploadedPhotos.length > 0) {
        let galleryDiv = document.createElement('div');
        galleryDiv.className = "photo-gallery";
        spot.uploadedPhotos.forEach(photoUrl => {
          let img = document.createElement('img');
          img.src = photoUrl;
          img.className = "uploaded-photo";
          img.alt = `${spot.name} の写真`;
          img.onclick = () => openPhotoModal(photoUrl);
          galleryDiv.appendChild(img);
        });
        stampItem.appendChild(galleryDiv);
      }
      
      let actionContainer = document.createElement('div');
      actionContainer.className = 'action-container';

      const inRange = userLocation && typeof isWithinRange === 'function' && isWithinRange(spot.lat, spot.lng);

      if (!spot.stamped) {
        let stampBtn = document.createElement('button');
        stampBtn.className = 'stamp-button';
        stampBtn.innerText = "スタンプ取得";
        stampBtn.disabled = !inRange;
        if (!inRange) stampBtn.title = "スタンプ取得はスポットの50km圏内で行えます。";
        
        stampBtn.onclick = function() {
          if (!auth.currentUser) {
            alert("スタンプ取得にはログインが必要です。");
            if(typeof openMenu === 'function') openMenu();
            return;
          }
          if (spot.stamped) {
            alert(spot.name + "のスタンプは既に獲得済みです。");
            return;
          }
          spot.stamped = true;
          spot.stampTime = new Date(); // Dateオブジェクトを直接格納
          let pts = spot.points || 2;
          totalPoints += pts;
          alert(spot.name + "のスタンプを獲得しました！ " + pts + "ポイント獲得");
          
          if(spot.marker) spot.marker.setIcon(stampedIcon);
          
          updatePointsDisplay();
          updateStampCard(); 
          updateUserData(); 
        };
        actionContainer.appendChild(stampBtn);
      } else {
        let obtainedBtn = document.createElement('button');
        obtainedBtn.className = 'stamp-button stamped-btn';
        obtainedBtn.innerText = "獲得済み";
        obtainedBtn.disabled = true;
        actionContainer.appendChild(obtainedBtn);
      }

      let fileInputId = `file-upload-${spot.id}`;
      let fileInput = document.createElement('input');
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.id = fileInputId;
      fileInput.style.display = "none";

      let uploadLabel = document.createElement('label');
      uploadLabel.htmlFor = fileInputId;
      uploadLabel.className = 'file-upload-label stamp-button';
      uploadLabel.innerText = "写真アップロード";
      if(!inRange) {
        uploadLabel.style.backgroundColor = "#ccc";
        uploadLabel.style.cursor = "not-allowed";
        uploadLabel.title = "写真アップロードはスポットの50km圏内で行えます。";
      }

      fileInput.onchange = function(event) {
        if (!auth.currentUser) {
          alert("写真アップロードにはログインが必要です。");
          if(typeof openMenu === 'function') openMenu();
          return;
        }
        if (!inRange) {
            alert("写真アップロードはスポットの50km圏内でのみ可能です。");
            event.target.value = ''; // ファイル選択をリセット
            return;
        }
        const file = event.target.files[0];
        if (file) {
          uploadLabel.innerText = "アップロード中...";
          uploadLabel.style.pointerEvents = "none"; // 連打防止
          uploadLabel.style.opacity = "0.7";

          uploadPhoto(spot, file).then(downloadURL => {
            if (!spot.uploadedPhotos) spot.uploadedPhotos = [];
            spot.uploadedPhotos.push(downloadURL);
            
            let photoPoints = 1;
            totalPoints += photoPoints;
            alert(`${spot.name} の写真アップロードで ${photoPoints} ポイント獲得！`);

            updateStampCard(); 
            updateUserData(); 
            updatePointsDisplay();
          }).catch(error => {
            console.error("Upload process failed for spot " + spot.id, error);
            alert("写真のアップロードに失敗しました。");
          }).finally(() => {
            uploadLabel.innerText = "写真アップロード";
            uploadLabel.style.pointerEvents = "auto";
            uploadLabel.style.opacity = "1";
            event.target.value = ''; // ファイル選択をリセット
          });
        }
      };
      actionContainer.appendChild(fileInput);
      actionContainer.appendChild(uploadLabel);
      
      stampItem.appendChild(actionContainer);
      cardInnerContainer.appendChild(stampItem);
    });
    groupDiv.appendChild(cardInnerContainer);
    stampCardContainer.appendChild(groupDiv);
  }
  if (!spotsAvailable) {
      stampCardContainer.innerHTML = "<p style='text-align:center;'>表示できる城がありません。地図を移動するか、範囲内に城があるか確認してください。</p>";
  }
}

function updatePointsDisplay() {
  const pointsEl = document.getElementById('pointsDisplay');
  if (pointsEl) {
    pointsEl.innerText = "総ポイント: " + totalPoints;
  }
}

function updateUserData() {
  const user = auth.currentUser;
  if (user) {
    let stampStatuses = {};
    castleSpots.forEach(spot => { 
      stampStatuses[spot.id] = { 
        stamped: spot.stamped, 
        stampTime: spot.stampTime ? spot.stampTime.toISOString() : null, // FirestoreにはISO文字列で保存
        uploadedPhotos: spot.uploadedPhotos || []
      }; 
    });
    db.collection("users").doc(user.uid).set({
      displayName: user.displayName,
      totalPoints: totalPoints,
      stampStatuses: stampStatuses
    }, { merge: true })
    .then(() => {
        console.log("User data successfully updated in Firestore for UID: ", user.uid);
        loadRanking();
    })
    .catch((error) => {
        console.error("Error updating user data: ", error);
    });
  } else {
    console.log("User not logged in, cannot update user data.");
  }
}

function loadRanking() {
  const rankingListEl = document.getElementById("rankingList");
  if (!rankingListEl) return;

  rankingListEl.innerHTML = "ランキング読み込み中...";
  db.collection("users")
    .orderBy("totalPoints", "desc")
    .limit(10)
    .get()
    .then(querySnapshot => {
      let html = "";
      if (querySnapshot.empty) {
        html = "<div>まだランキングデータがありません。</div>";
      } else {
        querySnapshot.forEach((doc, index) => {
          const data = doc.data();
          const displayName = data.displayName || "名無しさん";
          html += `<div>${index + 1}. ${displayName} : ${data.totalPoints || 0}ポイント</div>`;
        });
      }
      rankingListEl.innerHTML = html;
    })
    .catch(error => {
      console.error("ランキング取得エラー: ", error);
      rankingListEl.innerHTML = "ランキングの読み込みに失敗しました。";
    });
}

function updatePointsDisplayAndStampCard() {
  updatePointsDisplay();
  updateStampCard();
}

function openPhotoModal(imageUrl) {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  if (modal && modalImage) {
    modalImage.src = imageUrl;
    modal.classList.add("show");
  }
}

function closePhotoModal(event) {
  const modal = document.getElementById("photoModal");
  if (modal && (event.target.id === "photoModal" || event.target.classList.contains("modal-close"))) {
    modal.classList.remove("show");
    const modalImage = document.getElementById("modalImage");
    if(modalImage) modalImage.src = ""; 
  }
}

// 初回呼び出しは auth.js の onAuthStateChanged や map.js の DOMContentLoaded で制御されるため、
// ここでの直接呼び出しは不要な場合が多い。
// updatePointsDisplayAndStampCard();
