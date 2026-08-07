let position_latitude;
let position_longitude;
let watchId = null;
let locationIntervalId = null;


function handleNewPosition(lat, lon) {
  if (position_latitude !== lat || position_longitude !== lon) {
    position_latitude = lat;
    position_longitude = lon;
    
    console.log(`📍 [Location Updated] Lat: ${lat}, Lon: ${lon}`);

    if (typeof loadMyRoute === 'function') {
      loadMyRoute();
    }

    sendLocationToServer(position_latitude, position_longitude);
  }
}

function startLocationTracking() {
  if (window.LocationChannel) {
    console.log('📱 [System]: ตรวจพบการทำงานบน Flutter WebView');

    window.LocationChannel.postMessage('requestLocation');

    locationIntervalId = setInterval(() => {
      if (window.LocationChannel) {
        window.LocationChannel.postMessage('requestLocation');
        console.log('🔄 [JS -> Flutter] สะกิดขอพิกัดรอบประจำ');
      }
    }, 20000);

  } 
  else if (navigator.geolocation) {
    console.log('🌐 [System]: ตรวจพบการทำงานบน Web Browser ปกติ');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        handleNewPosition(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('❌ Browser Geolocation Error:', error.message);
      },
      options
    );

  } else {
    console.error('❌ เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด Geolocation');
  }
}


function sendLocationToServer(lat, lon) {
  if (typeof truck_id === 'undefined' || typeof driver_id === 'undefined' || !truck_id || !driver_id || !lat || !lon) {
    return;
  }

  fetch(`/api/saveLocation/${truck_id}/${driver_id}/${lat}/${lon}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับด้วยสถานะ: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("📥 ข้อมูลตอบกลับจากเซิร์ฟเวอร์:", data);
    })
    .catch(error => {
      console.error("❌ เกิดข้อผิดพลาดในการ Fetch ข้อมูล:", error);
    });
}

startLocationTracking();