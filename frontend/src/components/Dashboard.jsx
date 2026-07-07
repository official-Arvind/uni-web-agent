import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SiteCard from './SiteCard';
import AddSiteModal from './AddSiteModal';
import { getBackendUrl, getFetchHeaders } from '../api';

const Dashboard = () => {
  const [sites, setSites] = useState([]);
  const [showAddSite, setShowAddSite] = useState(false);

  const fetchSites = () => {
    fetch(`${getBackendUrl()}/api/v1/sites`, { headers: getFetchHeaders() })
      .then(res => res.json())
      .then(data => setSites(data))
      .catch(err => {
        console.error("Failed to fetch sites", err);
        toast.error("Failed to fetch sites");
      });
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSiteAdded = () => {
    setShowAddSite(false);
    fetchSites();
  };

  return (
    <div className="dashboard-container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: '"Inter", sans-serif' }}>
      <header className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', borderBottom: '4px solid #fff', paddingBottom: '20px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="gradient-text" style={{ fontSize: '4rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1, textShadow: '0 0 30px rgba(118, 75, 162, 0.4), 0 0 60px rgba(118, 75, 162, 0.2)' }}>
            Command<br/>Center
          </h1>
          <p style={{ margin: '16px 0 0 0', color: '#a0a0a0', fontSize: '1.2rem', fontWeight: 500, letterSpacing: '1px' }}>
            AGENTIC WEB AUTOMATIONS // V1.0
          </p>
        </div>
        <button 
          className="btn-primary" 
          style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '0', border: '2px solid #fff', background: '#fff', color: '#000', boxShadow: '8px 8px 0px #667eea', transition: 'all 0.2s ease', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.target.style.boxShadow = '12px 12px 0px #764ba2'; e.target.style.transform = 'translate(-4px, -4px)'; }}
          onMouseLeave={(e) => { e.target.style.boxShadow = '8px 8px 0px #667eea'; e.target.style.transform = 'none'; }}
          onClick={() => setShowAddSite(true)}>
          [+] Initialize Site
        </button>
      </header>

      <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gridAutoRows: 'minmax(250px, auto)', gap: '24px', gridAutoFlow: 'dense' }}>
        {sites.length === 0 ? (
          <div className="liquid-glass bento-item" style={{ gridColumn: '1 / -1', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px' }}>
            <h2 style={{ color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting Targets...</h2>
          </div>
        ) : (
          sites.map((site, index) => (
            <div key={site.domain} className="bento-item liquid-glass" style={{ gridColumn: index % 3 === 0 ? 'span 2' : 'span 1', gridRow: index % 4 === 0 ? 'span 2' : 'span 1', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
              <SiteCard site={site} />
            </div>
          ))
        )}
      </div>

      {showAddSite && (
        <AddSiteModal onClose={() => setShowAddSite(false)} onAdded={handleSiteAdded} />
      )}
    </div>
  );
};

export default Dashboard;
