// map.js

async function loadCastleSpotsFromFirestore() {
    if (!db) {
        console.error("Firestore (db) is not initialized for loading castle spots.");
        // globals.js の castleSpots が空のままになる
        return []; 
    }
    try {
        const snapshot = await db.collection("castleSpots").orderBy("id").get();
        const spots = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            spots.push({
                id: data.id,
                name: data.name,
                lat: data.lat,
                lng: data.lng,
                prefecture: data.prefecture,
                description: data.description,
                defaultImage: data.defaultImage,
                points: data.points,
                stamped: false,
                stampTime: null,
                uploadedPhotos: [],
                marker: null
            });
        });
        console.log("Castle spots loaded from Firestore:", spots.length, "spots");
        return spots;
    } catch (error) {
        console.error("Error loading castle spots from Firestore: ", error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    map = L.map('map').setView([36, 138], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markers = L.markerClusterGroup();
    map.addLayer(markers);

    // Firestoreから城データを非同期で読み込み、グローバル変数を更新
    castleSpots = await loadCastleSpotsFromFirestore(); 

    addCastleMarkers(); 
    initializeGeolocation(); 

    // castleSpots のロード後にスタンプカードを更新 (ユーザーデータはauth.jsでロード後に再度更新される)
    if (typeof updateStampCard === 'function') {
        updateStampCard();
    } else {
        console.error("updateStampCard is not defined when DOMContentLoaded fires in map.js");
    }
});


function addCastleMarkers() {
  if (!map || !markers) {
      console.warn("Map or markers not initialized yet for addCastleMarkers");
      return;
  }
  if (!castleSpots || castleSpots.length === 0) {
      console.warn("castleSpots data is not available for addCastleMarkers. Waiting for data to load.");
      return; // castleSpotsがロードされるまで待つ
  }
  markers.clearLayers();
  console.log("addCastleMarkers called. Number of spots to add:", castleSpots.length);
  castleSpots.forEach(spot => {
    // spot.stamped は loadUserData で更新されるので、ここではデフォルトアイコンで良い場合もある
    // もしくは、loadUserData後に再度addCastleMarkersを呼ぶか、マーカーアイコンを個別に更新する
    let icon = spot.stamped ? stampedIcon : defaultIcon;
    let marker = L.marker([spot.lat, spot.lng], { icon: icon });
    marker.bindPopup(`<b>${spot.name}</b><br>${(spot.description || '').substring(0,50)}...`);
    spot.marker = marker; // spotオブジェクトにマーカーインスタンスを保持
    marker.on('click', function(){
      map.setView([spot.lat, spot.lng], 15);
      highlightedSpotId = spot.id;
      if (typeof updateStampCard === 'function') {
        updateStampCard();
      }
      const cardItem = document.getElementById("stamp-card-" + spot.id);
      if (cardItem) {
        cardItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    markers.addLayer(marker);
  });
}

function locateUser() {
  if (userLocation) { 
    map.setView(userLocation, 15);
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, { enableHighAccuracy: true });
    } else {
      alert("お使いのブラウザは位置情報サービスに対応していません。");
    }
  }
}

function isWithinRange(spotLat, spotLng) {
  if (!userLocation) return false;
  const spotLatLng = L.latLng(spotLat, spotLng);
  return userLocation.distanceTo(spotLatLng) <= 50000;
}


function handlePosition(position) {
  let lat = position.coords.latitude;
  let lng = position.coords.longitude;
  userLocation = L.latLng(lat, lng);

  if (!map) {
      console.warn("Map not initialized yet for handlePosition");
      return;
  }

  if (!currentLocationMarker) {
    currentLocationMarker = L.marker(userLocation, { icon: userIcon }).addTo(map);
    currentLocationMarker.bindPopup("あなたの現在地").openPopup();
  } else {
    currentLocationMarker.setLatLng(userLocation);
  }
  
  map.setView(userLocation, 15);

  userCircles.forEach(circle => { map.removeLayer(circle); });
  userCircles = [];

  const radii = [50000, 40000, 30000, 20000, 10000];
  const opacities = [0.05, 0.06, 0.07, 0.08, 0.1];

  radii.forEach((radius, index) => {
    userCircles.push(L.circle(userLocation, {
      radius: radius,
      color: 'rgba(76, 175, 80, 0.3)',
      fillColor: 'rgba(76, 175, 80, 0.1)',
      fillOpacity: opacities[index],
      weight: 1,
    }).addTo(map));
  });

  if (typeof updateStampCard === 'function') {
    updateStampCard();
  }
}

function handleError(error) {
  console.error("Geolocation error: " + error.message);
  let message = "位置情報の取得に失敗しました。";
  switch(error.code) {
    case error.PERMISSION_DENIED:
      message += " 位置情報へのアクセスが拒否されました。設定を確認してください。";
      break;
    case error.POSITION_UNAVAILABLE:
      message += " 位置情報を特定できませんでした。";
      break;
    case error.TIMEOUT:
      message += " 位置情報の取得がタイムアウトしました。";
      break;
  }
  alert(message);
  if (typeof updateStampCard === 'function') {
    updateStampCard(); // 位置情報エラーでもカードは更新試行
  }
}

function initializeGeolocation() {
    if (!map) {
        console.warn("Map not initialized yet for initializeGeolocation");
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 
        });
    } else {
        alert("お使いのブラウザは位置情報サービスに対応していません。");
        if (typeof updateStampCard === 'function') {
            updateStampCard();
        }
    }
}
