import React from 'react';
import { Link } from 'react-router-dom';
import './SupportPage.css';
import { FaEnvelopeOpenText, FaLifeRing, FaBook } from 'react-icons/fa';

const SupportPage = () => {
  const supportTools = [
    {
      icon: <FaEnvelopeOpenText />,
      title: 'Support Tickets',
      description: 'View and respond to user-submitted support requests.',
      link: '#',
    },
    {
      icon: <FaLifeRing />,
      title: 'Live Chat',
      description: 'Engage with users in real-time to resolve issues.',
      link: '#',
    },
    {
      icon: <FaBook />,
      title: 'Knowledge Base',
      description: 'Access help articles and documentation.',
      link: '#',
    },
  ];

  return (
    <div className="support-page">
      <header className="page-header">
        <h1>Feedback & Support</h1>
        <p>Manage user feedback and access support resources.</p>
      </header>
      <div className="tools-grid">
        {supportTools.map((tool, index) => (
          <div key={index} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link to={tool.link} className="tool-link">Access</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportPage;
