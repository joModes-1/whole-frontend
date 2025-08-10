import React, { useState, useEffect } from 'react';

const CategoryDescriptionHelper = ({ category, description, onDescriptionChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Category-specific description templates and keywords
  const categoryTemplates = {
    'Electronics': [
      'High-quality {product} with advanced features',
      'Durable {product} designed for everyday use',
      'Latest technology {product} with excellent performance'
    ],
    'Clothing': [
      'Comfortable and stylish {product} for all occasions',
      'Premium {product} made with high-quality materials',
      'Fashionable {product} that offers a perfect fit'
    ],
    'Home & Garden': [
      'Essential {product} for your home improvement needs',
      'Beautiful {product} to enhance your living space',
      'Practical {product} for everyday household use'
    ],
    'Sports': [
      'Performance-driven {product} for sports enthusiasts',
      'Durable {product} designed for active lifestyles',
      'High-quality {product} to improve your game'
    ],
    'Books': [
      'Engaging {product} that captivates readers',
      'Informative {product} with valuable insights',
      'Well-written {product} for entertainment and education'
    ]
  };
  
  const requiredKeywords = {
    'Electronics': ['specifications', 'warranty', 'features', 'technology'],
    'Clothing': ['material', 'size', 'fit', 'style'],
    'Home & Garden': ['dimensions', 'materials', 'usage', 'design'],
    'Sports': ['performance', 'durability', 'activity', 'usage'],
    'Books': ['author', 'pages', 'content', 'genre']
  };
  
  // Check description quality and provide suggestions
  useEffect(() => {
    if (category && description) {
      const newSuggestions = [];
      
      // Check if description is too short
      if (description.length < 50) {
        newSuggestions.push('Description is too brief. Please provide more details about the product.');
      }
      
      // Check for required keywords based on category
      if (requiredKeywords[category]) {
        const missingKeywords = requiredKeywords[category].filter(keyword => 
          !description.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (missingKeywords.length > 0) {
          newSuggestions.push(`Consider adding these details: ${missingKeywords.join(', ')}`);
        }
      }
      
      // Suggest templates if description is poor quality
      if (description.length < 100 || newSuggestions.length > 0) {
        if (categoryTemplates[category]) {
          const templates = categoryTemplates[category].map(template => 
            template.replace('{product}', 'product')
          );
          newSuggestions.push(...templates);
        }
      }
      
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [category, description, categoryTemplates, requiredKeywords]);
  
  const applySuggestion = (suggestion) => {
    onDescriptionChange(suggestion);
    setShowSuggestions(false);
  };
  
  if (!category) return null;
  
  return (
    <div className="description-helper">
      {showSuggestions && (
        <div className="suggestions-panel">
          <h4>Improve your description:</h4>
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
      
      {description && description.length > 0 && (
        <div className="description-quality">
          <span className={`quality-indicator ${getDescriptionQuality()}`}>
            Description Quality: {getDescriptionQualityText()}
          </span>
        </div>
      )}
    </div>
  );
  
  function getDescriptionQuality() {
    if (description.length < 50) return 'poor';
    if (description.length < 150) return 'fair';
    if (description.length < 300) return 'good';
    return 'excellent';
  }
  
  function getDescriptionQualityText() {
    const quality = getDescriptionQuality();
    if (quality === 'poor') return 'Poor - Needs improvement';
    if (quality === 'fair') return 'Fair - Could be better';
    if (quality === 'good') return 'Good - Adequate';
    return 'Excellent - Well detailed';
  }
};

export default CategoryDescriptionHelper;
