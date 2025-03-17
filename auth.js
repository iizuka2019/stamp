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
