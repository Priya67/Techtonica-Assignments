import React from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import { formatRelative } from 'date-fns';

import '@reach/combobox/styles.css';
import mapStyles from './mapStyles';

const libraries = ['places'];
const mapContainerStyle = {
  height: '100vh',
  width: '100vw',
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};
const center = {
  lat: 43.6532,
  lng: -79.3832,
};

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return 'Error';
  if (!isLoaded) return 'Loading...';

  return (
    <div>
      <h1>
        Bears{' '}
        <span role='img' aria-label='tent'>
          ⛺️
        </span>
      </h1>

      <Locate panTo={panTo} />
      <Search panTo={panTo} />

      <GoogleMap
        id='map'
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map((marker) => (
          <Marker
            key={`${marker.lat}-${marker.lng}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => {
              setSelected(marker);
            }}
            icon={{
              url: `/bear.svg`,
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        ))}

        {selected ? (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null);
            }}
          >
            <div>
              <h2>
                <span role='img' aria-label='bear'>
                  🐻
                </span>{' '}
                Alert
              </h2>
              <p>Spotted {formatRelative(selected.time, new Date())}</p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}

function Locate({ panTo }) {
  return (
    <button
      className='locate'
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => null
        );
      }}
    >
      <img src='/compass.svg' alt='compass' />
    </button>
  );
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 43.6532, lng: () => -79.3832 },
      radius: 100 * 1000,
    },
  });

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      panTo({ lat, lng });
    } catch (error) {
      console.log('😱 Error: ', error);
    }
  };

  return (
    <div className='search'>
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder='Search your location'
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === 'OK' &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
///////

//ALL THE HOOKS
// const [temp, setTemp]= useState('');
// const [city, setCity] = useState('')

/*including city name,import React from "react";

export default ({ weatherData, error }) => {
  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          fontFamily: "Raleway",
          padding: 20,
          color: "gray"
        }}
      >
        {error}
      </div>
    );
  }

  if (Object.keys(weatherData).length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          fontFamily: "Raleway",
          padding: 20,
          color: "gray"
        }}
      >
        You haven't selected a place, please select one
      </div>
    );
  }

  const weather = weatherData.weather[0];
  const { main, wind } = weatherData;

  //Function to change from K to ºC
  const KtoC = number => {
    if ((number - 273.15) % 1 === 0) {
      return number - 273.15;
    }
    return Number(number - 273.15).toFixed(2);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              marginRight: 10,
              borderRadius: 10,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 100,
              height: 100,
              background: "gray"
            }}
          >
            <img
              src={`http://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt=""
              style={{
                background: "lightgray"
              }}
            />
          </div>

          <h1 className="currentWeather">{weather.main}</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mainTemp">{KtoC(main.temp)} ºC</div>
          <div className="feelsLike">
            Feels Like:{" "}
            <span style={{ fontSize: 15 }}>{KtoC(main.feels_like)} ºC</span>
          </div>
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontFamily: "Roboto",
            color: "#525252",
            marginTop: 20
          }}
        >
          Wind Speed:
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            fontFamily: "Roboto",
            color: "#2f99c3"
          }}
        >
          {wind.speed} meter/second
        </div>
      </div>
    </div>
  );
};
???????????
current weather icon,
temperature,
humidity,
wind speed,
It must display apt images for sunny/rainy/cloudy/snowy weather conditions. */
