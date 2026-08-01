let map = null;
let vectorSource = null;
let truck_id = null;
let driver_id = null;

// 1. ฟังก์ชันสร้าง Map ครั้งแรกครั้งเดียว
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

async function loadMyRoute() {
    try {
        const response = await fetch("/api/driver/getMyRoute");

        const statusBarBody = document.getElementById("statusBarBody");
        if (statusBarBody) statusBarBody.innerHTML = "";

        if (!response.ok) {
            throw new Error("ดึงข้อมูลจากหลังบ้านไม่สำเร็จ");
        }

        const customers = await response.json();

        truck_id = customers[0].truck_id;

        document.getElementById('license_plate').innerText = customers[0].license_plate
        document.getElementById('weight').innerText = customers[0].weight
        
        vectorSource.clear();

        const startCoords = [parseFloat(position_longitude), parseFloat(position_latitude)];
        const startTransformed = ol.proj.fromLonLat(startCoords);
        
        const startMarker = new ol.Feature({ geometry: new ol.geom.Point(startTransformed) });
        startMarker.setStyle(new ol.style.Style({
            image: new ol.style.Circle({ 
                radius: 8, 
                fill: new ol.style.Fill({ color: '#0000FF' }), 
                stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 }) 
            }),
            text: new ol.style.Text({ 
                text: 'จุดเริ่มต้น', 
                font: 'bold 12px Kanit', 
                stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 }), 
                offsetY: -15 
            })
        }));

        if (customers.some(customer => customer.status == 0)) {                    
            vectorSource.addFeature(startMarker);
        }

        customers.forEach(customer => {
            const [lon, lat] = customer.location.split(',').map(Number);
            const marker = new ol.Feature({ 
                geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])) 
            });
            let markerIcon = customer.status == 1 ? '/icons/marker-success.png' : '/icons/marker-pending.png';
            marker.setStyle(new ol.style.Style({
                image: new ol.style.Icon({ anchor: [0.5, 1], src: markerIcon, scale: 0.5 }),
                text: new ol.style.Text({
                    text: `${customer.customer_id} - ${customer.customer_name}`,
                    font: 'bold 13px Kanit',
                    offsetY: -35,
                    fill: new ol.style.Fill({ color: '#000000' }),
                    stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                })
            }));
            vectorSource.addFeature(marker);
        });

        if(customers.every(route => route.status == 1)) {
            statusBarBody.innerHTML += `
            <tr>
                <td colspan="2" class="text-success text-center">🎉 ส่งงานทั้งหมดเรียบร้อยแล้ว</td>
            </tr>`;
        }

        const allCoordsStrings = [
            `${startCoords[0]},${startCoords[1]}`,
            ...customers.map(c => {
                const [lon, lat] = c.location.split(',');
                return `${lon.trim()},${lat.trim()}`;
            })
        ];
        const pathCoordinates = allCoordsStrings.join(';');

        const tripUrl = `https://router.project-osrm.org/trip/v1/driving/${pathCoordinates}?source=first&destination=any&roundtrip=false&overview=full&geometries=geojson`;

        const osrmResponse = await fetch(tripUrl);
        const data = await osrmResponse.json();

        if (data.trips && data.trips.length > 0) {
            const routeCoords = data.trips[0].geometry.coordinates;
            const transformedRouteCoords = routeCoords.map(coord => ol.proj.fromLonLat(coord));

            const routeFeature = new ol.Feature({
                geometry: new ol.geom.LineString(transformedRouteCoords)
            });

            if (customers.some(customer => customer.status == 0)) {                    
                const lineColor = "#0047AB";
                routeFeature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: lineColor,
                        width: 5
                    })
                }));
                vectorSource.addFeature(routeFeature);
            }

            // --- B. จัดลำดับคิวและอัปเดตลง Table UI ---
            const waypoints = data.waypoints;
            const sortedRoute = waypoints
                .map(wp => {
                    const inputIndex = wp.waypoint_index;
                    const queueOrder = wp.trips_index;

                    let customerData = null;

                    if (inputIndex === 0) {
                        customerData = { id: 'START', name: 'World Chemical' };
                    } else {
                        const actualCustomer = customers[inputIndex - 1];
                        if (actualCustomer) {
                            customerData = {
                                id: actualCustomer.customer_id,
                                status: actualCustomer.status,
                                route_id: actualCustomer.id,
                                name: actualCustomer.customer_name
                            };
                        } else {
                            customerData = { id: 'UNKNOWN', name: 'ไม่พบข้อมูลลูกค้า' };
                        }
                    }

                    return {
                        id: customerData.route_id,
                        status: customerData.status,
                        queueNumber: queueOrder,
                        customerId: customerData.id,
                        customerName: customerData.name,
                        coords: wp.location,
                        distance: wp.distance
                    };
                })
                .sort((a, b) => {
                    if (a.customerId === 'START') return -1;
                    if (b.customerId === 'START') return 1;
                    if (a.status === 1 && b.status !== 1) return 1;
                    if (b.status === 1 && a.status !== 1) return -1;
                    return a.queueNumber - b.queueNumber;
                });

            sortedRoute.forEach((route, index) => {
                if (index === 0) return;

                if (route.status == 1) {
                    statusBarBody.innerHTML += `
                    <tr style="opacity: 0.4;">
                        <td>${route.customerId} - ${route.customerName}</td>
                        <td>✅ ส่งแล้ว</td>
                    </tr>`;
                } else {
                    statusBarBody.innerHTML += `
                    <tr>
                        <td>${route.customerId} - ${route.customerName}</td>
                        <td>
                            <a href="https://map.google.co.th/?q=${route.coords[1]},${route.coords[0]}" class="btn btn-light" target="_blank">📍 แผนที่</a>
                            <button class="btn btn-light" onclick="finishDelivery('${route.id}')">✅ ส่งแล้ว</button>
                        </td>
                    </tr>`;
                }
            });
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดแผนที่และเส้นทาง:", error);
    }
}

initMap();

function finishDelivery(route_id) {
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
        .then(data => {
            console.log("📥 ข้อมูลตอบกลับจากเซิร์ฟเวอร์:", data);
            if (data.status == 'success') {
                loadMyRoute();
            }
        })
        .catch(error => {
            console.error("❌ เกิดข้อผิดพลาดในการ Fetch ข้อมูล:", error);
        });
}