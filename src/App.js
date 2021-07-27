import React, { useState, useEffect } from 'react';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Layout, Checkbox } from 'antd';
import { useQueryParam, ArrayParam } from 'use-query-params';

import MapVis from './MapVis';
import useSWR from "swr";
import 'antd/dist/antd.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

const DataURLs = {
  addresses: 'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Addresses/Addresses.geojson',
  villageCenters: 'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Villages/Villages.geojson',
  openSpace: 'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Open%20Space/OpenSpace.geojson',
  water: 'https://raw.githubusercontent.com/NewtonMAGIS/GISData/master/Surface%20Waters/SurfaceWater.geojson'
};

const DisplayOptions = ['Open Space', 'Water', 'Village centers'];
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
const DefaultAddressTypes = ['Apartment', 'Mixed', 'Residential'];
const DefaultToDisplay = [];
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

  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [selectedAddressTypes, setSelectedAddressTypes] = useQueryParam('atype', ArrayParam);
  const [selectedToDisplay, setSelectedToDisplay] = useQueryParam('disp', ArrayParam);
  const [viewState, setViewState] = useState(null);

  const { data } = useSWR([DataURLs, 'data'], 
                          fetchMany, 
                          { 
                            revalidateOnFocus: false 
                          });

  useEffect(() => {
    if(selectedAddressTypes === undefined){
      setSelectedAddressTypes(DefaultAddressTypes);
    }
  }, [selectedAddressTypes, setSelectedAddressTypes]); 

  useEffect(() => {
    if(selectedToDisplay === undefined){
      setSelectedToDisplay(DefaultToDisplay);
    }
  }, [selectedToDisplay, setSelectedToDisplay]);


  useEffect(() => {
    if (data) {
      setFilteredAddresses(data.addresses.filter(x =>
        selectedAddressTypes && selectedAddressTypes.includes(x.properties.AddressType)));
    }
  }, [selectedAddressTypes, data]);

  const villageCenters = new ScatterplotLayer({
    id: 'villageCenters',
    visible: selectedToDisplay && selectedToDisplay.includes('Village centers'),
    data: data ? data.villageCenters : null,
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
    visible: selectedToDisplay && selectedToDisplay.includes('Open Space'),
    data: data ? data.openSpace : [],
    pickable: false,
    stroked: false,
    filled: true,
    extruded: false,
    getFillColor: [50, 255, 50, 60]
  });

  const waterLayer = new GeoJsonLayer({
    id: 'water-layer',
    visible: selectedToDisplay && selectedToDisplay.includes('Water'),
    data: data ? data.water : [],
    pickable: false,
    stroked: false,
    filled: true,
    extruded: false,
    getFillColor: [10, 10, 230, 60]
    });

  const layers = [addressLayer, villageCenters, parksLayer, waterLayer];

  return (
    <Layout style={{}}>
      <Header style={{ height: "64px", paddingLeft: '10px', backgroundColor: "white" }} >
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
              value={selectedToDisplay}
              options={DisplayOptions}
              onChange={setSelectedToDisplay}
            />
            <h2>Address Types</h2>
            <Checkbox.Group
              className="address-types"
              value={selectedAddressTypes}
              options={IncludeAddressTypes}
              onChange={setSelectedAddressTypes}
            />
            <div className="credit">
              Data courtesy <a href="https://github.com/NewtonMAGIS/GISData">Newton GIS via Github</a>.
            </div>
          </div>

        </Sider >
        <Layout className="site-layout" style={{ height: '100%', marginLeft: 230 }}>
          <Content style={{ height: "91vh", position: "relative" }}>
            <MapVis initialViewState={INITIAL_VIEW_STATE}
              layers={layers}
              mapStyle='mapbox://styles/mapbox/dark-v10'
              mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
              onViewStateChange={x => setViewState(x.viewState)}
              viewState={viewState ? viewState : INITIAL_VIEW_STATE}
            />
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

function fetchMany(o) {
  const ret = {};
  const keys = Object.keys(o);
  return Promise.all(Object.values(o).map(u => fetcher(u))).then(x => {
    x.forEach((e, i) => { 
      ret[keys[i]] = e;
    });
    return ret;
  });
}

export default App
