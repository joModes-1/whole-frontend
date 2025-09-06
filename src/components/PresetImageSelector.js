import React, { useState, useEffect } from 'react';
import { fetchPresetImages } from '../services/catalogService';
import './PresetImageSelector.css';

const PresetImageSelector = ({ selectedCategory, selectedSubcategory, onImageSelect, selectedImages, maxSelections = 5, productName = '' }) => {
  const [presetImages, setPresetImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  // Debounce productName so we fetch after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(productName?.trim() || '');
    }, 400);
    return () => clearTimeout(handler);
  }, [productName]);

  // Fetch preset images when category/subcategory or debounced product name changes
  useEffect(() => {
    const loadPresetImages = async () => {
      if (!selectedCategory || !selectedSubcategory) return;
      
      setLoading(true);
      setError('');

      try {
        const baseParams = {
          category: selectedCategory,
          subcategory: selectedSubcategory
        };

        let response = {};
        const canNameFilter = debouncedName && debouncedName.length >= 3;

        // Only fetch with name filter if name is provided
        if (canNameFilter) {
          response = await fetchPresetImages({ ...baseParams, productName: debouncedName });
        } else {
          // If no name filter, fetch all images for category/subcategory
          response = await fetchPresetImages(baseParams);
        }

        setPresetImages(response.images || []);


      } catch (err) {
        setError('Failed to load preset images');
        console.error('Error loading preset images:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPresetImages();
  }, [selectedCategory, selectedSubcategory, debouncedName]);

  const handleImageClick = (image) => {
    const isAlreadySelected = selectedImages.some(selected => selected.url === image.url);
    if (isAlreadySelected) {
      onImageSelect(selectedImages.filter(selected => selected.url !== image.url));
    } else if (selectedImages.length < maxSelections) {
      onImageSelect([...selectedImages, image]);
    }
  };

  if (!selectedCategory || !selectedSubcategory) {
    return (
      <div className="preset-image-selector">
        <p className="helper-text">Select a category and subcategory to view preset images</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="preset-image-selector">
        <p>Loading preset images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preset-image-selector">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="preset-image-selector">
      <h4>Preset Images</h4>
      <p className="helper-text">Click on images to select them for your product (max {maxSelections})</p>
      
      {presetImages.length === 0 ? (
        <p className="no-images-message">No preset images found for this category/subcategory.</p>
      ) : (
        <div className="preset-images-grid">
          {presetImages.map((image, index) => (
            <div 
              key={index} 
              className={`preset-image-item ${selectedImages.some(selected => selected.url === image.url) ? 'selected' : ''}`}
              onClick={() => handleImageClick(image)}
            >
              <img src={image.url} alt={image.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresetImageSelector;
