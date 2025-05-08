// map.js

// DOMContentLoaded を待って地図を初期化
document.addEventListener('DOMContentLoaded', () => {
    // 地図の初期化 (globals.jsで宣言されたmap, markersを使用)
    map = L.map('map').setView([36, 138], 5); // グローバル変数 map を初期化
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markers = L.markerClusterGroup(); // グローバル変数 markers を初期化
    map.addLayer(markers);

    addCastleMarkers(); // マーカーを追加
    initializeGeolocation(); // 位置情報取得を開始
});


// マーカーの追加 (この関数は DOMContentLoaded の外で定義し、中で呼び出す)
function addCastleMarkers() {
  if (!map || !markers) { // mapとmarkersが初期化されているか確認
      console.warn("Map or markers not initialized yet for addCastleMarkers");
      return;
  }
  markers.clearLayers(); // 既存のマーカーをクリア
  castleSpots.forEach(spot => {
    let icon = spot.stamped ? stampedIcon : defaultIcon;
    let marker = L.marker([spot.lat, spot.lng], { icon: icon });
    marker.bindPopup(`<b>${spot.name}</b><br>${spot.description.substring(0,50)}...`);
    spot.marker = marker;
    marker.on('click', function(){
      map.setView([spot.lat, spot.lng], 15);
      highlightedSpotId = spot.id;
      // stampCard.js の updateStampCard を呼び出す
      if (typeof updateStampCard === 'function') {
        updateStampCard();
      } else {
        console.error("updateStampCard function is not defined.");
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
    map.setView(userLocation, 15); // ズームレベル15に変更
  } else {
    // 位置情報がまだない場合、取得を試みる
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
  return userLocation.distanceTo(spotLatLng) <= 50000; // 50km
}


function handlePosition(position) {
  let lat = position.coords.latitude;
  let lng = position.coords.longitude;
  userLocation = L.latLng(lat, lng);

  if (!map) { // mapが初期化されているか確認
      console.warn("Map not initialized yet for handlePosition");
      return;
  }

  if (!currentLocationMarker) {
    currentLocationMarker = L.marker(userLocation, { icon: userIcon }).addTo(map);
    currentLocationMarker.bindPopup("あなたの現在地").openPopup();
  } else {
    currentLocationMarker.setLatLng(userLocation);
  }
  
  map.setView(userLocation, 15); // 現在地取得後、地図の中心を移動

  // 既存のサークルをクリア
  userCircles.forEach(circle => { map.removeLayer(circle); });
  userCircles = [];

  // グラデーション風サークル再描画 (50km圏)
  const radii = [50000, 40000, 30000, 20000, 10000]; // 半径の配列
  const opacities = [0.05, 0.06, 0.07, 0.08, 0.1]; // 透明度の配列

  radii.forEach((radius, index) => {
    userCircles.push(L.circle(userLocation, {
      radius: radius,
      color: 'rgba(76, 175, 80, 0.3)', // プライマリカラーの薄い版
      fillColor: 'rgba(76, 175, 80, 0.1)', // さらに薄い色
      fillOpacity: opacities[index],
      weight: 1, // 線の太さ
    }).addTo(map));
  });

  // stampCard.js の updateStampCard を呼び出す
  if (typeof updateStampCard === 'function') {
    updateStampCard(); // 位置情報更新後にスタンプカードも更新
  } else {
    console.error("updateStampCard function is not defined.");
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
  // 位置情報が取得できない場合でもスタンプカードは表示する
  if (typeof updateStampCard === 'function') {
    updateStampCard();
  }
}


// 初回の位置情報取得と継続的な監視
function initializeGeolocation() {
    if (!map) { // mapが初期化されているか確認
        console.warn("Map not initialized yet for initializeGeolocation");
        return;
    }
    if (navigator.geolocation) {
        // 初回取得
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, { 
            enableHighAccuracy: true,
            timeout: 10000, // 10秒でタイムアウト
            maximumAge: 0 // キャッシュを使用しない
        });
        // 継続監視 (必要に応じて。バッテリー消費に注意)
        // navigator.geolocation.watchPosition(handlePosition, handleError, { enableHighAccuracy: true });
    } else {
        alert("お使いのブラウザは位置情報サービスに対応していません。");
        if (typeof updateStampCard === 'function') {
            updateStampCard(); // 位置情報なしでもカードは表示
        }
    }
}
