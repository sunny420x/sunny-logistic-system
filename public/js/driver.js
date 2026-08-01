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

        document.getElementById('license_plate').innerText = customers[0].license_plate;
        
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

        // แปลงข้อมูลลูกค้าทั้งหมดเตรียมไว้
        let allCustomers = customers.map(c => {
            const [lon, lat] = c.location.split(',').map(Number);
            return {
                id: c.id,
                customerId: c.customer_id,
                customerName: c.customer_name,
                status: c.status,
                coords: [lon, lat]
            };
        });

        // วาด Marker ลูกค้าทุกคนลงแผนที่ตามปกติ
        allCustomers.forEach(customer => {
            const marker = new ol.Feature({ 
                geometry: new ol.geom.Point(ol.proj.fromLonLat(customer.coords)) 
            });
            let markerIcon = customer.status == 1 ? '/icons/marker-success.png' : '/icons/marker-pending.png';
            marker.setStyle(new ol.style.Style({
                image: new ol.style.Icon({ anchor: [0.5, 1], src: markerIcon, scale: 0.5 }),
                text: new ol.style.Text({
                    text: `${customer.customerId} - ${customer.customerName}`,
                    font: 'bold 13px Kanit',
                    offsetY: -35,
                    fill: new ol.style.Fill({ color: '#000000' }),
                    stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                })
            }));
            vectorSource.addFeature(marker);
        });

        if(allCustomers.every(route => route.status == 1)) {
            statusBarBody.innerHTML += `
            <tr>
                <td colspan="2" class="text-success text-center">🎉 ส่งงานทั้งหมดเรียบร้อยแล้ว</td>
            </tr>`;
            return;
        }

        // --- กรองเฉพาะจุดที่ยังไม่ส่ง (status != 1) มาคำนวณหาตัวที่ใกล้ที่สุด ---
        const pendingCustomers = allCustomers.filter(c => c.status != 1);

        let nextTarget = null;

        if (pendingCustomers.length > 0) {
            // สร้างพิกัดสำหรับเช็คระยะทาง: [จุดปัจจุบัน, ลูกค้าคนที่ 1, ลูกค้าคนที่ 2, ...]
            const coordsString = [
                `${startCoords[0]},${startCoords[1]}`,
                ...pendingCustomers.map(c => `${c.coords[0]},${c.coords[1]}`)
            ].join(';');

            // ใช้ OSRM Table API เพื่อหาระยะทางจากจุดปัจจุบันไปยังทุกจุดที่เหลือ
            const tableUrl = `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0`;
            const tableResponse = await fetch(tableUrl);
            const tableData = await tableResponse.json();

            if (tableData.durations && tableData.durations.length > 0) {
                // durations[0] จะเป็นอาเรย์ของเวลา/ระยะทางจากจุดเริ่มต้น (index 0) ไปยังจุดอื่นๆ (index 1, 2, 3...)
                const distancesFromStart = tableData.durations[0]; 
                
                let minIndex = 1;
                let minVal = distancesFromStart[1];

                for (let i = 2; i < distancesFromStart.length; i++) {
                    if (distancesFromStart[i] < minVal) {
                        minVal = distancesFromStart[i];
                        minIndex = i;
                    }
                }

                // จุดที่ใกล้ที่สุดคือ index ใน pendingCustomers (ต้องลบออก 1 เพราะ index 0 คือจุดเริ่มต้นของเราเอง)
                nextTarget = pendingCustomers[minIndex - 1];
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

                const routeFeature = new ol.Feature({
                    geometry: new ol.geom.LineString(transformedRouteCoords)
                });

                routeFeature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: "#0047AB",
                        width: 5
                    })
                }));
                vectorSource.addFeature(routeFeature);
            }
        }

        // --- จัดเรียงตาราง UI (เอาที่ส่งแล้วไว้ล่างสุด ที่เหลือเอาอันใกล้สุดขึ้นก่อน หรือแสดงตามลำดับ) ---
        // จัดเรียงใหม่โดยเอา nextTarget ขึ้นเป็นคิวแรกสุดในตาราง (เพื่อให้สอดคล้องกับเส้นบนแผนที่)
        let sortedRoute = [...allCustomers].sort((a, b) => {
            if (a.status === 1 && b.status !== 1) return 1;
            if (b.status === 1 && a.status !== 1) return -1;
            if (nextTarget && a.id === nextTarget.id) return -1;
            if (nextTarget && b.id === nextTarget.id) return 1;
            return 0;
        });

        sortedRoute.forEach(route => {
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