import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Chip, Stack } from '@mui/material';
import { DoneRounded, SquareFootRounded, StraightenRounded } from '@mui/icons-material';

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);
    const [lng, setLng] = useState(79.53371217221013);
    const [lat, setLat] = useState(18.717748053758047);
    const [zoom, setZoom] = useState(10);
    const [isMeasure, setIsMeasure] = useState(false);
    const [isArea, setIsArea] = useState(false);

    mapboxgl.accessToken = 'pk.eyJ1Ijoicm9oaXRoeSIsImEiOiJjbHNvdjJkbDUwaW1oMmpvNDJzMmtmc2x4In0.pa-q8L3Ufesjl3qqVCaHwQ';

    useEffect(() => {
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/standard',
            center: [lng, lat],
            zoom: zoom,
            config: {
                basemap: {
                    lightPreset: (() => {
                        const hour = new Date().getHours();
                        if (hour >= 5 && hour < 8) return 'dawn';
                        if (hour >= 8 && hour < 17) return 'day';
                        if (hour >= 17 && hour < 20) return 'dusk';
                        return 'night';
                    })()
                }
            }
        });

        map.current.addControl(new mapboxgl.NavigationControl());
        map.current.addControl(new mapboxgl.ScaleControl());

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });

        const drawTool = new MapboxDraw({
            displayControlsDefault: false,
            controls: { trash: true }
        });

        map.current.on('load', () => {
            map.current.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
                    'fill-extrusion-base': ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
                    'fill-extrusion-opacity': 0.6,
                },
            });
        });

        draw.current = drawTool;

        map.current.addControl(draw.current);

        map.current.on('draw.create', updateMeasurement);
        map.current.on('draw.update', updateMeasurement);
        map.current.on('draw.delete', () => console.log('Measurement cleared'));
    }, []);

    const toggleMeasurement = (type) => {
        if (type === 'line') {
            if (!isMeasure) {
                draw.current.changeMode('draw_line_string');
                setIsArea(false);
            } else {
                draw.current.trash();
            }
            setIsMeasure(!isMeasure);
        } else if (type === 'area') {
            if (!isArea) {
                draw.current.changeMode('draw_polygon');
                setIsMeasure(false);
            } else {
                draw.current.trash();
            }
            setIsArea(!isArea);
        }
    };

    const updateMeasurement = () => {
        const data = draw.current.getAll();
        if (data.features.length > 0) {
            const feature = data.features[0];
            if (feature.geometry.type === 'LineString') {
                const length = turf.length(feature, { units: 'kilometers' });
                console.log(`Total distance: ${length.toFixed(2)} km`);
            } else if (feature.geometry.type === 'Polygon') {
                const area = turf.area(feature);
                console.log(`Total area: ${(area / 1000000).toFixed(2)} sq km`);
            }
        }
    };

    return <>
        <Stack direction='row' spacing={2} sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: 2 }}>
            <Chip icon={isMeasure ? <DoneRounded /> : <StraightenRounded />} label="Length" sx={{ background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('line')}></Chip>
            <Chip icon={isArea ? <DoneRounded /> : <SquareFootRounded />} label="Area" sx={{ background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('area')}></Chip>
        </Stack>
        <div id='map-container' style={{ position: 'relative', height: '100vh' }} ref={mapContainer}></div>
    </>
}
