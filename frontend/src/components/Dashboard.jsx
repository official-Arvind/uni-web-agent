import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SiteCard from './SiteCard';
import AddSiteModal from './AddSiteModal';

const Dashboard = () => {
  const [sites, setSites] = useState([]);
  const [showAddSite, setShowAddSite] = useState(false);

  const fetchSites = () => {
    fetch('http://localhost:8000/api/v1/sites')
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
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: '"Inter", sans-serif' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', borderBottom: '4px solid #fff', paddingBottom: '20px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="gradient-text" style={{ fontSize: '4rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '40px', alignItems: 'start' }}>
        {sites.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #333', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting Targets...</h2>
          </div>
        ) : (
          sites.map(site => (
            <SiteCard key={site.domain} site={site} />
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
