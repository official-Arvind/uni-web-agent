import React, { useState } from 'react';
import WorkflowList from './WorkflowList';
import AddWorkflowModal from './AddWorkflowModal';
import AutoSetupModal from './AutoSetupModal';

const SiteCard = ({ site }) => {
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [showAutoSetup, setShowAutoSetup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="glass-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        padding: '32px',
        borderRadius: '0',
        background: 'rgba(20, 20, 25, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isHovered ? 'translateY(-10px) translateZ(20px) rotateX(2deg) rotateY(2deg)' : 'none',
        boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(102, 126, 234, 0.4)' : '0 10px 30px rgba(0,0,0,0.5)',
        transformStyle: 'preserve-3d',
        borderColor: isHovered ? '#667eea' : 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', transform: 'translateZ(30px)' }}>
        <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', wordBreak: 'break-all', lineHeight: 1.1 }}>
          {site.domain}
        </h3>
        <div style={{ 
          background: '#fff', 
          color: '#000', 
          padding: '8px 12px', 
          fontSize: '0.9rem', 
          fontWeight: 900,
          border: '2px solid #000',
          boxShadow: '4px 4px 0px #667eea',
          transform: 'rotate(2deg)'
        }}>
          {site.workflow_count} WF
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', transform: 'translateZ(20px)' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderLeft: `4px solid ${site.settings.use_camoufox ? '#4ade80' : '#f87171'}`, flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 800, marginBottom: '4px' }}>ENGINE</div>
          <div style={{ fontWeight: 700, color: site.settings.use_camoufox ? '#4ade80' : '#f87171' }}>
            {site.settings.use_camoufox ? 'CAMOUFOX ACTIVE' : 'STANDARD CHROME'}
          </div>
        </div>
      </div>

      <div style={{ transform: 'translateZ(25px)' }}>
        {!showWorkflows ? (
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', border: '2px solid #667eea', color: '#667eea', transition: 'all 0.3s ease', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.target.style.background = '#667eea'; e.target.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#667eea'; }}
            onClick={() => setShowWorkflows(true)}
          >
            Access Workflows &gt;
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '12px', fontWeight: 800, textTransform: 'uppercase', background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }} 
                onClick={() => setShowAddWorkflow(true)}>
                + New Protocol
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '12px', fontWeight: 800, textTransform: 'uppercase', background: 'linear-gradient(90deg, #667eea, #764ba2)', color: '#fff', border: 'none', cursor: 'pointer' }} 
                onClick={() => setShowAutoSetup(true)}>
                AI Auto-Setup ✨
              </button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
              <WorkflowList domain={site.domain} />
            </div>
            
            <button 
              style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed #666', color: '#888', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }} 
              onClick={() => setShowWorkflows(false)}
              onMouseEnter={(e) => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#666'; e.target.style.color = '#888'; }}
            >
              [ Close Panel ]
            </button>
          </div>
        )}
      </div>

      {showAddWorkflow && (
        <AddWorkflowModal 
          domain={site.domain} 
          onClose={() => setShowAddWorkflow(false)} 
          onAdded={() => {
            setShowAddWorkflow(false);
            window.location.reload();
          }} 
        />
      )}

      {showAutoSetup && (
        <AutoSetupModal 
          domain={site.domain} 
          onClose={() => setShowAutoSetup(false)} 
        />
      )}
    </div>
  );
};

export default SiteCard;
