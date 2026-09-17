let position_latitude;
let position_longitude;
let watchId = null;
let locationIntervalId = null;
let serverSyncIntervalId = null; // เพิ่มตัวแปรสำหรับเก็บ ID ของ Interval ตัวใหม่
let trackingStopped = false; // กันไม่ให้ start ใหม่หลังจากถูกสั่งหยุดแล้ว (เช่น งานหมดแล้ว)

async function handleNewPosition(lat, lon) {
  if (position_latitude !== lat || position_longitude !== lon) {
    position_latitude = lat;
    position_longitude = lon;
    
    console.log(`📍 [Saved Location] Lat: ${lat}, Lon: ${lon}`);

    if (typeof updateDriverMap === 'function') {
      await updateDriverMap();
      updateRouteTable();
    }
  }
}

function startLocationTracking() {

  if (trackingStopped) {
    console.log('⚠️ Location tracking was stopped, not restarting.');
    return;
  }

  if (locationIntervalId || watchId) {
    console.log('⚠️ Location tracking already started');
    return;
  }

  if (window.LocationChannel) {
    console.log('[+] Using Mobile App Location Channel.');

    window.LocationChannel.postMessage('requestLocation');

    locationIntervalId = setInterval(() => {
      if (window.LocationChannel) {
        window.LocationChannel.postMessage('requestLocation');
        console.log('[+] Requesting Location From Mobile App.');
      }
    }, 60000);

  } 
  else if (navigator.geolocation) {
    console.log('[+]: Using Web Browser Location Service.');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await handleNewPosition(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('[!] Browser Geolocation Error:', error.message);
      },
      options
    );

  } else {
    console.error('[!] Geolocation is not supported Browser not support');
  }

  if (!serverSyncIntervalId) {
    serverSyncIntervalId = setInterval(() => {
      if (position_latitude && position_longitude) {
        console.log('[+] Sending location to server (60s interval).');
        sendLocationToServer(position_latitude, position_longitude);
      }
    }, 60000); //ส่งข้อมูลตำแหน่งไปที่ Server ทุก ๆ 1 นาที
  }
}

// หยุดการขอ/ส่งตำแหน่งทั้งหมด ใช้ตอนคนขับส่งงานครบและกลับถึงโกดังแล้ว จะได้ไม่ยิงขอตำแหน่งค้างไว้ถ้าลืมปิดแอพ
function stopLocationTracking() {
  trackingStopped = true;

  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (locationIntervalId !== null) {
    clearInterval(locationIntervalId);
    locationIntervalId = null;
  }

  if (serverSyncIntervalId !== null) {
    clearInterval(serverSyncIntervalId);
    serverSyncIntervalId = null;
  }

  console.log('🛑 Location tracking stopped: no more deliveries left.');
}

function sendLocationToServer(lat, lon) {
  if (typeof truck_id === 'undefined' || typeof driver_id === 'undefined' || !truck_id || !driver_id || !lat || !lon) {
    return;
  }
  // Using Global Variables.
  fetch(`/api/saveLocation/${truck_id}/${driver_id}/${position_latitude}/${position_longitude}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server Response with: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Server Response Data:", data);
    })
    .catch(error => {
      console.error("[!] Fetch saveLocation API Error:", error);
    });
}

startLocationTracking();