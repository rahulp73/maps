import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { styled } from '@mui/material/styles';
import {
    Chip,
    Stack,
    Snackbar,
    Menu,
    MenuItem,
    Button,
    Drawer,
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Divider,
    IconButton
} from '@mui/material';
import {
    CloudUploadRounded,
    DoneRounded,
    Queue,
    SquareFootRounded,
    StraightenRounded,
    Layers,
    Terrain,
    Satellite,
    Map as MapIcon,
    ChevronLeft
} from '@mui/icons-material';
import { kml } from '@tmcw/togeojson';

const ITEM_HEIGHT = 48;
const DRAWER_WIDTH = 300;

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);
    const [lng, setLng] = useState(79.53371217221013);
    const [lat, setLat] = useState(18.717748053758047);
    const [zoom, setZoom] = useState(10);
    const [isMeasure, setIsMeasure] = useState(false);
    const [isArea, setIsArea] = useState(false);
    const [measurement, setMeasurement] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Layer toggle states
    const [layers, setLayers] = useState({
        satellite: false
    });
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN; // Set your own mapbox token here

    // Initialize the map
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
                        return 'day';
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
        map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }));

        const drawTool = new MapboxDraw({
            displayControlsDefault: false,
            // controls: { trash: true }
        });

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });

        draw.current = drawTool;

        map.current.addControl(draw.current);

        map.current.on('draw.create', updateMeasurement);
        map.current.on('draw.update', updateMeasurement);
        map.current.on('draw.delete', () => {
            setMeasurement('');
            console.log('Measurement cleared');
        });

        map.current.on('draw.selectionchange', updateMeasurement);

        // Initialize map layers once the map is loaded
        map.current.on('load', () => {
            // Add terrain source
            map.current.addSource('mapbox-terrain', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });

            // Add Bhuvan WMS source
            map.current.addSource('bhuvan-wms', {
                'type': 'raster',
                'tiles': [
                    'http://bhuvan5.nrsc.gov.in/bhuvan/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=india_outline&SRS=EPSG:4326&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-4326}'
                ],
                'tileSize': 256
            });

            // Add satellite source
            map.current.addSource('mapbox-satellite', {
                'type': 'raster',
                'url': 'mapbox://mapbox.satellite',
                'tileSize': 256
            });
        });
    }, []);

    // Handle layer toggle changes
    useEffect(() => {
        if (!map.current || !map.current.loaded()) return;

        // Handle satellite layer
        if (layers.satellite) {
            if (!map.current.getLayer('satellite-layer')) {
                map.current.addLayer({
                    'id': 'satellite-layer',
                    'type': 'raster',
                    'source': 'mapbox-satellite',
                    'paint': {
                        'raster-opacity': 0.6
                    }
                });
            }
        } else {
            if (map.current.getLayer('satellite-layer')) {
                map.current.removeLayer('satellite-layer');
            }
        }
    }, [layers]);

    const toggleMeasurement = (type) => {
        draw.current.deleteAll();
        setMeasurement('');
        if (type === 'line') {
            if (!isMeasure) {
                draw.current.changeMode('draw_line_string');
                setIsArea(false);
            } else {
                draw.current.deleteAll();
                setMeasurement('');
            }
            setIsMeasure(!isMeasure);
        } else if (type === 'area') {
            if (!isArea) {
                draw.current.changeMode('draw_polygon');
                setIsMeasure(false);
            } else {
                draw.current.deleteAll();
                setMeasurement('');
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
                setMeasurement(`Distance: ${length.toFixed(2)} km`);
            } else if (feature.geometry.type === 'Polygon') {
                const area = turf.area(feature);
                const roundedArea = (area / 1000000).toFixed(2);
                setMeasurement(`Area: ${roundedArea} sq km`);
            }
        } else {
            setMeasurement('');
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                if (fileExtension === 'geojson' || fileExtension === 'json') {
                    const geojsonData = JSON.parse(e.target.result);
                    addGeoJSONToMap(geojsonData);
                } else if (fileExtension === 'kml') {
                    const kmlData = new DOMParser().parseFromString(e.target.result, 'application/xml');
                    const geojsonData = kml(kmlData);
                    addGeoJSONToMap(geojsonData);
                } else {
                    alert('Unsupported file type. Please upload a .geojson or .kml file.');
                }
            };
            reader.readAsText(file);
            handleClose();
        }
    };

    const addGeoJSONToMap = (geoJSONData) => {
        // Remove existing layer and source if they exist
        if (map.current.getLayer('uploadedGeoJSON')) {
            map.current.removeLayer('uploadedGeoJSON');
        }
        if (map.current.getSource('uploadedGeoJSON')) {
            map.current.removeSource('uploadedGeoJSON');
        }

        // Add the new source and layer
        map.current.addSource('uploadedGeoJSON', {
            type: 'geojson',
            data: geoJSONData
        });

        // Add separate layers for different geometry types
        if (hasPoints(geoJSONData)) {
            map.current.addLayer({
                id: 'uploadedGeoJSON-points',
                type: 'circle',
                source: 'uploadedGeoJSON',
                filter: ['==', '$type', 'Point'],
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#ff0000',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        }

        if (hasLines(geoJSONData)) {
            map.current.addLayer({
                id: 'uploadedGeoJSON-lines',
                type: 'line',
                source: 'uploadedGeoJSON',
                filter: ['==', '$type', 'LineString'],
                paint: {
                    'line-color': '#214263',
                    'line-width': 3
                }
            });
        }

        if (hasPolygons(geoJSONData)) {
            map.current.addLayer({
                id: 'uploadedGeoJSON-polygons',
                type: 'fill',
                source: 'uploadedGeoJSON',
                filter: ['==', '$type', 'Polygon'],
                paint: {
                    'fill-color': '#214263',
                    'fill-opacity': 0.4,
                    'fill-outline-color': '#000000'
                }
            });
        }

        // Fit the map to the GeoJSON bounds
        const bounds = new mapboxgl.LngLatBounds();
        geoJSONData.features.forEach((feature) => {
            if (feature.geometry) {
                const coords = getAllCoordinates(feature.geometry);
                coords.forEach(coord => bounds.extend(coord));
            }
        });

        if (!bounds.isEmpty()) {
            map.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 16
            });
        }
    };

    // Helper functions for geometry type checking
    const hasPoints = (geojson) => {
        return geojson.features.some(f =>
            f.geometry && (f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint')
        );
    };

    const hasLines = (geojson) => {
        return geojson.features.some(f =>
            f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')
        );
    };

    const hasPolygons = (geojson) => {
        return geojson.features.some(f =>
            f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        );
    };

    const getAllCoordinates = (geometry) => {
        const coords = [];
        if (!geometry) return coords;

        switch (geometry.type) {
            case 'Point':
                coords.push(geometry.coordinates);
                break;
            case 'LineString':
            case 'MultiPoint':
                geometry.coordinates.forEach(coord => coords.push(coord));
                break;
            case 'Polygon':
            case 'MultiLineString':
                geometry.coordinates.forEach(line => line.forEach(coord => coords.push(coord)));
                break;
            case 'MultiPolygon':
                geometry.coordinates.forEach(polygon =>
                    polygon.forEach(line => line.forEach(coord => coords.push(coord)))
                );
                break;
        }
        return coords;
    };

    const clearLayers = () => {
        ['uploadedGeoJSON-points', 'uploadedGeoJSON-lines', 'uploadedGeoJSON-polygons'].forEach(layerId => {
            if (map.current.getLayer(layerId)) {
                map.current.removeLayer(layerId);
            }
        });
        if (map.current.getSource('uploadedGeoJSON')) {
            map.current.removeSource('uploadedGeoJSON');
        }
    };

    const handleLayerToggle = (layerName) => {
        setLayers(prev => ({
            ...prev,
            [layerName]: !prev[layerName]
        }));
    };

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    return (
        <>
            <Stack direction='row' spacing={2} sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: 2 }}>
                <Chip icon={isMeasure ? <DoneRounded /> : <StraightenRounded />} label="Length" sx={{ color: 'black', background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('line')}></Chip>
                <Chip icon={isArea ? <DoneRounded /> : <SquareFootRounded />} label="Area" sx={{ color: 'black', background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('area')}></Chip>
                <Chip icon={<Queue />} label="Add Layer" sx={{ background: 'white', '&:hover': { color: 'black', backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={handleClick}></Chip>
                <Chip icon={<Layers />} label="Layer Manager" sx={{ background: 'white', '&:hover': { color: 'black', backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={toggleDrawer}></Chip>
                <Menu
                    id="long-menu"
                    MenuListProps={{
                        'aria-labelledby': 'long-button',
                    }}
                    anchorEl={anchorEl}
                    open={open}
                    sx={{ marginTop: '0.3%' }}
                    onClose={handleClose}
                    PaperProps={{
                        style: {
                            maxHeight: ITEM_HEIGHT * 4.5,
                            width: '15ch',
                            boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                            borderRadius: '16px'
                        },
                    }}
                >
                    <MenuItem sx={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
                        <Button
                            component="label"
                            role={undefined}
                            variant="text"
                            tabIndex={-1}
                            sx={{ width: '100%', color: 'black' }}
                            startIcon={<CloudUploadRounded />}
                        >
                            GeoJSON
                            <VisuallyHiddenInput onChange={handleFileChange} type="file" />
                        </Button>
                    </MenuItem>
                    <MenuItem sx={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
                        <Button
                            component="label"
                            role={undefined}
                            variant="text"
                            tabIndex={-1}
                            sx={{ width: '100%', color: 'black' }}
                            startIcon={<CloudUploadRounded />}
                        >
                            KML
                            <VisuallyHiddenInput onChange={handleFileChange} type="file" />
                        </Button>
                    </MenuItem>
                    <MenuItem sx={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
                        <Button
                            component="label"
                            role={undefined}
                            variant="text"
                            tabIndex={-1}
                            sx={{ width: '100%', color: 'black' }}
                            onClick={() => { clearLayers(); handleClose(); }}
                        >
                            Clear
                        </Button>
                    </MenuItem>
                </Menu>
            </Stack>

            {/* Layer Manager Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRadius: '0 16px 16px 0',
                        // marginTop: '64px',
                        // height: 'calc(100% - 64px)',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', padding: 2, justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="div">
                        Layer Manager
                    </Typography>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeft />
                    </IconButton>
                </Box>
                <Divider />
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <Satellite />
                        </ListItemIcon>
                        <ListItemText primary="Satellite Imagery" secondary="Mapbox Satellite" />
                        <Switch
                            edge="end"
                            checked={layers.satellite}
                            onChange={() => handleLayerToggle('satellite')}
                        />
                    </ListItem>
                </List>
                <Divider />
                <Box sx={{ padding: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Toggle layers on and off to customize your map view. Additional layers can be added to this panel as needed.
                    </Typography>
                </Box>
            </Drawer>

            <Snackbar
                open={!!measurement}
                message={measurement}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
            <div id='map-container' style={{ position: 'relative', height: '100vh' }} ref={mapContainer}></div>
        </>
    );
}