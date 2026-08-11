let position_latitude;
let position_longitude;
let watchId = null;
let locationIntervalId = null;

function handleNewPosition(lat, lon) {
  if (position_latitude !== lat || position_longitude !== lon) {
    position_latitude = lat;
    position_longitude = lon;
    
    console.log(`📍 [Saved Location] Lat: ${lat}, Lon: ${lon}`);

    if (typeof loadMyRoute === 'function') {
      loadMyRoute();
    }

    sendLocationToServer();
  }
}

function startLocationTracking() {
  if (window.LocationChannel) {
    console.log('[+] Using Mobile App Location Channel.');

    window.LocationChannel.postMessage('requestLocation');

    locationIntervalId = setInterval(() => {
      if (window.LocationChannel) {
        window.LocationChannel.postMessage('requestLocation');
        console.log('[+] Requesting Location From Mobile App.');
      }
    }, 20000);

  } 
  else if (navigator.geolocation) {
    console.log('[+]: Using Web Browser Location Service.');

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
        console.error('[!] Browser Geolocation Error:', error.message);
      },
      options
    );

  } else {
    console.error('[!] Geolocation is not supported Browser not support');
  }
}


function sendLocationToServer(lat, lon) {
  if (typeof truck_id === 'undefined' || typeof driver_id === 'undefined' || !truck_id || !driver_id || !lat || !lon) {
    return;
  }
  //Using Global Variables.
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