import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { kml } from '@tmcw/togeojson';
import { styled } from '@mui/material/styles';
import { Chip, Stack, Snackbar, Menu, MenuItem, Button, Drawer, Box, Typography, List, ListItem, ListItemIcon, ListItemText, Switch, Divider, IconButton, FormControl, InputLabel, Select } from '@mui/material';
import { CloudUploadRounded, DoneRounded, Queue, SquareFootRounded, StraightenRounded, Layers, Terrain, Satellite, Map as MapIcon, ChevronLeft, BarChart } from '@mui/icons-material';

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

// State data for visualization
const stateData = {
    'Andhra Pradesh': {
        population: 49577103,
        gdp: 1030000, // in million INR
        area: 162968, // in square kilometers
        literacyRate: 67.02, // in percentage
    },
    'Arunachal Pradesh': {
        population: 1383727,
        gdp: 27200,
        area: 83743,
        literacyRate: 66.95,
    },
    'Assam': {
        population: 31205576,
        gdp: 364000,
        area: 78438,
        literacyRate: 72.19,
    },
    'Bihar': {
        population: 104099452,
        gdp: 530000,
        area: 94163,
        literacyRate: 63.82,
    },
    'Chhattisgarh': {
        population: 25545198,
        gdp: 345000,
        area: 135192,
        literacyRate: 70.28,
    },
    'Goa': {
        population: 1458545,
        gdp: 73000,
        area: 3702,
        literacyRate: 88.70,
    },
    'Gujarat': {
        population: 60439692,
        gdp: 1690000,
        area: 196024,
        literacyRate: 78.03,
    },
    'Haryana': {
        population: 25351462,
        gdp: 850000,
        area: 44212,
        literacyRate: 75.55,
    },
    'Himachal Pradesh': {
        population: 6864602,
        gdp: 165000,
        area: 55673,
        literacyRate: 82.80,
    },
    'Jammu and Kashmir': {
        population: 966889,
        gdp: 30000,
        area: 22429,
        literacyRate: 74.43,
    },
    'Jharkhand': {
        population: 32988134,
        gdp: 300000,
        area: 79716,
        literacyRate: 66.41,
    },
    'Karnataka': {
        population: 61095297,
        gdp: 1740000,
        area: 191791,
        literacyRate: 75.36,
    },
    'Kerala': {
        population: 33406061,
        gdp: 780000,
        area: 38852,
        literacyRate: 93.91,
    },
    'Madhya Pradesh': {
        population: 72626809,
        gdp: 1000000,
        area: 308245,
        literacyRate: 69.32,
    },
    'Maharashtra': {
        population: 123144223,
        gdp: 3590000,
        area: 307713,
        literacyRate: 82.34,
    },
    'Manipur': {
        population: 2855794,
        gdp: 30000,
        area: 22327,
        literacyRate: 76.94,
    },
    'Meghalaya': {
        population: 2966889,
        gdp: 40000,
        area: 22429,
        literacyRate: 74.43,
    },
    'Mizoram': {
        population: 1097206,
        gdp: 20000,
        area: 21081,
        literacyRate: 91.58,
    },
    'Nagaland': {
        population: 1978502,
        gdp: 24500,
        area: 16579,
        literacyRate: 79.55,
    },
    'Odisha': {
        population: 41974218,
        gdp: 520000,
        area: 155707,
        literacyRate: 72.87,
    },
    'Punjab': {
        population: 27743338,
        gdp: 625000,
        area: 50362,
        literacyRate: 75.84,
    },
    'Rajasthan': {
        population: 68548437,
        gdp: 1050000,
        area: 342239,
        literacyRate: 67.06,
    },
    'Sikkim': {
        population: 610577,
        gdp: 20000,
        area: 7096,
        literacyRate: 81.42,
    },
    'Tamil Nadu': {
        population: 72147030,
        gdp: 2320000,
        area: 130058,
        literacyRate: 80.09,
    },
    'Telangana': {
        population: 35003674,
        gdp: 1020000,
        area: 112077,
        literacyRate: 66.54,
    },
    'Tripura': {
        population: 3673917,
        gdp: 50000,
        area: 10486,
        literacyRate: 87.22,
    },
    'Uttar Pradesh': {
        population: 199812341,
        gdp: 1780000,
        area: 243286,
        literacyRate: 67.68,
    },
    'Uttarakhand': {
        population: 10086292,
        gdp: 245000,
        area: 53483,
        literacyRate: 78.82,
    },
    'West Bengal': {
        population: 91276115,
        gdp: 1380000,
        area: 88752,
        literacyRate: 76.26,
    },
    'Andaman and Nicobar': {
        population: 380581,
        gdp: 7000,
        area: 8249,
        literacyRate: 86.27,
    },
    'Chandigarh': {
        population: 1055450,
        gdp: 40000,
        area: 114,
        literacyRate: 86.05,
    },
    'Dādra and Nagar Haveli and Damān and Diu': {
        population: 615724,
        gdp: 10000,
        area: 603,
        literacyRate: 87.07,
    },
    'Lakshadweep': {
        population: 64473,
        gdp: 2000,
        area: 32,
        literacyRate: 92.28,
    },
    'Delhi': {
        population: 16787941,
        gdp: 800000,
        area: 1484,
        literacyRate: 86.21,
    },
    'Puducherry': {
        population: 1247953,
        gdp: 50000,
        area: 479,
        literacyRate: 85.85,
    },
};


