let map = null;
let vectorSource = null;
let truck_id = null;
let driver_id = null;

let routes = null
let allRoutes = null;
let nextTarget = null;

let customerMarkersInitialized = false;

function initMap() {
    vectorSource = new ol.source.Vector();
    const vectorLayer = new ol.layer.Vector({ source: vectorSource });

    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({ source: new ol.source.OSM() }),
            vectorLayer
        ],
        view: new ol.View({ 
            center: ol.proj.fromLonLat([98.9817, 18.7883]), 
            zoom: 14 
        })
    });
}

async function updateDriverMap() {
    try {
        const response = await fetch("/api/driver/getMyRoute");

        if (!response.ok) {
            throw new Error("ดึงข้อมูลจากหลังบ้านไม่สำเร็จ");
        }

        routes = await response.json();

        truck_id = routes[0].truck_id;

        document.getElementById('license_plate').innerText = routes[0].license_plate;
        // vectorSource.clear();

        const startCoords = [parseFloat(position_longitude), parseFloat(position_latitude)];
        const startTransformed = ol.proj.fromLonLat(startCoords);
        
        let driverMarker = vectorSource.getFeatureById('current-location');

        if (!driverMarker) {
            driverMarker = new ol.Feature({
                geometry: new ol.geom.Point(startTransformed)
            });
            driverMarker.setId('current-location');
            driverMarker.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({
                        color: '#0000FF'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#FFFFFF',
                        width: 2
                    })
                })
            }));
            vectorSource.addFeature(driverMarker);
        } else {
            driverMarker.getGeometry().setCoordinates(startTransformed);
        }

        if (routes.some(route => route.status == 0)) {            
            vectorSource.addFeature(driverMarker);
        }

        initRoute();

        if (!customerMarkersInitialized) {
            customerMarkersInitialized = true;

            drawCustomerMarkers(allRoutes);
            await calculateRoutes(allRoutes, startCoords);
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดแผนที่และเส้นทาง:", error);
    }
}

function initRoute() {
    // แปลงข้อมูลลูกค้าทั้งหมดเตรียมไว้
    allRoutes = routes.map(route => {
        let [lon, lat] = []
        if(!!route.temporary_location) {
            [lon, lat] = route.temporary_location.split(',').map(Number);
        } else {
            [lon, lat] = route.location.split(',').map(Number);
        }

        return {
            id: route.id,
            customerId: route.customer_id,
            customerName: route.customer_name,
            time: route.time,
            status: route.status,
            location_note: route.location_note,
            driver_note: route.driver_note,
            arrival_at_warehouse: route.arrival_at_warehouse,
            coords: [lon, lat],
            distanceFromMe: null // เพิ่มตัวแปรเก็บระยะทาง
        };
    });
}

function drawCustomerMarkers() {
    initRoute()
    allRoutes.forEach(route => {
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat(route.coords)
            )
        });
        marker.setId(`customer-${route.id}`);
        const markerIcon =
            route.status == 1
                ? '/icons/marker-success.png'
                : '/icons/marker-pending.png';
        marker.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: markerIcon,
                scale: 0.5
            }),
            text: new ol.style.Text({
                text: `${route.customerId} ${route.customerName}`,
                font: 'bold 13px Kanit',
                offsetY: -35,
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#FFFFFF',
                    width: 3
                })
            })
        }));
        vectorSource.addFeature(marker);
    });
    updateRouteTable()
}

