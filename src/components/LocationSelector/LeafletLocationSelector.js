import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationSelector.css';
import { Search, MapPin, X } from 'lucide-react';

// Fix for default markers in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map click events
const LocationPickerEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    },
  });
  
  return null;
};

// Component to update map view when location changes
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LeafletLocationSelector = ({ 
  onLocationSelect, 
  initialLocation = null, 
  required = false,
  disabled = false 
}) => {
  const [address, setAddress] = useState(initialLocation?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [showMap, setShowMap] = useState(true); // Open map by default
  const [mapError, setMapError] = useState('');
  const [markerPosition, setMarkerPosition] = useState(
    initialLocation?.coordinates || { lat: 0.3476, lng: 32.5825 } // Kampala, Uganda
  );
  const [searchFocused, setSearchFocused] = useState(false);
  
  const debounceTimer = useRef(null);
  const searchController = useRef(null);

  // Clean up place name by removing generic terms
  const cleanPlaceName = useCallback((name) => {
    if (!name) return '';
    
    // Remove common generic terms
    const genericTerms = [
      'Central Division',
      'Central Region', 
      'Division',
      'Region',
      'Municipality',
      'District',
      'Uganda',
      'Kampala',
      'Ward',
      'Parish',
      'Sub-county',
      'County'
    ];
    
    let cleanName = name;
    genericTerms.forEach(term => {
      const regex = new RegExp(`,?\\s*${term}\\s*,?`, 'gi');
      cleanName = cleanName.replace(regex, ',');
    });
    
    // Clean up multiple commas and spaces
    cleanName = cleanName.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
    
    return cleanName;
  }, []);

  // Advanced search for places using multiple strategies
  const searchPlaces = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request if any
    if (searchController.current) {
      searchController.current.abort();
    }

    searchController.current = new AbortController();
    setIsLoading(true);
    
    let allResults = [];

    try {
      // Strategy 1: Search with business/shop keywords for small businesses
      const businessQueries = [
        `${query} shop Uganda`,
        `${query} business Uganda`,
        `${query} store Uganda`,
        `${query} Uganda`
      ];
      
      // Try multiple search strategies in parallel
      const searchPromises = businessQueries.map(async (searchQuery) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `q=${encodeURIComponent(searchQuery)}&` +
            `limit=3&` +
            `countrycodes=ug&` +
            `addressdetails=1&` +
            `namedetails=1&` +
            `extratags=1`,
            {
              signal: searchController.current.signal,
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'B2B-Platform/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            return data;
          }
        } catch (err) {
          console.log('Search strategy failed:', searchQuery);
        }
        return [];
      });

      const results = await Promise.all(searchPromises);
      allResults = results.flat();

      // Strategy 2: Also search using Overpass API for POIs (Points of Interest)
      try {
        const overpassQuery = `
          [out:json][timeout:5];
          (
            node["name"~"${query}",i](0.0,-1.0,2.0,35.0);
            way["name"~"${query}",i](0.0,-1.0,2.0,35.0);
            node["shop"]["name"~"${query}",i](0.0,-1.0,2.0,35.0);
            node["amenity"]["name"~"${query}",i](0.0,-1.0,2.0,35.0);
            node["office"]["name"~"${query}",i](0.0,-1.0,2.0,35.0);
          );
          out body;
          >;
          out skel qt;
        `;
        
        const overpassResponse = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            body: overpassQuery,
            signal: searchController.current.signal
          }
        );

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          if (overpassData.elements) {
            const overpassResults = overpassData.elements
              .filter(el => el.lat && el.lon && el.tags?.name)
              .map((el, index) => ({
                place_id: `overpass_${el.id || index}`,
                display_name: `${el.tags.name}${el.tags.shop ? ` (${el.tags.shop})` : ''}`,
                lat: el.lat,
                lon: el.lon,
                address: {
                  shop: el.tags.shop,
                  amenity: el.tags.amenity,
                  road: el.tags['addr:street'],
                  city: el.tags['addr:city'] || 'Kampala'
                },
                type: 'business',
                tags: el.tags
              }));
            allResults = [...allResults, ...overpassResults];
          }
        }
      } catch (overpassErr) {
        console.log('Overpass API search failed:', overpassErr);
      }

      // Remove duplicates based on coordinates
      const uniqueResults = [];
      const seen = new Set();
      
      for (const item of allResults) {
        const key = `${Math.round(parseFloat(item.lat) * 1000)}_${Math.round(parseFloat(item.lon) * 1000)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(item);
        }
      }
      
      // Format and clean suggestions
      const formattedSuggestions = uniqueResults.slice(0, 8).map(item => {
        const displayName = item.display_name || item.tags?.name || '';
        const mainText = cleanPlaceName(displayName.split(',')[0]);
        let secondaryText = '';
        
        if (item.type === 'business' && item.address) {
          // For businesses from Overpass, create cleaner secondary text
          const parts = [];
          if (item.address.road) parts.push(item.address.road);
          if (item.address.city) parts.push(item.address.city);
          secondaryText = parts.join(', ');
        } else {
          // For Nominatim results, clean up the address
          const addressParts = displayName.split(',').slice(1);
          secondaryText = cleanPlaceName(addressParts.join(', '));
        }
        
        return {
          place_id: item.place_id,
          display_name: displayName,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon || item.lng),
          address: item.address || {},
          main_text: mainText || query,
          secondary_text: secondaryText,
          tags: item.tags
        };
      });
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
      searchController.current = null;
    }
  }, [cleanPlaceName]);

  // Parse location data from Nominatim response
  const parseLocationData = useCallback((data, coordinates) => {
    const address = data.address || {};
    const tags = data.tags || {};
    
    // Clean the formatted address
    let cleanedAddress = data.display_name || '';
    if (tags.name) {
      // If we have a business name, prioritize it
      cleanedAddress = tags.name;
      if (address.road) {
        cleanedAddress += `, ${address.road}`;
      }
      if (address.city || address.town || address.village) {
        cleanedAddress += `, ${address.city || address.town || address.village}`;
      }
    } else {
      cleanedAddress = cleanPlaceName(cleanedAddress);
    }
    
    const location = {
      formattedAddress: cleanedAddress,
      placeId: data.place_id || '',
      coordinates: coordinates || {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon)
      },
      address: [
        address.house_number,
        address.road,
        address.suburb
      ].filter(Boolean).join(' '),
      city: address.city || address.town || address.village || address.municipality || '',
      state: address.state || address.county || '',
      country: address.country || '',
      postalCode: address.postcode || '',
      businessName: tags.name || ''
    };

    return location;
  }, [cleanPlaceName]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (coordinates) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&` +
        `lat=${coordinates.lat}&` +
        `lon=${coordinates.lng}&` +
        `addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'B2B-Platform/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      const locationData = parseLocationData(data, coordinates);
      setSelectedLocation(locationData);
      setAddress(locationData.formattedAddress);
      setMarkerPosition(coordinates);
      onLocationSelect(locationData);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setMapError('Failed to get address for this location');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, parseLocationData]);


  // Handle address input change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the search
    debounceTimer.current = setTimeout(() => {
      searchPlaces(value);
    }, 500);
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    setSuggestions([]);
    setSearchFocused(false);
    
    const coordinates = { 
      lat: suggestion.lat, 
      lng: suggestion.lon 
    };
    
    // Build clean formatted address
    let cleanAddress = suggestion.main_text;
    if (suggestion.secondary_text) {
      cleanAddress += `, ${suggestion.secondary_text}`;
    }
    
    const locationData = {
      formattedAddress: cleanAddress,
      placeId: suggestion.place_id,
      coordinates,
      address: [
        suggestion.address.house_number,
        suggestion.address.road,
        suggestion.address.suburb
      ].filter(Boolean).join(' '),
      city: suggestion.address.city || suggestion.address.town || suggestion.address.village || '',
      state: suggestion.address.state || suggestion.address.county || '',
      country: suggestion.address.country || 'Uganda',
      postalCode: suggestion.address.postcode || '',
      businessName: suggestion.tags?.name || suggestion.main_text
    };
    
    setSelectedLocation(locationData);
    setAddress(cleanAddress);
    setMarkerPosition(coordinates);
    onLocationSelect(locationData);
  };

  // Handle map click
  const handleMapClick = (coordinates) => {
    reverseGeocode(coordinates);
  };

  // Toggle map visibility
  const toggleMap = () => {
    setShowMap(!showMap);
  };

  // Clear selected location
  const clearLocation = () => {
    setSelectedLocation(null);
    setAddress('');
    setSuggestions([]);
    setMarkerPosition({ lat: 0.3476, lng: 32.5825 });
    onLocationSelect(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (searchController.current) {
        searchController.current.abort();
      }
    };
  }, []);

  return (
    <div className="location-selector">
      <div className="location-input-container">
        <div className="location-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search for your business name or address..."
            className={`location-input ${selectedLocation ? 'selected' : ''}`}
            disabled={disabled}
            required={required}
          />
          {isLoading && (
            <div className="location-loading">
              <div className="spinner-small"></div>
            </div>
          )}
          {address && !isLoading && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setAddress('');
                setSuggestions([]);
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {suggestions.length > 0 && searchFocused && (
          <div className="location-suggestions">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="location-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-icon">
                  <MapPin size={16} />
                </div>
                <div className="suggestion-content">
                  <div className="suggestion-main">{suggestion.main_text}</div>
                  {suggestion.secondary_text && (
                    <div className="suggestion-secondary">{suggestion.secondary_text}</div>
                  )}
                </div>
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
          <MapContainer
            center={[markerPosition.lat, markerPosition.lng]}
            zoom={selectedLocation ? 15 : 10}
            style={{ height: '400px', width: '100%' }}
            className="location-map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <ChangeView 
              center={[markerPosition.lat, markerPosition.lng]} 
              zoom={selectedLocation ? 15 : 10} 
            />
            
            <LocationPickerEvents onLocationSelect={handleMapClick} />
            
            {selectedLocation && (
              <Marker
                position={[markerPosition.lat, markerPosition.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    reverseGeocode({ lat: position.lat, lng: position.lng });
                  }
                }}
              />
            )}
          </MapContainer>
          
          <div className="map-instructions">
            Click on the map or drag the marker to set your exact business location
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="selected-location-info">
          <h4>Selected Location:</h4>
          <div className="location-details">
            {selectedLocation.businessName && (
              <div><strong>Business:</strong> {selectedLocation.businessName}</div>
            )}
            <div><strong>Address:</strong> {selectedLocation.formattedAddress}</div>
            {selectedLocation.city && <div><strong>City:</strong> {selectedLocation.city}</div>}
            <div><strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletLocationSelector;
