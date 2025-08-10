// Utility function to generate description suggestions based on category
export const getDescriptionSuggestions = (category, productName) => {
  const templates = {
    'Electronics': [
      `High-quality ${productName || 'product'} featuring the latest technology and reliable performance. Perfect for everyday use with durable construction and user-friendly design.`,
      `Advanced ${productName || 'product'} with premium specifications and warranty coverage. Designed for efficiency and long-lasting reliability in both personal and professional settings.`,
      `Cutting-edge ${productName || 'product'} that combines functionality with style. Includes all essential features for optimal performance and user satisfaction.`
    ],
    'Clothing': [
      `Stylish ${productName || 'apparel'} made from high-quality materials for comfort and durability. Available in various sizes to ensure a perfect fit for everyone.`,
      `Fashion-forward ${productName || 'clothing item'} that offers both comfort and elegance. Crafted with attention to detail and designed for versatile wear.`,
      `Premium ${productName || 'garment'} featuring a comfortable fit and trendy design. Perfect for casual or formal occasions, offering excellent value for money.`
    ],
    'Home & Garden': [
      `Essential ${productName || 'product'} for home improvement and daily household needs. Built to last with quality materials and practical design features.`,
      `Beautiful ${productName || 'item'} that enhances any living space with its elegant design and functionality. Perfect for creating a comfortable home environment.`,
      `Practical ${productName || 'solution'} for your home and garden requirements. Designed with durability and usability in mind for long-term satisfaction.`
    ],
    'Sports': [
      `Performance-driven ${productName || 'sports equipment'} designed for athletes and fitness enthusiasts. Built for durability and optimal functionality during active use.`,
      `High-quality ${productName || 'sports product'} that enhances your athletic performance. Engineered with precision for reliability in competitive and recreational settings.`,
      `Durable ${productName || 'equipment'} perfect for sports activities and training. Designed to withstand rigorous use while providing excellent performance results.`
    ],
    'Books': [
      `Engaging ${productName || 'book'} that captivates readers with compelling content. A valuable resource for entertainment, education, or professional development.`,
      `Informative ${productName || 'publication'} containing insightful material and well-researched content. Perfect for readers seeking knowledge and entertainment.`,
      `Well-written ${productName || 'book'} offering an immersive reading experience. Features content that is both entertaining and educational for diverse audiences.`
    ]
  };

  return templates[category] || [];
};

// Function to check description quality
export const getDescriptionQuality = (description) => {
  if (!description || description.length === 0) return 'empty';
  if (description.length < 50) return 'poor';
  if (description.length < 150) return 'fair';
  if (description.length < 300) return 'good';
  return 'excellent';
};

// Function to get quality text
export const getDescriptionQualityText = (description) => {
  const quality = getDescriptionQuality(description);
  switch (quality) {
    case 'empty':
      return 'Not started';
    case 'poor':
      return 'Poor - Needs improvement';
    case 'fair':
      return 'Fair - Could be better';
    case 'good':
      return 'Good - Adequate';
    case 'excellent':
      return 'Excellent - Well detailed';
    default:
      return 'Unknown';
  }
};

// Function to check for required keywords based on category
export const getMissingKeywords = (category, description) => {
  const requiredKeywords = {
    'Electronics': ['specifications', 'warranty', 'features', 'technology', 'performance'],
    'Clothing': ['material', 'size', 'fit', 'style', 'fabric', 'comfort'],
    'Home & Garden': ['dimensions', 'materials', 'usage', 'design', 'quality', 'function'],
    'Sports': ['performance', 'durability', 'activity', 'usage', 'training', 'exercise'],
    'Books': ['author', 'pages', 'content', 'genre', 'publisher', 'edition']
  };

  if (!category || !description) return [];
  
  const keywords = requiredKeywords[category] || [];
  return keywords.filter(keyword => 
    !description.toLowerCase().includes(keyword.toLowerCase())
  );
};
