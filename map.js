// map.js
// マーカーの追加
castleSpots.forEach(spot => {
  let marker = L.marker([spot.lat, spot.lng], { icon: defaultIcon });
  marker.bindPopup(spot.name);
  spot.marker = marker;
  marker.on('click', function(){
    map.setView([spot.lat, spot.lng], 18);
    highlightedSpotId = spot.id;
    updateStampCard();
  });
  markers.addLayer(marker);
});
map.addLayer(markers);

function locateUser() {
  if (userLocation) { map.setView(userLocation, 18); }
}

function isWithinRange(spotLat, spotLng) {
  if (!userLocation) return false;
  return userLocation.distanceTo(L.latLng(spotLat, spotLng)) <= 50000;
}

// 初回の位置取得とサークル表示
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    userLocation = L.latLng(lat, lng);
    map.setView(userLocation, 18);
    currentLocationMarker = L.marker(userLocation, { icon: userIcon }).addTo(map);
    currentLocationMarker.bindPopup("あなたの現在地");
    // グラデーション風サークル生成
    userCircles.forEach(circle => { map.removeLayer(circle); });
    userCircles = [];
    userCircles.push(L.circle(userLocation, { radius: 50000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.1, stroke: false }).addTo(map));
    userCircles.push(L.circle(userLocation, { radius: 40000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.07, stroke: false }).addTo(map));
    userCircles.push(L.circle(userLocation, { radius: 30000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.05, stroke: false }).addTo(map));
    updateStampCard();
  }, error => {
    console.error("getCurrentPosition エラー: " + error.message);
  }, { enableHighAccuracy: true });
} else {
  console.error("Geolocation is not supported by this browser.");
}

// 連続更新（watchPosition）
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(position => {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    userLocation = L.latLng(lat, lng);
    if (currentLocationMarker) {
      currentLocationMarker.setLatLng(userLocation);
    }
    userCircles.forEach(circle => { map.removeLayer(circle); });
    userCircles = [];
    userCircles.push(L.circle(userLocation, { radius: 50000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.1, stroke: false }).addTo(map));
    userCircles.push(L.circle(userLocation, { radius: 40000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.07, stroke: false }).addTo(map));
    userCircles.push(L.circle(userLocation, { radius: 30000, color: '#a2d9ff', fillColor: '#a2d9ff', fillOpacity: 0.05, stroke: false }).addTo(map));
    updateStampCard();
  }, error => {
    console.error("watchPosition エラー: " + error.message);
  }, { enableHighAccuracy: true });
}
