import React from 'react';
import { Link } from 'react-router-dom';
import './SecurityPage.css';
import { FaHistory, FaUserShield, FaExclamationTriangle } from 'react-icons/fa';

const SecurityPage = () => {
  const securityTools = [
    {
      icon: <FaHistory />,
      title: 'User Activity Logs',
      description: 'Review logs of user actions and system events.',
      link: '#',
    },
    {
      icon: <FaUserShield />,
      title: 'Roles & Permissions',
      description: 'Manage user roles and access control levels.',
      link: '#',
    },
    {
      icon: <FaExclamationTriangle />,
      title: 'Content Moderation',
      description: 'Review and moderate user-generated content.',
      link: '#',
    },
  ];

  return (
    <div className="security-page">
      <header className="page-header">
        <h1>Security & Moderation</h1>
        <p>Monitor and manage platform security and content.</p>
      </header>
      <div className="tools-grid">
        {securityTools.map((tool, index) => (
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

export default SecurityPage;
