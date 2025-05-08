// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDKoSPR75Je99OtMywNCx7Wdufo2sqRo0Q", // ご自身のAPIキーに置き換えてください
  authDomain: "stamprally-202503.firebaseapp.com",
  projectId: "stamprally-202503",
  storageBucket: "stamprally-202503.appspot.com", // .appspot.com が正しいことが多いです
  messagingSenderId: "302159612226",
  appId: "1:302159612226:web:b33b58c902b33b00c9a0db"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Firebase Storageインスタンス
