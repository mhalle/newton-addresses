import DeckGL from '@deck.gl/react';
import { StaticMap } from 'react-map-gl';


function MapVis({ 
        layers, 
        mapStyle, 
        mapboxApiAccessToken,
        onViewStateChange,
        viewState

     }) {
    return (
        <DeckGL
            viewState={viewState}
            controller={true}
            layers={layers}
            onViewStateChange={onViewStateChange}
    >
            <StaticMap
                mapStyle={mapStyle}
                mapboxApiAccessToken={mapboxApiAccessToken} />
        </DeckGL>
    )
}

export default MapVis;
