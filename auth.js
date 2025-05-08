// auth.js
function 新規登録() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    alert("氏名、メールアドレス、パスワードをすべて入力してください。");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return user.updateProfile({ displayName: name }).then(() => { // returnを追加
        alert("新規登録成功: " + user.email);
        // Firestoreにユーザー初期データ作成
        return db.collection("users").doc(user.uid).set({ // returnを追加
          displayName: name,
          totalPoints: 0,
          stampStatuses: {} 
        });
      });
    })
    .then(() => {
        console.log("User document successfully written after signup!");
        // UI更新やランキング読み込みはonAuthStateChangedに任せるか、ここで明示的に呼ぶ
        // loadRanking(); // onAuthStateChangedで呼ばれるので重複する可能性
        // ログイン状態になるので onAuthStateChanged が発火し、loadUserDataなどが呼ばれるはず
    })
    .catch((error) => { 
        alert("エラー: " + error.message); 
        console.error("Signup error:", error);
    });
}

function ログイン() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("ログイン成功: " + userCredential.user.email);
      // ログイン成功後の処理は onAuthStateChanged に任せる
    })
    .catch((error) => { 
        alert("エラー: " + error.message); 
        console.error("Login error:", error);
    });
}

function ログアウト() {
  auth.signOut().then(() => {
    alert("ログアウトしました");
    // ログアウト時のローカルデータリセットは onAuthStateChanged で行う
  }).catch((error) => { 
      alert("エラー: " + error.message); 
      console.error("Logout error:", error);
  });
}

// Firestoreからユーザーデータ読み込み
function loadUserData(uid) {
  console.log("loadUserData called for UID:", uid);
  if (!db) {
      console.error("Firestore (db) is not initialized in loadUserData.");
      return;
  }
  if (!castleSpots || castleSpots.length === 0) {
      console.warn("castleSpots is not yet loaded in loadUserData. User data might not merge correctly yet.");
      // castleSpotsがロードされるまで待つか、後で再度この関数を呼ぶ必要があるかもしれない。
      // ただし、通常は map.js で castleSpots が先にロードされる想定。
  }

  db.collection("users").doc(uid).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      console.log("User data from Firestore:", data);
      totalPoints = data.totalPoints || 0;
      
      // castleSpots の各スポットにユーザーデータをマージ
      castleSpots.forEach(spot => {
        const userSpotData = data.stampStatuses ? data.stampStatuses[spot.id] : null;
        if (userSpotData) {
          spot.stamped = userSpotData.stamped || false;
          spot.stampTime = userSpotData.stampTime ? new Date(userSpotData.stampTime) : null;
          spot.uploadedPhotos = userSpotData.uploadedPhotos || [];
        } else {
          // Firestoreにユーザーのスポットデータがない場合、ローカルを初期状態にリセット
          spot.stamped = false;
          spot.stampTime = null;
          spot.uploadedPhotos = [];
        }
        // マーカーアイコンも更新
        if (spot.marker) {
            spot.marker.setIcon(spot.stamped ? stampedIcon : defaultIcon);
        }
      });
    } else {
      console.log("No user document found in Firestore for UID:", uid, ". Initializing local data.");
      totalPoints = 0;
      castleSpots.forEach(spot => {
        spot.stamped = false;
        spot.stampTime = null;
        spot.uploadedPhotos = [];
        if (spot.marker) {
            spot.marker.setIcon(defaultIcon);
        }
      });
      // 新規ユーザーの場合、Firestoreに空のドキュメントを作成することも検討できる
      // db.collection("users").doc(uid).set({ displayName: auth.currentUser.displayName, totalPoints: 0, stampStatuses: {} });
    }
    // UI更新
    if (typeof updatePointsDisplayAndStampCard === 'function') {
        updatePointsDisplayAndStampCard();
    } else {
        console.error("updatePointsDisplayAndStampCard is not defined in loadUserData");
    }
    if (typeof addCastleMarkers === 'function') { // マーカーの状態を再描画するために呼ぶ
        addCastleMarkers();
    }

  }).catch(error => {
    console.error("Error loading user data:", error);
    // エラー時もローカルデータを初期化しUIを更新
    totalPoints = 0;
    castleSpots.forEach(spot => {
      spot.stamped = false;
      spot.stampTime = null;
      spot.uploadedPhotos = [];
      if (spot.marker) {
          spot.marker.setIcon(defaultIcon);
      }
    });
    if (typeof updatePointsDisplayAndStampCard === 'function') {
        updatePointsDisplayAndStampCard();
    }
  });
}


auth.onAuthStateChanged(user => {
  const loginStatusEl = document.getElementById("loginStatus");
  const authFormEl = document.getElementById("authForm");
  const logoutBtnEl = document.getElementById("logoutBtn");

  if (user) {
    if (loginStatusEl) loginStatusEl.innerText = "ログイン中: " + (user.displayName || user.email);
    if (authFormEl) authFormEl.style.display = "none";
    if (logoutBtnEl) logoutBtnEl.style.display = "inline-block";
    
    // castleSpots がロードされた後にユーザーデータをロードする
    // map.js の DOMContentLoaded 内で castleSpots がロードされるのを待つ必要があるかもしれない
    // ここでは、castleSpotsが既にロードされていると仮定して進めるか、
    // castleSpotsのロード完了を待つPromise/コールバック機構を導入する
    if (castleSpots && castleSpots.length > 0) {
        loadUserData(user.uid);
    } else {
        console.warn("onAuthStateChanged: castleSpots not loaded yet. Delaying loadUserData or it might not work as expected.");
        // 一定時間後にリトライするか、イベントを発行して castleSpots ロード後に loadUserData をトリガーする
        // 簡単な対処として、少し遅延させて実行
        setTimeout(() => {
            if (castleSpots && castleSpots.length > 0) {
                loadUserData(user.uid);
            } else {
                console.error("onAuthStateChanged: castleSpots still not loaded after delay.");
            }
        }, 1000); // 1秒待つ (もっと良い方法を検討すべき)
    }
    if (typeof loadRanking === 'function') loadRanking();

  } else {
    if (loginStatusEl) loginStatusEl.innerText = "未ログイン";
    if (authFormEl) authFormEl.style.display = "block";
    if (logoutBtnEl) logoutBtnEl.style.display = "none";
    
    totalPoints = 0;
    // グローバルの castleSpots 配列の各スポットのユーザー依存情報をリセット
    if (castleSpots && castleSpots.length > 0) {
        castleSpots.forEach(spot => {
          spot.stamped = false;
          spot.stampTime = null;
          spot.uploadedPhotos = [];
          if (spot.marker) { // マーカーがあればアイコンをデフォルトに戻す
            spot.marker.setIcon(defaultIcon);
          }
        });
    }
    if (typeof updatePointsDisplayAndStampCard === 'function') {
        updatePointsDisplayAndStampCard();
    } else {
        console.error("updatePointsDisplayAndStampCard is not defined in onAuthStateChanged (else branch)");
    }
    const rankingListEl = document.getElementById("rankingList");
    if (rankingListEl) rankingListEl.innerHTML = "ログインしてランキングを確認";
  }
});


// ハンバーガーメニュー制御
function openMenu() { 
    const menu = document.getElementById("hamburgerMenu");
    if (menu) menu.classList.add("active");
}
function closeMenu() { 
    const menu = document.getElementById("hamburgerMenu");
    if (menu) menu.classList.remove("active");
}