async function calculateRoutes() {
    const pendingRoutes = allRoutes.filter(c => c.status != 1);

    let startCoords = [parseFloat(position_longitude), parseFloat(position_latitude)]

    if (pendingRoutes.length > 0) {
        const coordsString = [
            `${startCoords[0]},${startCoords[1]}`,
            ...pendingRoutes.map(c => `${c.coords[0]},${c.coords[1]}`)
        ].join(';');

        // เพิ่ม &annotations=distance เพื่อดึงระยะทางหน่วยเป็น "เมตร"
        const tableUrl = `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0&annotations=distance`;
        const tableResponse = await fetch(tableUrl);
        const tableData = await tableResponse.json();

        if (tableData.distances && tableData.distances.length > 0) {
            const distancesFromStart = tableData.distances[0]; 
            
            let minIndex = 1;
            let minVal = distancesFromStart[1];

            // วนลูปเก็บระยะทางเข้าสู่ลูกค้าแต่ละคน และหาจุดที่ใกล้ที่สุด
            for (let i = 1; i < pendingRoutes.length + 1; i++) {
                pendingRoutes[i - 1].distanceFromMe = distancesFromStart[i];

                if (distancesFromStart[i] < minVal) {
                    minVal = distancesFromStart[i];
                    minIndex = i;
                }
            }

            nextTarget = pendingRoutes[minIndex - 1];
        }
    }

    // ถ้าหาจุดถัดไปเจอ ให้ดึงเส้นทางเฉพาะจุดปัจจุบันไปหาจุดนั้นมาวาด
    if (nextTarget) {
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${nextTarget.coords[0]},${nextTarget.coords[1]}?overview=full&geometries=geojson`;
        const routeResponse = await fetch(routeUrl);
        const routeData = await routeResponse.json();
        if (routeData.routes && routeData.routes.length > 0) {
            const singleRouteCoords = routeData.routes[0].geometry.coordinates;
            const transformedRouteCoords = singleRouteCoords.map(coord => ol.proj.fromLonLat(coord));

            let routeFeature = vectorSource.getFeatureById('current-route');
            if (!routeFeature) {
                routeFeature = new ol.Feature({
                    geometry: new ol.geom.LineString(transformedRouteCoords)
                });
                routeFeature.setId('current-route');
                routeFeature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: "#0047AB",
                        width: 5
                    })
                }));
                vectorSource.addFeature(routeFeature);
            } else {
                routeFeature
                    .getGeometry()
                    .setCoordinates(transformedRouteCoords);
            }
        }
    }
}

function updateRouteTable() {
    let sortedRoute = [...allRoutes].sort((a, b) => {
        if (a.status === 1 && b.status !== 1) return 1;
        if (b.status === 1 && a.status !== 1) return -1;
        if (nextTarget && a.id === nextTarget.id) return -1;
        if (nextTarget && b.id === nextTarget.id) return 1;
        return 0;
    });

    const statusBarBody = document.getElementById("statusBarBody");
    if (statusBarBody) statusBarBody.innerHTML = "";
    
    sortedRoute.forEach(route => {
        if (route.status == 1) {
            statusBarBody.innerHTML += `
            <tr style="opacity: 0.4;">
                <td>${route.customerId} ${route.customerName}</td>
                <td>✅ ส่งแล้ว</td>
            </tr>`;
        } else {
            // แปลงระยะทางจากเมตรเป็นกิโลเมตร (ถ้ามีค่า)
            let distText = "";
            let time = `<span class="badge bg-secendary">${route.time}</span>`
            if (route.distanceFromMe !== null && route.distanceFromMe !== undefined) {
                let km = (route.distanceFromMe / 1000).toFixed(1);
                distText = ` <span class="text-muted" style="font-size: 0.85em;">(~${km} กม.)</span>`;
            }

            // เช็คว่าเป็นจุดถัดไปหรือไม่
            let isNext = (nextTarget && route.id === nextTarget.id);
            let badge = isNext ? ` <span class="badge bg-primary fw-normal ms-2">จุดถัดไป</span>` : "";

            statusBarBody.innerHTML += `
            <tr>
                <td>
                ${route.customerId} ${route.customerName}${distText}${badge} <span class="badge bg-secondary fw-normal">${route.time}</span>
                </td>
                <td>
                    <a href="https://map.google.co.th/?q=${route.coords[1]},${route.coords[0]}" class="btn btn-light" target="_blank">📍 แผนที่</a>
                    <button class="btn btn-light" onclick="uploadArrivalImage('${route.id}')">✅ ส่งแล้ว</button>
                </td>
            </tr>
            `;
            if(route.location_note) {
                statusBarBody.innerHTML += `
                <tr>
                    <td colspan="2"><p><strong>หมายเหตุสถานที่:</strong> ${route.location_note || "-"}</p></td>
                </tr>`
            }
            if(route.driver_note) {
                statusBarBody.innerHTML += `
                <tr>
                    <td colspan="2"><p><strong>หมายเหตุคนส่งของ:</strong> ${route.driver_note || "-"}</p></td>
                </tr>`
            }
        }
    });

    if(allRoutes.every(route => route.status == 1)) {
        statusBarBody.innerHTML = ""
        if(!allRoutes[0].arrival_at_warehouse) {
            statusBarBody.innerHTML += `
            <tr>
                <td class="text-success text-center">🎉 ส่งงานทั้งหมดเรียบร้อยแล้ว</td>
                <td><button class="btn btn-primary" onclick="arrivalAtWarehouse([${allRoutes.map(route => route.id)}])">✅ ฉันกลับมาถึงโกดังสินค้าแล้ว</td>
            </tr>`;
        } else {
            statusBarBody.innerHTML += `
            <tr>
                <td colspan="2" class="text-success text-center">🎉 ส่งงานทั้งหมดเรียบร้อยแล้ว</td>
            </tr>`;
        }
        return;
    }
}

// Initialize
initMap();

async function finishDelivery(route_id) {
    if (!route_id) {
        console.error("⚠️ ไม่สามารถส่งงานได้เนื่องจากไม่มี route_id");
        return;
    }

    fetch(`/api/finishDelivery/${route_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`เซิร์ฟเวอร์ตอบกลับด้วยสถานะ: ${response.status}`);
            }
            return response.json();
        })
        .then(async data => {
            console.log("📥 ข้อมูลตอบกลับจากเซิร์ฟเวอร์:", data);
            if (data.status == 'success') {
                vectorSource.clear();

                calculateRoutes().then(async() => {
                    await updateDriverMap()
                    updateRouteTable()
                    drawCustomerMarkers()
                    updateRouteTable()
                })
            }
        })
        .catch(error => {
            console.error("❌ เกิดข้อผิดพลาดในการ Fetch ข้อมูล:", error);
        });
}

function arrivalAtWarehouse(routes) {
    fetch(`/api/arrivalAtWarehouse`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            routes: routes
        })
    })
    .then(response => {
        if(!response.ok) {
            throw new Error(`เซิร์ฟเวอร์ตอบกลับด้วยสถานะ: ${response.status}`)
        }
        return response.json();
    })
    .then(data => {
        if(data.status == 'success') {
            vectorSource.clear();
            
            calculateRoutes().then(async() => {
                await updateDriverMap()
                updateRouteTable()
                drawCustomerMarkers()
                updateRouteTable()
            })
        }
    })
    .catch(error => {
        console.error("❌ เกิดข้อผิดพลาดในการ Fetch ข้อมูล:", error);
    })
}