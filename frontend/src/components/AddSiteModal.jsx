import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getBackendUrl, getFetchHeaders } from '../api';

const AddSiteModal = ({ onClose, onAdded }) => {
  const [domain, setDomain] = useState('');
  
  const handleSave = async () => {
    if (!domain) return;
    try {
      await fetch(`${getBackendUrl()}/api/v1/sites`, {
        method: 'POST',
        headers: getFetchHeaders(),
        body: JSON.stringify({ domain })
      });
      toast.success('Site added successfully!');
      onAdded();
    } catch(e) {
      console.error(e);
      toast.error('Failed to add site');
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(20px)', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="modal-content" style={{ 
        background: 'rgba(15, 15, 15, 0.75)', 
        border: '3px solid rgba(0, 255, 204, 0.4)', 
        borderRadius: '0', 
        boxShadow: '12px 12px 0 rgba(0, 255, 204, 0.2), 0 10px 40px rgba(0,0,0,0.9)',
        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        padding: '32px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 className="gradient-text" style={{ textTransform: 'uppercase', letterSpacing: '3px', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '32px', fontSize: '24px' }}>
          Add New Site
        </h2>
        
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <input 
            type="text" 
            className="input-field" 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0',
              padding: '16px 14px',
              color: '#fff',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '16px'
            }}
            value={domain} 
            onChange={(e) => setDomain(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#00ffcc';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,204,0.2), 0 0 10px rgba(0,255,204,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="domainInput"
          />
          <label htmlFor="domainInput" style={{
            position: 'absolute',
            left: '12px',
            top: domain ? '-12px' : '16px',
            fontSize: domain ? '12px' : '16px',
            color: domain ? '#00ffcc' : 'rgba(255,255,255,0.5)',
            background: domain ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: domain ? '1px solid rgba(0, 255, 204, 0.4)' : 'none',
            borderRadius: '0'
          }}>Domain Name</label>
        </div>

        <div className="flex-between">
          <button className="btn-secondary" style={{ 
            background: 'rgba(0,0,0,0.5)', 
            border: '2px solid rgba(255,255,255,0.2)', 
            color: '#fff',
            borderRadius: '0',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            padding: '12px 24px',
            boxShadow: '6px 6px 0 rgba(255,255,255,0.05)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }} onClick={onClose}
          onMouseOver={(e) => { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(255,255,255,0.1)'; }}
          onMouseOut={(e) => { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(255,255,255,0.05)'; }}
          >Cancel</button>
          
          <button className="btn-primary" style={{ 
            background: '#00ffcc', 
            color: '#000',
            border: '2px solid #00ffcc',
            borderRadius: '0',
            textTransform: 'uppercase',
            fontWeight: '900',
            letterSpacing: '1px',
            padding: '12px 24px',
            boxShadow: '6px 6px 0 rgba(0, 150, 120, 0.6)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }} onClick={handleSave}
          onMouseOver={(e) => { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(0, 150, 120, 0.8)'; e.target.style.background = '#33ffdb'; }}
          onMouseOut={(e) => { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(0, 150, 120, 0.6)'; e.target.style.background = '#00ffcc'; }}
          >Add Site</button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(20px); } }
          @keyframes bounceIn { 
            0% { transform: scale(0.9) translateY(20px); opacity: 0; } 
            60% { transform: scale(1.02) translateY(-5px); opacity: 1; } 
            100% { transform: scale(1) translateY(0); opacity: 1; } 
          }
        `}} />
      </div>
    </div>
  );
};

export default AddSiteModal;
