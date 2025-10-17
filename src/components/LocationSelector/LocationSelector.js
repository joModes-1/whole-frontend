import React, { useState, useEffect, useRef } from 'react';
import './LocationSelector.css';

const LocationSelector = ({ 
  onLocationSelect, 
  initialLocation = null, 
  required = false,
  disabled = false 
}) => {
  const [address, setAddress] = useState(initialLocation?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState('');
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const geocoder = useRef(null);
  const debounceTimer = useRef(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeGoogleMaps = () => {
      if (window.google && window.google.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        geocoder.current = new window.google.maps.Geocoder();
        setMapError('');
      } else {
        setMapError('Google Maps API not loaded. Please check your internet connection.');
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeGoogleMaps();
    } else {
      // Load Google Maps API if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleMaps;
      script.onerror = () => {
        setMapError('Failed to load Google Maps API. Please check your API key and internet connection.');
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (showMap && mapRef.current && window.google && window.google.maps) {
      initializeMap();
    }
  }, [showMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = selectedLocation?.coordinates || { lat: 0.3476, lng: 32.5825 }; // Kampala, Uganda

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: selectedLocation ? 15 : 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    placesService.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);

    // Add marker if location is selected
    if (selectedLocation) {
      addMarker(selectedLocation.coordinates);
    }

    // Add click listener to map
    mapInstanceRef.current.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      reverseGeocode({ lat, lng });
    });
  };

  const addMarker = (coordinates) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: coordinates,
      map: mapInstanceRef.current,
      draggable: true,
      title: 'Business Location'
    });

    markerRef.current.addListener('dragend', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      reverseGeocode({ lat, lng });
    });

    mapInstanceRef.current.setCenter(coordinates);
  };

  const reverseGeocode = (coordinates) => {
    if (!geocoder.current) return;

    setIsLoading(true);
    geocoder.current.geocode(
      { location: coordinates },
      (results, status) => {
        setIsLoading(false);
        if (status === 'OK' && results[0]) {
          const result = results[0];
          const locationData = parseLocationData(result, coordinates);
          setSelectedLocation(locationData);
          setAddress(locationData.formattedAddress);
          onLocationSelect(locationData);
          addMarker(coordinates);
        } else {
          console.error('Geocoder failed:', status);
        }
      }
    );
  };

  const parseLocationData = (place, coordinates = null) => {
    const components = place.address_components || [];
    const location = {
      formattedAddress: place.formatted_address,
      placeId: place.place_id,
      coordinates: coordinates || {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    };

    // Extract address components
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        location.address += component.long_name + ' ';
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        location.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        location.state = component.long_name;
      } else if (types.includes('country')) {
        location.country = component.long_name;
      } else if (types.includes('postal_code')) {
        location.postalCode = component.long_name;
      }
    });

    location.address = location.address.trim();
    return location;
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the search
    debounceTimer.current = setTimeout(() => {
      if (value.length > 2 && autocompleteService.current) {
        searchPlaces(value);
      } else {
        setSuggestions([]);
      }
    }, 300);
  };

  const searchPlaces = (input) => {
    setIsLoading(true);
    
    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'ug' } // Restrict to Uganda, adjust as needed
      },
      (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleSuggestionClick = (prediction) => {
    setIsLoading(true);
    setSuggestions([]);
    
    if (!placesService.current && window.google && window.google.maps) {
      // Create a temporary places service if not available
      const tempDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(tempDiv);
    }

    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: prediction.place_id },
        (place, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const locationData = parseLocationData(place);
            setSelectedLocation(locationData);
            setAddress(locationData.formattedAddress);
            onLocationSelect(locationData);
            
            // Update map if visible
            if (showMap && mapInstanceRef.current) {
              addMarker(locationData.coordinates);
            }
          }
        }
      );
    } else {
      setIsLoading(false);
      // Fallback to geocoding
      if (geocoder.current) {
        geocoder.current.geocode(
          { placeId: prediction.place_id },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const locationData = parseLocationData(results[0]);
              setSelectedLocation(locationData);
              setAddress(locationData.formattedAddress);
              onLocationSelect(locationData);
              
              if (showMap && mapInstanceRef.current) {
                addMarker(locationData.coordinates);
              }
            }
          }
        );
      }
    }
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setAddress('');
    setSuggestions([]);
    onLocationSelect(null);
    
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  return (
    <div className="location-selector">
      <div className="location-input-container">
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter your business address..."
          className={`location-input ${selectedLocation ? 'selected' : ''}`}
          disabled={disabled}
          required={required}
        />
        
        {isLoading && <div className="location-loading">Searching...</div>}
        
        {suggestions.length > 0 && (
          <div className="location-suggestions">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="location-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-main">{suggestion.structured_formatting.main_text}</div>
                <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="location-actions">
        {!disabled && (
          <>
            <button
              type="button"
              onClick={toggleMap}
              className="location-action-btn map-toggle-btn"
              disabled={mapError}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            
            {selectedLocation && (
              <button
                type="button"
                onClick={clearLocation}
                className="location-action-btn clear-btn"
              >
                Clear Location
              </button>
            )}
          </>
        )}
      </div>

      {mapError && (
        <div className="location-error">
          {mapError}
        </div>
      )}

      {showMap && !mapError && (
        <div className="location-map-container">
          <div ref={mapRef} className="location-map"></div>
          <div className="map-instructions">
            Click on the map or drag the marker to set your exact business location
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="selected-location-info">
          <h4>Selected Location:</h4>
          <div className="location-details">
            <div><strong>Address:</strong> {selectedLocation.formattedAddress}</div>
            {selectedLocation.city && <div><strong>City:</strong> {selectedLocation.city}</div>}
            {selectedLocation.state && <div><strong>State:</strong> {selectedLocation.state}</div>}
            {selectedLocation.country && <div><strong>Country:</strong> {selectedLocation.country}</div>}
            <div><strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
