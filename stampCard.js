// stampCard.js

// Firebase Storage を利用した写真アップロード
function uploadPhoto(spot, file) {
  const user = auth.currentUser;
  if (!user) {
    alert("写真アップロードにはログインが必要です。");
    return Promise.reject("Not logged in");
  }
  // spot.id が数値の場合、FirestoreのドキュメントIDとして使用するために文字列に変換することが推奨される場合がある。
  // ここでは spot.id が Firestore のドキュメント ID と互換性のある形式であると仮定する。
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
      console.warn("castleSpots array is empty or not yet loaded in updateStampCard.");
      return;
  }

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

      // 1. デフォルト画像 (常に表示候補)
      //    ただし、他のギャラリーとの兼ね合いで表示しないケースも考慮するなら条件追加
      if (spot.defaultImage) {
          contentHTML += `<img src="${spot.defaultImage}" alt="${spot.name}のデフォルト画像" class="default-image">`;
      }
      
      contentHTML += `<p class="castle-description">${spot.description || '説明がありません。'}</p>`;
      
      if (spot.stamped && spot.stampTime) {
        contentHTML += `<p class="stamp-time">獲得日時: ${new Date(spot.stampTime).toLocaleString("ja-JP")}</p>`;
      }
      stampItem.innerHTML = contentHTML; // 基本情報を先に設定
      
      // 2. ログインユーザー自身のアップロード写真ギャラリー (spot.uploadedPhotos)
      const currentUser = auth.currentUser; // auth.jsからauthを参照
      if (currentUser && spot.uploadedPhotos && spot.uploadedPhotos.length > 0) {
        let myPhotosGalleryDiv = document.createElement('div');
        myPhotosGalleryDiv.className = "photo-gallery my-photos-gallery";
        let galleryTitle = document.createElement('h4');
        galleryTitle.className = 'gallery-title';
        galleryTitle.textContent = 'あなたの写真';
        myPhotosGalleryDiv.appendChild(galleryTitle);
        spot.uploadedPhotos.forEach(photoUrl => {
          let img = document.createElement('img');
          img.src = photoUrl;
          img.className = "uploaded-photo";
          img.alt = `${spot.name} のあなたの写真`;
          img.onclick = () => openPhotoModal(photoUrl);
          myPhotosGalleryDiv.appendChild(img);
        });
        stampItem.appendChild(myPhotosGalleryDiv);
      }

      // 3. みんなの投稿写真ギャラリー (spot.publicPhotoURLs)
      // spot.publicPhotoURLs は map.js で Firestore の castleSpots ドキュメントからロードされると仮定
      const publicPhotos = spot.publicPhotoURLs || [];
      if (publicPhotos.length > 0) {
        let publicGalleryDiv = document.createElement('div');
        publicGalleryDiv.className = "photo-gallery public-photos-gallery";
        let galleryTitle = document.createElement('h4');
        galleryTitle.className = 'gallery-title';
        galleryTitle.textContent = 'みんなの写真'; // ログアウト状態でも表示されうる
        publicGalleryDiv.appendChild(galleryTitle);
        publicPhotos.forEach(photoUrl => {
          let img = document.createElement('img');
          img.src = photoUrl;
          img.className = "uploaded-photo";
          img.alt = `${spot.name} の公開写真`;
          img.onclick = () => openPhotoModal(photoUrl);
          publicGalleryDiv.appendChild(img);
        });
        stampItem.appendChild(publicGalleryDiv);
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
          spot.stampTime = new Date();
          let pts = spot.points || 2; // デフォルトポイントを設定
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
        const user = auth.currentUser;
        if (!user) {
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
          uploadLabel.style.pointerEvents = "none"; 
          uploadLabel.style.opacity = "0.7";

          uploadPhoto(spot, file).then(downloadURL => {
            // 1. ユーザー自身の写真リストに追加
            if (!spot.uploadedPhotos) spot.uploadedPhotos = [];
            spot.uploadedPhotos.push(downloadURL);
            
            // 2. FirestoreのcastleSpotsコレクションの該当ドキュメントのpublicPhotoURLsにも追加
            // spot.id が数値の場合は文字列に変換する必要があるかもしれない。
            // Firestore のドキュメントIDは通常文字列。
            const spotDocId = spot.id.toString(); // IDを文字列に変換
            const spotDocRef = db.collection("castleSpots").doc(spotDocId); 
            
            spotDocRef.update({
                publicPhotoURLs: firebase.firestore.FieldValue.arrayUnion(downloadURL)
            })
            .then(() => {
                console.log(`Public photo URL added to Firestore for spot ${spotDocId}`);
                // ローカルの spot.publicPhotoURLs も更新 (map.jsでの読み込みと一貫性のため)
                if (!spot.publicPhotoURLs) {
                    spot.publicPhotoURLs = [];
                }
                if (!spot.publicPhotoURLs.includes(downloadURL)) {
                    spot.publicPhotoURLs.push(downloadURL);
                }
            })
            .catch(err => {
                console.error(`Error updating publicPhotoURLs in Firestore for spot ${spotDocId}:`, err);
                // エラーが発生しても、ユーザー個人の写真アップロードとポイント付与は続行する
            });

            let photoPoints = 1; // 写真アップロードによるポイント
            totalPoints += photoPoints;
            alert(`${spot.name} の写真アップロードで ${photoPoints} ポイント獲得！`);

            updateStampCard(); 
            updateUserData(); // ユーザーのスタンプ状況（個人の写真リスト含む）と総ポイントを更新
            updatePointsDisplay();
          }).catch(error => {
            console.error("Upload process failed for spot " + spot.id, error);
            // alert("写真のアップロードに失敗しました。"); // uploadPhoto内でもアラートが出るので重複を避ける
          }).finally(() => {
            uploadLabel.innerText = "写真アップロード";
            uploadLabel.style.pointerEvents = "auto";
            uploadLabel.style.opacity = "1";
            event.target.value = ''; 
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
      stampCardContainer.innerHTML = "<p style='text-align:center;'>表示できる城がありません。</p>";
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
      stampStatuses[spot.id.toString()] = { // spot.idをキーにする場合、文字列化を検討
        stamped: spot.stamped, 
        stampTime: spot.stampTime ? spot.stampTime.toISOString() : null,
        uploadedPhotos: spot.uploadedPhotos || [] // ユーザーがそのスポットにアップロードした写真のリスト
      }; 
    });
    db.collection("users").doc(user.uid).set({
      displayName: user.displayName, // auth.jsの新規登録で設定される想定
      totalPoints: totalPoints,
      stampStatuses: stampStatuses
    }, { merge: true })
    .then(() => {
        console.log("User data successfully updated in Firestore for UID: ", user.uid);
        if (typeof loadRanking === 'function') loadRanking(); // ランキングを更新
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
        let rank = 1;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const displayName = data.displayName || "名無しさん"; // displayNameがない場合のフォールバック
          html += `<div>${rank}. ${displayName} : ${data.totalPoints || 0}ポイント</div>`;
          rank++;
        });
      }
      rankingListEl.innerHTML = html;
    })
    .catch(error => {
      console.error("ランキング取得エラー: ", error);
      rankingListEl.innerHTML = "ランキングの読み込みに失敗しました。";
    });
}

// この関数は auth.js や map.js から呼ばれる想定
function updatePointsDisplayAndStampCard() {
  updatePointsDisplay();
  updateStampCard();
}

function openPhotoModal(imageUrl) {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  if (modal && modalImage) {
    modalImage.src = imageUrl;
    modal.classList.add("show"); // CSSで display:flex !important; などで表示
  }
}

function closePhotoModal(event) {
  const modal = document.getElementById("photoModal");
  // モーダル背景クリックまたは閉じるボタンクリックで閉じる
  if (modal && (event.target === modal || event.target.classList.contains("modal-close"))) {
    modal.classList.remove("show");
    const modalImage = document.getElementById("modalImage");
    if(modalImage) modalImage.src = ""; // メモリ解放のためにsrcを空にする
  }
}

// スタイルシートで .photo-gallery .gallery-title のスタイル定義を追加すると良いでしょう。例:
// .gallery-title { font-size: 1em; margin-bottom: 5px; color: #555; text-align: left; }
// .my-photos-gallery { border-top: 1px dashed #ccc; margin-top: 10px; padding-top: 10px; }
// .public-photos-gallery { border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px; }
