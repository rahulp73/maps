import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './Map.css';
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

    const getLightPreset = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return 'dawn';
        if (hour >= 8 && hour < 17) return 'day';
        if (hour >= 17 && hour < 20) return 'dusk';
        return 'night';
    };

    useEffect(() => {
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/standard',
            center: [lng, lat],
            zoom: zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl());
        map.current.addControl(new mapboxgl.FullscreenControl());
        map.current.addControl(new mapboxgl.ScaleControl());
        map.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            })
        );
        map.current.touchZoomRotate.enable();
        map.current.touchZoomRotate.enableRotation();

        map.current.on('styledata', () => {
            const currentPreset = getLightPreset();
            map.current.setConfigProperty('basemap', 'lightPreset', currentPreset);
        });

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });

        map.current.on('load', () => {
            const firstLabelLayerId = map.current.getStyle().layers.find(layer => layer.type === 'symbol').id;
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
            }, firstLabelLayerId);
        });
        const drawTool = new MapboxDraw({
            displayControlsDefault: false,
            controls: { trash: true }
        });

        draw.current = drawTool;

        map.current.on('draw.create', updateDistance);
        map.current.on('draw.update', updateDistance);
    }, []);

    const toggleDrawing = () => {
        if (!map.current.hasControl(draw.current)) {
            map.current.addControl(draw.current);
            // Add a small delay to ensure control is initialized
            setTimeout(() => {
                draw.current.changeMode('draw_line_string');
            }, 100);
        } else {
            map.current.removeControl(draw.current);
        }
        setIsMeasure(!isMeasure);
    };
    const updateDistance = () => {
        const data = draw.current.getAll();
        if (data.features.length > 0) {
            const line = data.features[0];
            const length = turf.length(line, { units: 'kilometers' });
            console.log(`Line length: ${length.toFixed(2)} km`);
        }
    };

    return <>
        <Stack direction='row' spacing={2} sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: 2 }}>
            <Chip icon={isMeasure ? <DoneRounded /> : <StraightenRounded />} label="Length" sx={{ background: 'white' }} onClick={() => toggleDrawing()}></Chip>
            <Chip icon={isArea ? <DoneRounded /> : <SquareFootRounded />} label="Area" sx={{ background: 'white' }} onClick={() => setIsArea(!isArea)}></Chip>
        </Stack>
        <div id='map-container' style={{ position: 'relative', height: '100vh' }} ref={mapContainer}></div>
    </>
}
