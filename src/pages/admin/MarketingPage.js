import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingPage.css';
import { FaEnvelope, FaImage, FaBullhorn } from 'react-icons/fa';

const MarketingPage = () => {
  const marketingTools = [
    {
      icon: <FaBullhorn />,
      title: 'Push Notifications',
      description: 'Send targeted notifications to vendors or shops.',
      link: '#',
    },
    {
      icon: <FaEnvelope />,
      title: 'SMS/Email Campaigns',
      description: 'Create and manage marketing campaigns.',
      link: '#',
    },
    {
      icon: <FaImage />,
      title: 'Banners & Promotions',
      description: 'Manage promotional banners on the homepage.',
      link: '#',
    },
    {
      icon: <FaBullhorn />,
      title: 'Discount Campaigns',
      description: 'Create and manage discount codes and offers.',
      link: '#',
    },
  ];

  return (
    <div className="marketing-page">
      <header className="page-header">
        <h1>Marketing Tools</h1>
        <p>Manage all your marketing activities from one place.</p>
      </header>
      <div className="tools-grid">
        {marketingTools.map((tool, index) => (
          <div key={index} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link to={tool.link} className="tool-link">Manage</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketingPage;
