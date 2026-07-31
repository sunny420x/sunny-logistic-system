let position_latitude;
let position_longitude;

function getUserLocation() {
  // 1. Check if the browser supports the Geolocation API
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by your browser.");
    return;
  }

  // 2. Define configuration options
  const options = {
    enableHighAccuracy: true, // Uses GPS if available for better accuracy
    timeout: 5000,            // Time in ms to wait before throwing a timeout error
    maximumAge: 0             // Forces the browser to get a fresh location instead of a cached one
  };

  // 3. Request the coordinates
  navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
}

// Handles successful location retrieval
function successCallback(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy; // Accuracy radius in meters

  console.log(`Latitude: ${latitude}`);
  console.log(`Longitude: ${longitude}`);
  console.log(`Accuracy: within ${accuracy} meters`);
}

// Handles errors or user rejection
function errorCallback(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.error("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.error("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.error("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.error("An unknown error occurred.");
      break;
  }
}

// Execute the function
getUserLocation();

// Start tracking the live position
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    console.log(`Updated Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`);
    position_latitude = position.coords.latitude
    position_longitude = position.coords.longitude
    loadMyRoute()
    sendLocationToServer(truck_id, position_latitude, position_longitude)
  },
  (error) => console.error(error),
  { enableHighAccuracy: true }
);

// Stop
// navigator.geolocation.clearWatch(watchId);

function sendLocationToServer(truck_id = 0, position_latitude, position_longitude) {
    fetch(`/api/saveLocation/${truck_id}/${position_latitude}/${position_longitude}`)
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