let map = null
let vectorSource = null;
let isFit = false

function initializeMap(zoom = 15) {
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
            zoom: zoom 
        })
    });
}

function metersBetween(coordA, coordB) {
    const toRad = degrees => degrees * Math.PI / 180;
    const [lon1, lat1] = coordA;
    const [lon2, lat2] = coordB;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function isPointNearStops(point, stops, maxDistanceMeters = 500) {
    return stops.some(stop => {
        let [stopLon, stopLat] = []
        if (!stop.location) return false;
        if(!!stop.temporary_location) {
            [stopLon, stopLat] = stop.temporary_location.split(',').map(Number);
        } else {
            [stopLon, stopLat] = stop.location.split(',').map(Number);
        }
        if (Number.isNaN(stopLon) || Number.isNaN(stopLat)) return false;
        const distance = metersBetween(point, [stopLon, stopLat]);
        return distance <= maxDistanceMeters;
    });
}

async function updateMap(options) {
    try {        
        if(options == "route") {
            const res = await fetch(`/api/admin/getCurrentRoutes?date=${date}&search=${search}&status=${status}`);
            if (!res.ok) {
                throw new Error("ดึงข้อมูล ลูกค้าจากหลังบ้านไม่สำเร็จ");
            }
            const routes = await res.json();
            console.debug('route data fetched', routes.length, routes.map(r => ({id:r.id, group_id:r.group_id, customer_id:r.customer_id})));
            
            vectorSource.clear();
            routes.forEach(route => {
                let [lon, lat] = []
                if(!!route.temporary_location) {
                    [lon, lat] = route.temporary_location.split(',').map(Number);
                } else {
                    [lon, lat] = route.location.split(',').map(Number);
                }
                const marker = new ol.Feature({ 
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
                    customerData: route,
                });
                marker.setId(route.id || route._id);

                const groupColor = route.color

                marker.setStyle(function(feature, resolution) {
                    return new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: createGeoAltSvg(groupColor),
                            scale: 0.8
                        }),
                        text: new ol.style.Text({
                            text: `${route.customer_name}`,
                            font: 'bold 12px Kanit',
                            offsetY: -32,
                            fill: new ol.style.Fill({ color: '#222' }),
                            stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                        })
                    });
                });
                vectorSource.addFeature(marker);
            });

            const points = routes.map(route => {
                let [lon, lat] = []
                if(!!route.temporary_location) {
                    [lon, lat] = route.temporary_location.split(',').map(Number);
                } else {
                    [lon, lat] = route.location.split(',').map(Number);
                }
                return ol.proj.fromLonLat([lon, lat]);
            });
            if (points.length > 0) {
                const extent = ol.extent.boundingExtent(points);
                const center = ol.extent.getCenter(extent);
                let radius = 0;

                points.forEach(point => {
                    const dx = point[0] - center[0];
                    const dy = point[1] - center[1];
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > radius) {
                        radius = distance;
                    }
                });

                radius *= 1.1;

                //Display POI
                if(display_poi) {
                    const circleFeature = new ol.Feature({
                        geometry: new ol.geom.Circle(center, radius)
                    });
    
                    circleFeature.setStyle(
                        new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(33, 150, 243, 0.08)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#2196F3',
                                width: 2
                            })
                        })
                    );
    
                    vectorSource.addFeature(circleFeature);

                    if (display_poi) {
                        poi_list = [];
                        await getPointOfInterest(routes);
                    }
                }

                if (!isFit) {
                    map.getView().fit(extent, {
                        padding: [40, 40, 40, 40],
                        maxZoom: 15,
                        duration: 800
                    });

                    isFit = true;
                }
            }
        }
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

                // createGeoAltSvg is defined above

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
            // fetch ongoing/assigned destinations for drivers
            let ongoing_data = { status: 'error', data: [] };
            try {
                const ongoingRes = await fetch('/api/driver/ongoingDrivers');
                if (ongoingRes.ok) {
                    ongoing_data = await ongoingRes.json();
                }
            } catch (e) {
                console.warn('ไม่สามารถดึงข้อมูลปลายทางคนขับได้', e);
            }

            const assignedByTruck = (ongoing_data.data || []).reduce((acc, item) => {
                const key = item.truck_id || item.license_plate;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            await Promise.all(drivers_data.locations.map(async truck => {
                const truckLon = parseFloat(truck.position_longitude);
                const truckLat = parseFloat(truck.position_latitude);
                const marker = new ol.Feature({ 
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([truckLon, truckLat])) 
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

                const assignedStops = assignedByTruck[truck.truck_id] || assignedByTruck[truck.license_plate] || [];
                if (assignedStops.length === 0) {
                    return;
                }

                const orderedStops = assignedStops.sort((a, b) => {
                    if (a.time === b.time) return a.customer_name.localeCompare(b.customer_name);
                    return a.time.localeCompare(b.time);
                });

                const routeCoords = [
                    `${truckLon},${truckLat}`,
                    ...orderedStops.map(stop => stop.location.trim())
                ].join(';');

                
                try {
                    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${routeCoords}?overview=full&geometries=geojson`;
                    const routeResponse = await fetch(routeUrl);
                    const routeData = await routeResponse.json();

                    if (routeData.routes && routeData.routes.length > 0) {
                        const routeCoordinates = routeData.routes[0].geometry.coordinates;
                        const transformedRouteCoords = routeCoordinates.map(coord => ol.proj.fromLonLat(coord));
                        const routeLine = new ol.Feature({
                            geometry: new ol.geom.LineString(transformedRouteCoords)
                        });
                        routeLine.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({ color: assignedStops[0].color, width: 4 })
                        }));
                        vectorSource.addFeature(routeLine);
                        try {
                            const extent = ol.extent.boundingExtent(transformedRouteCoords);
                            if(!isFit) {
                                map.getView().fit(extent, { padding: [40,40,40,40], maxZoom: 15, duration: 800 });
                                isFit = true
                            }
                        } catch (e) {
                            console.warn('ไม่สามารถย่อ/ขยายมุมมองเส้นทางได้', e);
                        }
                    }
                } catch (e) {
                    console.warn('ไม่สามารถดึงเส้นทาง OSRM ได้สำหรับ', truck.license_plate, e);
                }
                // Fallback: if OSRM didn't return a route, fit view to truck + stops
                try {
                    const points = [ol.proj.fromLonLat([truckLon, truckLat])].concat(orderedStops.map(s => {
                        const [lon, lat] = s.location.split(',').map(Number);
                        return ol.proj.fromLonLat([lon, lat]);
                    }));
                    if (points.length > 0) {
                        const extent = ol.extent.boundingExtent(points);
                        if(!isFit) {
                            map.getView().fit(extent, { padding: [40,40,40,40], maxZoom: 15, duration: 800 });
                            isFit = true
                        }
                    }
                } catch (e) {
                    // ignore
                }
                orderedStops.forEach(assigned => {
                    const [destLon, destLat] = assigned.location.split(',').map(Number);
                    const assignedColor = assigned.color || assigned.customer_group_color || '#2E8B57';
                    const destFeature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.fromLonLat([destLon, destLat])),
                        name: assigned.customer_name
                    });
                    destFeature.setStyle(new ol.style.Style({
                        zIndex: 2,
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: createGeoAltSvg(assignedColor),
                            scale: 0.8
                        }),
                        text: new ol.style.Text({
                            text: `${assigned.customer_name}`,
                            font: 'bold 12px Kanit',
                            offsetY: -28,
                            fill: new ol.style.Fill({ color: '#222' }),
                            stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                        })
                    }));
                    vectorSource.addFeature(destFeature);
                });

                if (display_poi) {
                    await getPointOfInterest(orderedStops)
                }
            }));
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัปเดตพิกัด:", error);
    }
}

function setMarkOnMap(lon, lat) {
    const parsedLon = parseFloat(lon);
    const parsedLat = parseFloat(lat);

    if (isNaN(parsedLon) || isNaN(parsedLat)) return;

    vectorSource.clear();

    const coord = ol.proj.fromLonLat([parsedLon, parsedLat]);

    const marker = new ol.Feature({ 
        geometry: new ol.geom.Point(coord),
    });

    marker.setStyle(function(feature, resolution) {
        return new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: createGeoAltSvg('#ff0000'),
            scale: 0.8
        }),
        });
    });

    vectorSource.addFeature(marker);

    if (map) {
        map.getView().setCenter(coord);
    }
}

function selectMark(customerId, moveToMap = false) {
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

        if(moveToMap) {
            window.location.href="#map"
        }
    } else {
        console.warn(`ไม่พบหมุดสำหรับ Customer ID: ${customerId}`);
    }
}

async function getPointOfInterest(orderedStops) {
    const poiGroupIds = [...new Set(orderedStops.map(s => s.group_id).filter(Boolean))];
    console.debug('getPointOfInterest group IDs', poiGroupIds, 'display_poi=', display_poi);
    if (poiGroupIds.length === 0) {
        console.warn('ไม่พบ group_id สำหรับ POI ใน poiGroupIds', orderedStops);
        if (display_poi && typeof renderPoiList === 'function') {
            renderPoiList();
        }
        return;
    }
    await Promise.all(poiGroupIds.map(async groupId => {
        try {
            const pointOfInterestRes = await fetch(`/api/getPointOfInterest/${groupId}`, {
                credentials: 'same-origin'
            });
            if (!pointOfInterestRes.ok) {
                const text = await pointOfInterestRes.text();
                console.warn('ไม่สามารถดึง POI ได้', pointOfInterestRes.status, pointOfInterestRes.statusText, 'groupId=', groupId, 'body=', text.substring(0, 200));
                return;
            }

            const contentType = pointOfInterestRes.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await pointOfInterestRes.text();
                console.warn('POI response ไม่ใช่ JSON', contentType, 'groupId=', groupId, 'body=', text.substring(0, 200));
                return;
            }

            const pointOfInterest = await pointOfInterestRes.json();
            const poiLocations = pointOfInterest.locations || [];
            if (poiLocations.length === 0) {
                console.warn('POI ไม่มี location สำหรับ group_id', groupId, pointOfInterest);
            }

            poiLocations.forEach(data => {
                if (!data.location) {
                    console.warn('POI location ว่างสำหรับ data', data);
                    return;
                }
                const [destLon, destLat] = data.location.split(',').map(Number);
                if (Number.isNaN(destLon) || Number.isNaN(destLat)) {
                    console.warn('POI location ไม่ถูกต้อง', data.location, data);
                    return;
                }

                const poiPoint = [destLon, destLat];
                const isSamePoint = orderedStops.some(stop => {
                    if (!stop.location) return false;
                    const [stopLon, stopLat] = stop.location.split(',').map(Number);
                    if (Number.isNaN(stopLon) || Number.isNaN(stopLat)) return false;
                    return metersBetween(poiPoint, [stopLon, stopLat]) <= 1;
                });
                if (isSamePoint) {
                    return;
                }

                const nearStops = isPointNearStops(poiPoint, orderedStops, 800);
                if (!nearStops) {
                    return;
                }

                poi_list.push({
                    id: data.id,
                    customer_id: data.customer_id,
                    customer_name: data.customer_name,
                    phone_number: data.phone_number
                });
                console.debug('POI added', data.customer_id, data.customer_name, 'group_id=', groupId);

                const destFeature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat(poiPoint)),
                    name: data.customer_name
                });
                destFeature.setStyle(new ol.style.Style({
                    zIndex: 1,
                    image: new ol.style.Icon({
                        anchor: [0.5, 1],
                        src: createGeoAltSvg('#8B639B'),
                        scale: 0.7
                    }),
                    text: new ol.style.Text({
                        text: `${data.customer_name}`,
                        font: 'bold 12px Kanit',
                        offsetY: -28,
                        fill: new ol.style.Fill({ color: '#222' }),
                        stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 3 })
                    })
                }));
                vectorSource.addFeature(destFeature);
            });
        } catch (e) {
            console.warn('เกิดข้อผิดพลาดในการดึง POI', e, 'groupId=', groupId);
        }
    }));

    if (display_poi && typeof renderPoiList === 'function') {
        console.debug('renderPoiList after POI fetch', poi_list.length);
        renderPoiList();
    }
}

//สำหรับประเทศไทยค่า Longtitude จะมากกว่า Latitude เสมอ
function validateLocation() {
    const locationInput = document.querySelector('input[name="location"]')
    const locationValue = locationInput.value.trim().replace(" ", '')
    if(locationValue.split(',').length != 2) {
        return
    } else {
        if (locationValue.split(',')[0] < locationValue.split(',')[1]) {
            if(locationValue.split(',')[0] != "" && locationValue.split(',')[1] != "") {
            locationInput.value = `${locationValue.split(',')[1]},${locationValue.split(',')[0]}`
            }
            setMarkOnMap(locationValue.split(',')[1], locationValue.split(',')[0])
        } else {
            setMarkOnMap(locationValue.split(',')[0], locationValue.split(',')[1])
        }
    }
}

function validateTempLocation() {
    const locationInput = document.querySelector('input[name="temporary_location"]')
    const locationValue = locationInput.value.trim().replace(" ", '')
    if(locationValue.split(',').length != 2) {
        return
    } else {
        if (locationValue.split(',')[0] < locationValue.split(',')[1]) {
            if(locationValue.split(',')[0] != "" && locationValue.split(',')[1] != "") {
            locationInput.value = `${locationValue.split(',')[1]},${locationValue.split(',')[0]}`
            }
            setMarkOnMap(locationValue.split(',')[1], locationValue.split(',')[0])
        } else {
            setMarkOnMap(locationValue.split(',')[0], locationValue.split(',')[1])
        }
    }
}

function createGeoAltSvg(fillColor) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="${fillColor}" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function formatPhoneNumber(phone_number) {
    if(phone_number != "-" || phone_number != "") {
        return phone_number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    return phone_number
}