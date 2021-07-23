import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { StaticMap } from 'react-map-gl';
import { Layout, Checkbox } from 'antd';
import useSWR from "swr";
import 'antd/dist/antd.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

const DataURLs = [
  'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Addresses/Addresses.geojson',
  'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Villages/Villages.geojson',
  'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Open%20Space/OpenSpace.geojson',
  'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Surface%20Waters/SurfaceWater.geojson'
];

const DisplayOptions = ['Parks', 'Water', 'Village centers'];
const IncludeAddressTypes = [
  'Apartment', 
  'Commercial', 
  'Historic',
  'Institution',
  'Mixed',
  'OpenSpace',
  'Residential'
];

const { Header, Content, Sider } = Layout;

// Set your mapbox access token here
const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1IjoiaGFsYXphciIsImEiOiJja2N0dXI2Y3kxbTBoMnBxcTJnaTl3czVxIn0.MXzwZHuwNaOPKZgO17_YmA';

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: -71.207283,
  latitude: 42.330,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

function App() {

  const [selectedAddressTypes, setSelectedAddressTypes] = useState(['Apartment', 'Mixed', 'Residential']);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [selectedToDisplay, setSelectedToDisplay] = useState([]);

  const { data } = useSWR([DataURLs, 'data'], fetchAll, { revalidateOnFocus: false });

  useEffect(() => {
    if(data){
    setFilteredAddresses(data[0].filter(x => 
        selectedAddressTypes.includes(x.properties.AddressType)));
    }
  }, [selectedAddressTypes, data]);


  const villageCenters = new ScatterplotLayer({
    id: 'villageCenters',
    visible: selectedToDisplay.includes('Village centers'),
    data: data ? data[1] : null,
    opacity: 1,
    radiusUnits: 'pixels',
    lineWidthUnits: 'pixels',
    radiusMinPixels: 8,
    radiusMaxPixels: 16,
    stroked: true,
    filled: true,
    pickable: true,
    getRadius: d => 5,
    getFillColor: d => [180, 180, 200],
    getLineColor: d => [255, 255, 255],

    getPosition: d => d.geometry.coordinates,
  });

  const addressLayer = new HeatmapLayer({
    id: 'address-layer',
    opacity: 0.65,
    data: filteredAddresses,
    getPosition: d => d.geometry.coordinates,
    getWeight: 1,
    aggregation: 'SUM'
  });

  const parksLayer = new GeoJsonLayer({
    id: 'parks-layer',
    visible: selectedToDisplay.includes('Parks'),
    data: data ? data[2] : [],
    pickable: false,
    stroked: false,
    filled: true,
    extruded: false,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: [50, 255, 50, 60],
    getLineColor: [0, 0, 0],
    getRadius: 10,
    getLineWidth: 1,
    getElevation: 30
  });

  const waterLayer = new GeoJsonLayer({
    id: 'water-layer',
    visible: selectedToDisplay.includes('Water'),
    data: data ? data[3] : [],
    pickable: false,
    stroked: false,
    filled: true,
    extruded: false,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: [10, 10, 230, 60],
    getLineColor: [0, 0, 0],
    getRadius: 10,
    getLineWidth: 1,
    getElevation: 30
  });

  const layers = [addressLayer, villageCenters, parksLayer, waterLayer];

  return (
    <Layout style={{}}>
        <Header style={{  height: "64px", paddingLeft: '10px', backgroundColor: "white" }} >
          <h1>Newton address heat map</h1>
        </Header>
        <Layout>
      <Sider
        width={230}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          backgroundColor: 'white',
          left: 0,
        }}
      >
        <div className="side-content">
        <h2>Display</h2>
          <Checkbox.Group
            className="display"
            options={DisplayOptions}
            defaultValue={selectedToDisplay}
            onChange={setSelectedToDisplay}
          />
          <h2>Address Types</h2>
          <Checkbox.Group
            className="address-types"
            options={IncludeAddressTypes}
            defaultValue={selectedAddressTypes}
            onChange={setSelectedAddressTypes}
          />
          <div className="credit">
            Data courtesy <a href="https://github.com/NewtonMAGIS/GISData">Newton GIS via Github</a>.
          </div>
        </div>

      </Sider >
      <Layout className="site-layout" style={{ height: '100%', marginLeft: 230 }}>

        <Content style={{ height: "91vh", position: "relative" }}>
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={layers}
          >
            <StaticMap
              mapStyle='mapbox://styles/mapbox/dark-v10'
              mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
          </DeckGL>
        </Content>
      </Layout>
    </Layout >
    </Layout>


  );
}

function fetcher(url) {
  return fetch(url)
    .then(r => r.json())
    .then(j => {
      return j.features;
    });
}

function fetchAll(urls) {
  return Promise.all(urls.map(fetcher));
}

export default App
