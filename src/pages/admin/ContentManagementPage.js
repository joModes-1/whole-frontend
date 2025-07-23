import React from 'react';
import { Link } from 'react-router-dom';
import './ContentManagementPage.css';
import { FaPen, FaQuestionCircle, FaFileAlt } from 'react-icons/fa';

const ContentManagementPage = () => {
  const contentSections = [
    {
      icon: <FaPen />,
      title: 'Blog Posts',
      description: 'Create, edit, and manage all blog articles.',
      link: '#',
    },
    {
      icon: <FaQuestionCircle />,
      title: 'FAQs',
      description: 'Manage the Frequently Asked Questions page.',
      link: '#',
    },
    {
      icon: <FaFileAlt />,
      title: 'Static Pages',
      description: 'Edit content on pages like About Us and Terms.',
      link: '#',
    },
  ];

  return (
    <div className="content-management-page">
      <header className="page-header">
        <h1>Content & CMS</h1>
        <p>Manage all your website's content from one place.</p>
      </header>
      <div className="content-grid">
        {contentSections.map((section, index) => (
          <div key={index} className="content-card">
            <div className="content-icon">{section.icon}</div>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <Link to={section.link} className="content-link">Manage</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentManagementPage;
