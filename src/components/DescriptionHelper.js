import React, { useState, useEffect } from 'react';
import { getDescriptionQuality, getDescriptionQualityText, getMissingKeywords } from '../utils/descriptionSuggestions';
import './DescriptionHelper.css';

// Category metadata structure
const categoryMetadata = {
  "Beverages": {
    structuredFields: ['sizePackaging', 'weightVolume', 'gradeQuality', 'shelfLife']
  },
  "Cereals & Grains": {
    structuredFields: ['sizePackaging', 'weightVolume', 'gradeQuality', 'shelfLife']
  },
  "Electronics": {
    structuredFields: ['sizePackaging', 'weightVolume']
  },
  "Clothing": {
    structuredFields: ['sizePackaging', 'gradeQuality']
  },
  "Home & Garden": {
    structuredFields: ['sizePackaging', 'weightVolume']
  },
  "Sports": {
    structuredFields: ['sizePackaging', 'weightVolume']
  },
  "Books": {
    structuredFields: ['weightVolume', 'gradeQuality']
  }
};

const DescriptionHelper = ({ category, description, onDescriptionChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    if (category && description) {
      // Generate suggestions based on category metadata
      const categoryMeta = categoryMetadata[category] || {};
      const structuredFields = categoryMeta.structuredFields || [];
      
      // Create suggestion templates based on structured fields
      const newSuggestions = [
        `High-quality ${category} product with detailed specifications`,
        `Premium ${category} item with excellent features`,
        `Top-grade ${category} with long shelf life`
      ];
      
      // Add field-specific suggestions
      if (structuredFields.length > 0) {
        const fieldLabels = structuredFields.map(field => 
          field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        );
        newSuggestions.push(`Complete ${category} product with ${fieldLabels.join(', ')}`);
      }
      
      setSuggestions(newSuggestions);
      
      // Check for missing keywords
      const missing = getMissingKeywords(category, description);
      setMissingKeywords(missing);
      
      // Show suggestions if description quality is poor or fair
      const quality = getDescriptionQuality(description);
      setShowSuggestions(quality === 'poor' || quality === 'fair' || missing.length > 0);
    } else {
      setSuggestions([]);
      setMissingKeywords([]);
      setShowSuggestions(false);
    }
  }, [category, description]);
  
  const applySuggestion = (suggestion) => {
    onDescriptionChange(suggestion);
    setShowSuggestions(false);
  };
  
  if (!category) return null;
  
  return (
    <div className="description-helper">
      {/* Description Quality Indicator */}
      {description && description.length > 0 && (
        <div className="description-quality">
          <span className={`quality-indicator ${getDescriptionQuality(description)}`}>
            Description Quality: {getDescriptionQualityText(description)}
          </span>
        </div>
      )}
      
      {/* Missing Keywords Warning */}
      {missingKeywords.length > 0 && (
        <div className="missing-keywords">
          <p>Consider adding these details to improve your description: {missingKeywords.join(', ')}</p>
        </div>
      )}
      
      {/* Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h4>Improve your description with these templates:</h4>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button 
                  type="button" 
                  onClick={() => applySuggestion(suggestion)}
                  className="suggestion-button"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
          <button 
            type="button" 
            onClick={() => setShowSuggestions(false)}
            className="close-suggestions"
          >
            Close Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default DescriptionHelper;
