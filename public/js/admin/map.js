let map = null
let vectorSource = null;

function initializeMap() {
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
            zoom: 15 
        })
    });
}

async function updateMap(options) {
    try {        
        vectorSource.clear();

        if(options == "customers") {
            const customers = await fetch("/api/admin/getAllCustomersLocation");
            if (!customers.ok) {
                throw new Error("ดึงข้อมูล ลูกค้าจากหลังบ้านไม่สำเร็จ");
            }
            const customers_data = await customers.json();
            customers_data.locations.forEach(customer => {
                const [lon, lat] = customer.location.split(',').map(Number);
                const marker = new ol.Feature({ 
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
                    customerData: customer,
                });
                marker.setId(customer.id || customer._id);

                function createGeoAltSvg(fillColor) {
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="${fillColor}" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                    </svg>`;
                    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
                }

                // 2. นำไปใช้ใน Marker
                const groupColor = customer.color

                marker.setStyle(function(feature, resolution) {
                    // resolution ยิ่งน้อย = ยิ่งซูมเข้าใกล้
                    const isZoomLg = resolution < 8;
                    const isZoomMd = resolution < 14;
                    const isZoomSm = resolution < 20;

                    // สไตล์ตัวอักษรขนาดใหญ่ (ซูมใกล้)
                    const textStyleLg = new ol.style.Text({
                        text: `${customer.customer_name}`,
                        font: 'bold 12px Kanit',
                        offsetY: -32,
                        fill: new ol.style.Fill({ color: '#222' }),
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                    });

                    // สไตล์ตัวอักษรขนาดเล็ก (ซูมปานกลาง)
                    const textStyleMd = new ol.style.Text({
                        text: `${customer.customer_name}`,
                        font: 'bold 11px Kanit',
                        offsetY: -30,
                        fill: new ol.style.Fill({ color: '#222' }),
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 })
                    });

                    const textStyleSm = new ol.style.Text({
                        text: `${customer.group_name}`,
                        font: 'bold 9px Kanit',
                        offsetY: -30,
                        fill: new ol.style.Fill({ color: '#222' }),
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 })
                    });

                    // เลือกว่าจะใช้ Text Style ไหนตามระยะซูม
                    let currentText = undefined
                    if (isZoomLg) {
                        currentText = textStyleLg
                    } else if (isZoomMd) {
                        currentText = textStyleMd
                    } else if (isZoomSm) {
                        currentText = textStyleSm
                    }

                    return new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: createGeoAltSvg(groupColor),
                            scale: 0.8
                        }),
                        text: currentText
                    });
                });
                vectorSource.addFeature(marker);
            });

            const groupedCustomers = {};
            customers_data.locations.forEach(customer => {
                const groupId = customer.group_id || 'default';
                if (!groupedCustomers[groupId]) {
                    groupedCustomers[groupId] = [];
                }
                groupedCustomers[groupId].push(customer);
            });
        }
        if(options == "drivers") {
            const drivers = await fetch("/api/driver/getAllTruckLocation");

            if (!drivers.ok) {
                throw new Error("ดึงข้อมูล คนขับ จากหลังบ้านไม่สำเร็จ");
            }
            const drivers_data = await drivers.json();
            drivers_data.locations.forEach(truck => {
                const marker = new ol.Feature({ 
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([
                        parseFloat(truck.position_longitude),
                        parseFloat(truck.position_latitude)
                    ])) 
                });

                marker.setStyle(new ol.style.Style({
                    image: new ol.style.Circle({ 
                        radius: 8, 
                        fill: new ol.style.Fill({ color: '#0000FF' }), 
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 }) 
                    }),
                    text: new ol.style.Text({
                        text: `${truck.license_plate} - คนขับ ${truck.full_name}`,
                        font: 'bold 13px Kanit',
                        offsetY: -15,
                        fill: new ol.style.Fill({ color: '#000000' }),
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                    })
                }));

                vectorSource.addFeature(marker);
            });
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัปเดตพิกัด:", error);
    }
}

initializeMap();

function selectMark(customerId) {
    if (!customerId) return;

    // 1. ค้นหาหมุดจาก ID
    const marker = vectorSource.getFeatureById(customerId);

    if (marker) {
        // 2. ดึงพิกัด (Geometry) ของหมุดนั้น
        const geometry = marker.getGeometry();
        const coordinate = geometry.getCoordinates();

        // 3. เลื่อนแผนที่ไปที่พิกัดนั้นพร้อมซูมเข้ามา (Animate)
        map.getView().animate({
            center: coordinate, // เลื่อนจุดศูนย์กลางไปที่หมุด
            zoom: 16,           // ระดับการซูม (ปรับตามความเหมาะสม เช่น 15 - 17)
            duration: 1000      // ความเร็ว animation (1000ms = 1 วินาที)
        });

       window.location.href="#map"
    } else {
        console.warn(`ไม่พบหมุดสำหรับ Customer ID: ${customerId}`);
    }
}