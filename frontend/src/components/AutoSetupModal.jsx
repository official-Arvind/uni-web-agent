import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getBackendUrl, getFetchHeaders } from '../api';

const AutoSetupModal = ({ domain, onClose }) => {
  const [capabilities, setCapabilities] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Initializing Auto-Setup with Gemini 3.1 Pro Preview...');
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/v1/sites/${domain}/auto-setup`, {
        method: 'POST',
        headers: getFetchHeaders(),
        body: JSON.stringify({ capabilities })
      });
      
      if (!response.ok) {
        throw new Error('Failed to auto setup site');
      }
      
      toast.success('Auto setup complete!', { id: loadingToast });
      onClose();
    } catch(e) {
      console.error(e);
      toast.error('Failed to auto setup site. Check API key or backend.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(25px)', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="modal-content" style={{ 
        background: 'rgba(10, 10, 15, 0.85)', 
        border: '3px solid rgba(255, 255, 0, 0.5)', 
        borderRadius: '0', 
        boxShadow: '15px 15px 0 rgba(255, 255, 0, 0.2), 0 10px 50px rgba(0,0,0,1)',
        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        padding: '36px',
        maxWidth: '550px',
        width: '100%'
      }}>
        <h2 className="gradient-text" style={{ textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '2px dashed rgba(255,255,0,0.3)', paddingBottom: '16px', marginBottom: '24px', fontSize: '28px', color: '#ffff00', textShadow: '0 0 10px rgba(255,255,0,0.5)' }}>
          Auto Setup <span style={{ color: '#fff' }}>AI ✨</span>
        </h2>
        
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: '#ccc', marginBottom: '24px', lineHeight: '1.6', fontSize: '15px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.4)', padding: '16px', borderLeft: '4px solid #ffff00' }}>
            <strong style={{ color: '#ffff00' }}>SYS.REQ:</strong> AI will automatically scan the site to deduce and generate all logical workflows. 
            <br/><br/>
            (OPTIONAL) Provide specific capabilities below if you want custom workflows:
          </p>
          
          <div style={{ position: 'relative' }}>
            <textarea 
              className="input-field" 
              rows="4" 
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0',
                padding: '16px 14px',
                color: '#fff',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '16px',
                resize: 'vertical'
              }}
              value={capabilities} 
              onChange={(e) => setCapabilities(e.target.value)} 
              placeholder=" " 
              onFocus={(e) => {
                e.target.style.borderColor = '#ffff00';
                e.target.style.boxShadow = 'inset 0 0 15px rgba(255,255,0,0.2), 0 0 10px rgba(255,255,0,0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.9)';
              }}
              id="capabilitiesInput"
            />
            <label htmlFor="capabilitiesInput" style={{
              position: 'absolute',
              left: '12px',
              top: capabilities ? '-12px' : '16px',
              fontSize: capabilities ? '12px' : '16px',
              color: capabilities ? '#ffff00' : 'rgba(255,255,255,0.6)',
              background: capabilities ? '#000' : 'transparent',
              padding: '0 8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              border: capabilities ? '1px solid rgba(255, 255, 0, 0.5)' : 'none',
              borderRadius: '0'
            }}>Custom Capabilities</label>
          </div>
        </div>

        <div className="flex-between">
          <button 
            className="btn-secondary" 
            style={{ 
              background: 'rgba(0,0,0,0.6)', 
              border: '2px solid rgba(255,255,255,0.3)', 
              color: '#fff',
              borderRadius: '0',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '2px',
              padding: '14px 28px',
              boxShadow: '6px 6px 0 rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }} 
            onClick={onClose} 
            disabled={loading}
            onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(255,255,255,0.2)'; } }}
            onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(255,255,255,0.1)'; } }}
          >
            ABORT
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSetup} 
            disabled={loading}
            style={{ 
              background: '#ffff00', 
              color: '#000',
              border: '2px solid #ffff00',
              borderRadius: '0',
              textTransform: 'uppercase',
              fontWeight: '900',
              letterSpacing: '2px',
              padding: '14px 28px',
              boxShadow: '6px 6px 0 rgba(150, 150, 0, 0.6)',
              transition: 'all 0.2s ease',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.8 : 1
            }}
            onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(150, 150, 0, 0.8)'; e.target.style.background = '#ffff33'; } }}
            onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(150, 150, 0, 0.6)'; e.target.style.background = '#ffff00'; } }}
          >
            {loading ? '🤖 INITIALIZING...' : 'START AUTO-SETUP'}
          </button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(25px); } }
          @keyframes bounceIn { 
            0% { transform: scale(0.9) translateY(30px); opacity: 0; } 
            60% { transform: scale(1.03) translateY(-10px); opacity: 1; } 
            100% { transform: scale(1) translateY(0); opacity: 1; } 
          }
        `}} />
      </div>
    </div>
  );
};

export default AutoSetupModal;
