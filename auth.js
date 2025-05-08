// auth.js
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
          stampStatuses: {} // 初期状態では空
        }).then(() => {
          console.log("User document successfully written!");
          loadRanking(); // ランキングを更新
          // UIをログイン状態に更新
          document.getElementById("loginStatus").innerText = "ログイン中: " + user.displayName;
          document.getElementById("authForm").style.display = "none";
          document.getElementById("logoutBtn").style.display = "inline-block";
          updatePointsDisplayAndStampCard(); // 新規登録後、ポイントとスタンプカード表示を更新
        }).catch((error) => {
          console.error("Error writing user document: ", error);
        });
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
      // loadUserData は onAuthStateChanged で呼ばれるので、ここではランキング更新のみで良い場合もある
      // loadUserData(userCredential.user.uid); 
      // loadRanking();
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
      spot.uploadedPhotos = []; // ログアウト時にローカルの写真情報もクリア
    });
    updatePointsDisplayAndStampCard(); // UIをリセット
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
          if (data.stampStatuses[spot.id]) {
            spot.stamped = data.stampStatuses[spot.id].stamped;
            spot.stampTime = data.stampStatuses[spot.id].stampTime ? new Date(data.stampStatuses[spot.id].stampTime) : null;
            spot.uploadedPhotos = data.stampStatuses[spot.id].uploadedPhotos || [];
          } else {
            // Firestoreに記録がないスポットは初期化
            spot.stamped = false;
            spot.stampTime = null;
            spot.uploadedPhotos = [];
          }
        });
      } else {
        // stampStatuses自体がない場合も全スポット初期化
        castleSpots.forEach(spot => {
            spot.stamped = false;
            spot.stampTime = null;
            spot.uploadedPhotos = [];
        });
      }
      updatePointsDisplayAndStampCard();
      // マーカーアイコンも更新
      castleSpots.forEach(spot => {
        if (spot.marker) {
          spot.marker.setIcon(spot.stamped ? stampedIcon : defaultIcon);
        }
      });
    } else {
      // Firestoreにドキュメントがない場合（新規登録直後など）
      console.log("No such document for user, initializing local data.");
      totalPoints = 0;
      castleSpots.forEach(spot => {
        spot.stamped = false;
        spot.stampTime = null;
        spot.uploadedPhotos = [];
      });
      updatePointsDisplayAndStampCard();
    }
  }).catch(error => {
    console.error("Error loading user data:", error);
    // エラー発生時もローカルデータを初期化
    totalPoints = 0;
    castleSpots.forEach(spot => {
      spot.stamped = false;
      spot.stampTime = null;
      spot.uploadedPhotos = [];
    });
    updatePointsDisplayAndStampCard();
  });
}


auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginStatus").innerText = "ログイン中: " + (user.displayName || user.email);
    document.getElementById("authForm").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";
    loadUserData(user.uid);
    loadRanking();
  } else {
    document.getElementById("loginStatus").innerText = "未ログイン";
    document.getElementById("authForm").style.display = "block";
    document.getElementById("logoutBtn").style.display = "none";
    // ログアウト時もローカルデータをリセット
    totalPoints = 0;
    castleSpots.forEach(spot => {
      spot.stamped = false;
      spot.stampTime = null;
      spot.uploadedPhotos = [];
      if (spot.marker) {
        spot.marker.setIcon(defaultIcon);
      }
    });
    updatePointsDisplayAndStampCard();
    document.getElementById("rankingList").innerHTML = "ログインしてランキングを確認";
  }
});


// ハンバーガーメニュー制御
function openMenu() { document.getElementById("hamburgerMenu").classList.add("active"); }
function closeMenu() { document.getElementById("hamburgerMenu").classList.remove("active"); }