// Color function for state visualization
const getColor = (value, metric) => {
    console.log('Value:', value, 'Metric:', metric);
    const values = Object.values(stateData).map((state) => state[metric]);
    console.log('Values:', values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ratio = (value - min) / (max - min);
    const red = Math.floor(255 * ratio);
    const blue = 255 - red;
    console.log('Color:', `rgb(${red}, 0, ${blue})`);
    return `rgb(${red}, 0, ${blue})`;
};

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);
    const [lng, setLng] = useState(78.9629);
    const [lat, setLat] = useState(22.5937);
    const [zoom, setZoom] = useState(4);
    const [isMeasure, setIsMeasure] = useState(false);
    const [isArea, setIsArea] = useState(false);
    const [measurement, setMeasurement] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // State data visualization settings
    const [selectedMetric, setSelectedMetric] = useState('population');
    const [indiaGeoJSON, setIndiaGeoJSON] = useState(null);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Layer toggle states
    const [layers, setLayers] = useState({
        satellite: false,
        precipitation: false,
        stateData: false
    });

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN'; // Use env or fallback

    // Initialize the map
    useEffect(() => {
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/standard',
            center: [lng, lat],
            zoom: zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl({
            showCompass: false
        }), 'bottom-right');
        map.current.addControl(new mapboxgl.ScaleControl());
        map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'bottom-right');
        map.current.dragRotate.disable();
        map.current.touchZoomRotate.disableRotation();

        const drawTool = new MapboxDraw({
            displayControlsDefault: false,
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
        });
        map.current.on('draw.selectionchange', updateMeasurement);

        // Initialize map layers once the map is loaded
        map.current.on('load', () => {
            // Fetch India GeoJSON for state data visualization
            fetchIndiaGeoJSON();

            // Add satellite source
            map.current.addSource('mapbox-satellite', {
                'type': 'raster',
                'url': 'mapbox://mapbox.satellite',
                'tileSize': 256
            });

            map.current.addSource('precipitation-rate', {
                'type': 'raster',
                'tiles': [
                    'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?service=WMS&request=GetMap&layers=IMERG_Precipitation_Rate&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'
                ],
                'tileSize': 256
            });
        });

    }, []);

    // Fetch India GeoJSON data
    const fetchIndiaGeoJSON = async () => {
        try {
            const response = await fetch('\\india-states.json');
            const data = await response.json();
            setIndiaGeoJSON(data);
        } catch (error) {
            console.error("Failed to load India GeoJSON:", error);
        }
    };

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
                });
            }
        } else {
            if (map.current.getLayer('satellite-layer')) {
                map.current.removeLayer('satellite-layer');
            }
        }

        // Handle precipitation layer
        if (layers.precipitation) {
            if (!map.current.getLayer('precipitation-layer')) {
                map.current.addLayer({
                    'id': 'precipitation-layer',
                    'type': 'raster',
                    'source': 'precipitation-rate',
                    'paint': {
                        'raster-opacity': 0.6
                    }
                });
            }
        } else {
            if (map.current.getLayer('precipitation-layer')) {
                map.current.removeLayer('precipitation-layer');
            }
        }

        // Handle state data visualization
        if (layers.stateData && indiaGeoJSON) {
            updateMapColors();
        } else {
            if (map.current.getLayer('states-layer')) {
                map.current.removeLayer('states-layer');
            }
            if (map.current.getSource('india-states')) {
                map.current.removeSource('india-states');
            }
        }
    }, [layers, indiaGeoJSON, selectedMetric]);

    // Update map colors based on selected metric
    const updateMapColors = () => {
        if (!indiaGeoJSON || !map.current) return;

        // Remove existing layer if it exists
        if (map.current.getLayer('states-layer')) {
            console.log('Removing existing layer');
            map.current.removeLayer('states-layer');
        }

        // Remove existing source if it exists
        if (map.current.getSource('india-states')) {
            console.log('Removing existing source');
            map.current.removeSource('india-states');
        }

        const updatedGeoJSON = {
            ...indiaGeoJSON,

            features: indiaGeoJSON.features.map((feature) => {
                console.log('Feature:', feature);
                const stateName = feature.properties.name
                console.log('State Name:', stateName);
                const metricValue = stateData[stateName]?.[selectedMetric] || 0;
                console.log('Metric Value:', metricValue);
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        color: getColor(metricValue, selectedMetric),
                        metricValue: metricValue
                    },
                };
            }),
        };

        console.log('Adding updated source and layer', updatedGeoJSON);

        map.current.addSource('india-states', {
            type: 'geojson',
            data: updatedGeoJSON,
        });

        map.current.addLayer({
            id: 'states-layer',
            type: 'fill',
            source: 'india-states',
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.7,
                'fill-outline-color': '#000',
            },
        });

        // Add popup for state data
        map.current.on('click', 'states-layer', (e) => {
            // Remove all existing popups
            document.querySelectorAll('.mapboxgl-popup').forEach(popup => {
                popup.remove();
            });
            if (!e.features.length) return;

            const feature = e.features[0];
            const stateName = feature.properties.name;
            const metricValue = feature.properties.metricValue;
            const metricLabel = {
                'population': 'Population',
                'gdp': 'GDP (in millions)',
                'area': 'Area (sq km)',
                'literacyRate': 'Literacy Rate (%)'
            }[selectedMetric];

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<h3>${stateName}</h3><p>${metricLabel}: ${metricValue.toLocaleString()}</p>`)
                .addTo(map.current);
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'states-layer', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'states-layer', () => {
            map.current.getCanvas().style.cursor = '';
        });
    };

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
        if (map.current.getLayer('uploadedGeoJSON-points')) {
            map.current.removeLayer('uploadedGeoJSON-points');
        }
        if (map.current.getLayer('uploadedGeoJSON-lines')) {
            map.current.removeLayer('uploadedGeoJSON-lines');
        }
        if (map.current.getLayer('uploadedGeoJSON-polygons')) {
            map.current.removeLayer('uploadedGeoJSON-polygons');
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
            <Stack direction='row' spacing={2} sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: 2, display: 'flex' }}>
                <Chip icon={isMeasure ? <DoneRounded /> : <StraightenRounded />} label="Length" sx={{ color: 'black', background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('line')}></Chip>
                <Chip icon={isArea ? <DoneRounded /> : <SquareFootRounded />} label="Area" sx={{ color: 'black', background: 'white', '&:hover': { backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={() => toggleMeasurement('area')}></Chip>
                <Chip icon={<Queue />} label="Add Layer" sx={{ background: 'white', '&:hover': { color: 'black', backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={handleClick}></Chip>
                <Chip icon={<Layers />} label="Layers" sx={{ background: 'white', '&:hover': { color: 'black', backgroundColor: '#e0e0e0' }, '&:active': { backgroundColor: '#c0c0c0' } }} onClick={toggleDrawer}></Chip>
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

            {/* State Data Analysis Controls */}
            {layers.stateData && (
                <Box sx={{ position: 'absolute', top: 55, right: 7, zIndex: 1, padding: 2, backgroundColor: 'white', borderRadius: 2, boxShadow: 2, width: 250 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        India State Data Analysis
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Metric</InputLabel>
                        <Select
                            value={selectedMetric}
                            label="Metric"
                            onChange={(e) => setSelectedMetric(e.target.value)}
                        >
                            <MenuItem value="population">Population</MenuItem>
                            <MenuItem value="gdp">GDP</MenuItem>
                            <MenuItem value="area">Area</MenuItem>
                            <MenuItem value="literacyRate">Literacy Rate</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={updateMapColors}
                        fullWidth
                    >
                        Update Visualization
                    </Button>
                </Box>
            )}

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
                    <ListItem>
                        <ListItemIcon>
                            <MapIcon />
                        </ListItemIcon>
                        <ListItemText primary="Precipitation Rate" secondary="Global Precipitation Rate" />
                        <Switch
                            edge="end"
                            checked={layers.precipitation}
                            onChange={() => handleLayerToggle('precipitation')}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <BarChart />
                        </ListItemIcon>
                        <ListItemText primary="India State Data" secondary="Population, GDP, Area, Literacy" />
                        <Switch
                            edge="end"
                            checked={layers.stateData}
                            onChange={() => handleLayerToggle('stateData')}
                        />
                    </ListItem>
                </List>
                <Divider />
                <Box sx={{ padding: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Toggle layers on and off to customize your map view. The India State Data layer provides visual analysis of key metrics across Indian states.
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