// stampCard.js

// Firebase Storage を利用した写真アップロード
function uploadPhoto(spot, file) {
  const user = auth.currentUser;
  if (!user) {
    alert("写真アップロードにはログインが必要です。");
    return Promise.reject("Not logged in");
  }
  // ユニークなファイル名生成（ユーザーID/スポットID/タイムスタンプ_元のファイル名）
  const filePath = `castlePhotos/${user.uid}/${spot.id}/${Date.now()}_${file.name}`;
  const fileRef = storage.ref().child(filePath);

  return fileRef.put(file)
    .then(snapshot => {
      console.log('Uploaded a blob or file!', snapshot);
      return snapshot.ref.getDownloadURL();
    })
    .then(downloadURL => {
      console.log('File available at', downloadURL);
      return downloadURL;
    })
    .catch(error => {
      console.error("Upload failed:", error);
      alert("写真のアップロードに失敗しました: " + error.message);
      return Promise.reject(error);
    });
}


function updateStampCard() {
  let stampCardContainer = document.getElementById('stampCard');
  stampCardContainer.innerHTML = ""; // コンテナをクリア
  let groups = {};

  castleSpots.forEach(spot => {
    // isWithinRange のチェックはここでは行わず、ボタンの有効/無効制御に使う
    // if (isWithinRange(spot.lat, spot.lng)) { 
      let pref = spot.prefecture || "その他";
      if (!groups[pref]) groups[pref] = [];
      groups[pref].push(spot);
    // }
  });

  // 都道府県の表示順を固定したい場合は、キーの配列を定義してソートする
  // const prefectureOrder = ["東京都", "神奈川県", ... , "その他"];
  // Object.keys(groups).sort((a,b) => prefectureOrder.indexOf(a) - prefectureOrder.indexOf(b)).forEach(pref => { ... });
  
  for (let pref in groups) {
    if (groups[pref].length === 0) continue; // スポットがない場合はスキップ

    let groupDiv = document.createElement('div');
    groupDiv.className = "prefecture-group";
    
    let title = document.createElement('h2'); // h2に変更
    title.className = "prefecture-title";
    title.innerText = pref;
    groupDiv.appendChild(title);
    
    let cardInnerContainer = document.createElement('div');
    cardInnerContainer.className = "stamp-card"; // stamp-card は内側のコンテナ名として使用

    groups[pref].forEach(spot => {
      let stampItem = document.createElement('div');
      stampItem.id = "stamp-card-" + spot.id;
      stampItem.className = 'stamp-item' + (spot.stamped ? ' stamped' : '');
      if (spot.id === highlightedSpotId) { 
        stampItem.classList.add("highlight");
      }

      let contentHTML = `<h3>${spot.name}</h3>`;
      if (spot.defaultImage) {
        contentHTML += `<img src="${spot.defaultImage}" alt="${spot.name}のデフォルト画像" class="default-image">`;
      }
      contentHTML += `<p class="castle-description">${spot.description}</p>`;
      
      if (spot.stamped && spot.stampTime) {
        contentHTML += `<p class="stamp-time">獲得日時: ${spot.stampTime.toLocaleString("ja-JP")}</p>`;
      }
      stampItem.innerHTML = contentHTML;
      
      // 写真ギャラリー
      let galleryDiv = document.createElement('div');
      galleryDiv.className = "photo-gallery";
      if (!spot.uploadedPhotos) spot.uploadedPhotos = []; // 初期化

      spot.uploadedPhotos.forEach(photoUrl => {
        let img = document.createElement('img');
        img.src = photoUrl;
        img.className = "uploaded-photo";
        img.alt = `${spot.name} の写真`;
        img.onclick = () => openPhotoModal(photoUrl);
        galleryDiv.appendChild(img);
      });
      stampItem.appendChild(galleryDiv);
      
      let actionContainer = document.createElement('div');
      actionContainer.className = 'action-container'; // スタイル付け用

      const inRange = userLocation && isWithinRange(spot.lat, spot.lng);

      if (!spot.stamped) {
        // スタンプボタン
        let stampBtn = document.createElement('button');
        stampBtn.className = 'stamp-button';
        stampBtn.innerText = "スタンプ取得";
        stampBtn.disabled = !inRange;
        if (!inRange) stampBtn.title = "スタンプ取得はスポットの50km圏内で行えます。";
        
        stampBtn.onclick = function() {
          if (!auth.currentUser) {
            alert("スタンプ取得にはログインが必要です。");
            openMenu(); // メニューを開いてログインを促す
            return;
          }
          if (spot.stamped) {
            alert(spot.name + "のスタンプは既に獲得済みです。");
            return;
          }
          spot.stamped = true;
          spot.stampTime = new Date();
          let pts = spot.points || 2; // デフォルト2ポイント
          totalPoints += pts;
          alert(spot.name + "のスタンプを獲得しました！ " + pts + "ポイント獲得");
          
          if(spot.marker) spot.marker.setIcon(stampedIcon);
          
          updatePointsDisplay();
          updateStampCard(); // カード表示を即時更新
          updateUserData(); // Firestore更新
        };
        actionContainer.appendChild(stampBtn);
      } else {
        let obtainedBtn = document.createElement('button');
        obtainedBtn.className = 'stamp-button stamped-btn'; // 別クラスでスタイル調整も可能
        obtainedBtn.innerText = "獲得済み";
        obtainedBtn.disabled = true;
        actionContainer.appendChild(obtainedBtn);
      }


      // 写真アップロードボタン
      let fileInputId = `file-upload-${spot.id}`;
      let fileInput = document.createElement('input');
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.id = fileInputId;
      fileInput.style.display = "none"; // input自体は隠す

      let uploadLabel = document.createElement('label');
      uploadLabel.htmlFor = fileInputId;
      uploadLabel.className = 'file-upload-label stamp-button'; // stamp-buttonのスタイルを流用
      uploadLabel.innerText = "写真アップロード";
      if(!inRange) { // 圏外なら非活性に見せる（実際は押せるが、処理側で制御）
        uploadLabel.style.backgroundColor = "#ccc";
        uploadLabel.style.cursor = "not-allowed";
        uploadLabel.title = "写真アップロードはスポットの50km圏内で行えます。";
      }


      fileInput.onchange = function(event) {
        if (!auth.currentUser) {
          alert("写真アップロードにはログインが必要です。");
          openMenu();
          return;
        }
        if (!inRange) {
            alert("写真アップロードはスポットの50km圏内でのみ可能です。");
            return;
        }
        const file = event.target.files[0];
        if (file) {
          uploadLabel.innerText = "アップロード中...";
          uploadLabel.disabled = true;
          uploadPhoto(spot, file).then(downloadURL => {
            if (!spot.uploadedPhotos) spot.uploadedPhotos = [];
            spot.uploadedPhotos.push(downloadURL);
            
            // 写真アップロードでポイント追加 (例: 1ポイント)
            let photoPoints = 1;
            totalPoints += photoPoints;
            alert(`${spot.name} の写真アップロードで ${photoPoints} ポイント獲得！`);

            updateStampCard(); // UI更新
            updateUserData(); // Firestore更新
            updatePointsDisplay();
            uploadLabel.innerText = "写真アップロード";
            uploadLabel.disabled = false;
          }).catch(error => {
            console.error("Upload process failed for spot " + spot.id, error);
            uploadLabel.innerText = "アップロード失敗";
            // 数秒後にボタンテキストを戻すなど
            setTimeout(() => {
                uploadLabel.innerText = "写真アップロード";
                uploadLabel.disabled = false;
            }, 3000);
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
        stampTime: spot.stampTime ? spot.stampTime.toISOString() : null,
        uploadedPhotos: spot.uploadedPhotos || [] // 写真URLの配列も保存
      }; 
    });
    db.collection("users").doc(user.uid).set({
      displayName: user.displayName, // 念のためdisplayNameも更新
      totalPoints: totalPoints,
      stampStatuses: stampStatuses
    }, { merge: true })
    .then(() => {
        console.log("User data successfully updated in Firestore for UID: ", user.uid);
        loadRanking(); // ユーザーデータ更新後にランキングも再読み込み
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
  if (!rankingListEl) return; // 要素がなければ何もしない

  rankingListEl.innerHTML = "ランキング読み込み中..."; // ローディング表示
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
          // displayName がない場合、フォールバックとして「名無しさん」などを表示
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

// 写真を拡大表示するモーダルを開く関数
function openPhotoModal(imageUrl) {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  if (modal && modalImage) {
    modalImage.src = imageUrl;
    modal.classList.add("show"); // display:flex を適用
  }
}

// モーダルを閉じる関数
function closePhotoModal(event) {
  const modal = document.getElementById("photoModal");
  // モーダル背景自体か、閉じるボタン（×）がクリックされた場合のみ閉じる
  if (modal && (event.target.id === "photoModal" || event.target.classList.contains("modal-close"))) {
    modal.classList.remove("show"); // display:none に戻す
    document.getElementById("modalImage").src = ""; // 画像ソースをクリア（メモリ解放の一助）
  }
}


// 初回表示更新 (DOMContentLoaded後の方が安全な場合もあるが、ここではグローバルスコープで実行)
// DOMContentLoaded を待つ場合:
// document.addEventListener('DOMContentLoaded', () => {
//   updatePointsDisplayAndStampCard();
//   loadRanking(); // 初回ランキング読み込み
// });
// グローバルスコープで実行する場合 (スクリプトがbodyの終端近くにあれば問題ないことが多い)
updatePointsDisplayAndStampCard();
// loadRanking(); // auth.onAuthStateChanged で呼ばれるため、ここでは不要な場合もある
