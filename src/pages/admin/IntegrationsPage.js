import React from 'react';
import { Link } from 'react-router-dom';
import './IntegrationsPage.css';
import { FaPuzzlePiece, FaCogs, FaEnvelope } from 'react-icons/fa';

const IntegrationsPage = () => {
  const integrationTools = [
    {
      icon: <FaPuzzlePiece />,
      title: 'Payment Gateways',
      description: 'Connect and manage payment providers like Stripe and PayPal.',
      link: '#',
    },
    {
      icon: <FaCogs />,
      title: 'API Settings',
      description: 'Manage API keys and webhook configurations.',
      link: '#',
    },
    {
      icon: <FaEnvelope />,
      title: 'Email Services',
      description: 'Configure email providers for transactional emails.',
      link: '#',
    },
  ];

  return (
    <div className="integrations-page">
      <header className="page-header">
        <h1>Integrations & Settings</h1>
        <p>Manage third-party integrations and platform settings.</p>
      </header>
      <div className="tools-grid">
        {integrationTools.map((tool, index) => (
          <div key={index} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link to={tool.link} className="tool-link">Configure</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
