import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SettingsModal = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState([]);
  const [proxyServer, setProxyServer] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if(data.gemini_api_key) setApiKey(data.gemini_api_key);
        if(data.gemini_model) setGeminiModel(data.gemini_model);
        if(data.default_proxy) setProxyServer(data.default_proxy);
        if(data.default_proxy_username) setProxyUser(data.default_proxy_username);
        if(data.default_proxy_password) setProxyPass(data.default_proxy_password);
      });
      
    fetch('http://localhost:8000/api/v1/models')
      .then(res => res.json())
      .then(data => {
        setAvailableModels(data);
      });
  }, []);

  const handleSave = async () => {
    try {
      await fetch('http://localhost:8000/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: apiKey,
          gemini_model: geminiModel,
          default_proxy: proxyServer,
          default_proxy_username: proxyUser,
          default_proxy_password: proxyPass
        })
      });
      toast.success('Settings saved successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(20px)', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="modal-content" style={{ 
        background: 'rgba(12, 12, 12, 0.8)', 
        border: '3px solid rgba(0, 255, 100, 0.4)', 
        borderRadius: '0', 
        boxShadow: '12px 12px 0 rgba(0, 255, 100, 0.2), 0 10px 40px rgba(0,0,0,0.9)',
        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        padding: '32px',
        maxWidth: '650px',
        width: '100%'
      }}>
        <h2 className="gradient-text" style={{ textTransform: 'uppercase', letterSpacing: '3px', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '32px', fontSize: '24px' }}>
          GLOBAL <span style={{ color: '#00ff64' }}>SETTINGS</span>
        </h2>
        
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <input 
            type="password" 
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
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#00ff64';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,100,0.2), 0 0 10px rgba(0,255,100,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="apiKey"
          />
          <label htmlFor="apiKey" style={{
            position: 'absolute',
            left: '12px',
            top: apiKey ? '-12px' : '16px',
            fontSize: apiKey ? '12px' : '16px',
            color: apiKey ? '#00ff64' : 'rgba(255,255,255,0.5)',
            background: apiKey ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: apiKey ? '1px solid rgba(0, 255, 100, 0.4)' : 'none',
            borderRadius: '0'
          }}>Gemini API Key</label>
          <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#888', fontWeight: 'bold' }}>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#00ff64', textDecoration: 'none', borderBottom: '1px solid #00ff64' }}>
              GET A FREE API KEY FROM GOOGLE AI STUDIO ✨
            </a>
          </div>
        </div>
        
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <select 
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
              fontSize: '16px',
              appearance: 'none',
              cursor: 'pointer'
            }}
            value={geminiModel} 
            onChange={(e) => setGeminiModel(e.target.value)} 
            onFocus={(e) => {
              e.target.style.borderColor = '#00ff64';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,100,0.2), 0 0 10px rgba(0,255,100,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="geminiModel"
          >
            {availableModels.map(model => (
                <option key={model} value={model} style={{ background: '#0a0a0a', color: '#fff' }}>
                    {model}
                </option>
            ))}
          </select>
          <label htmlFor="geminiModel" style={{
            position: 'absolute',
            left: '12px',
            top: '-12px',
            fontSize: '12px',
            color: '#00ff64',
            background: '#0a0a0a',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: '1px solid rgba(0, 255, 100, 0.4)',
            borderRadius: '0'
          }}>AI Model</label>
          <div style={{ position: 'absolute', right: '16px', top: '16px', pointerEvents: 'none', color: '#00ff64' }}>
              ▼
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '32px' }}>
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
            value={proxyServer} 
            onChange={(e) => setProxyServer(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#00ff64';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,100,0.2), 0 0 10px rgba(0,255,100,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="proxyServer"
          />
          <label htmlFor="proxyServer" style={{
            position: 'absolute',
            left: '12px',
            top: proxyServer ? '-12px' : '16px',
            fontSize: proxyServer ? '12px' : '16px',
            color: proxyServer ? '#00ff64' : 'rgba(255,255,255,0.5)',
            background: proxyServer ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: proxyServer ? '1px solid rgba(0, 255, 100, 0.4)' : 'none',
            borderRadius: '0'
          }}>Default Proxy Server</label>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
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
              value={proxyUser} 
              onChange={(e) => setProxyUser(e.target.value)} 
              placeholder=" " 
              onFocus={(e) => {
                e.target.style.borderColor = '#00ff64';
                e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,100,0.2), 0 0 10px rgba(0,255,100,0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
              id="proxyUser"
            />
            <label htmlFor="proxyUser" style={{
              position: 'absolute',
              left: '12px',
              top: proxyUser ? '-12px' : '16px',
              fontSize: proxyUser ? '12px' : '16px',
              color: proxyUser ? '#00ff64' : 'rgba(255,255,255,0.5)',
              background: proxyUser ? '#0a0a0a' : 'transparent',
              padding: '0 8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              border: proxyUser ? '1px solid rgba(0, 255, 100, 0.4)' : 'none',
              borderRadius: '0',
              whiteSpace: 'nowrap'
            }}>Proxy Username</label>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="password" 
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
              value={proxyPass} 
              onChange={(e) => setProxyPass(e.target.value)} 
              placeholder=" " 
              onFocus={(e) => {
                e.target.style.borderColor = '#00ff64';
                e.target.style.boxShadow = 'inset 0 0 15px rgba(0,255,100,0.2), 0 0 10px rgba(0,255,100,0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
              id="proxyPass"
            />
            <label htmlFor="proxyPass" style={{
              position: 'absolute',
              left: '12px',
              top: proxyPass ? '-12px' : '16px',
              fontSize: proxyPass ? '12px' : '16px',
              color: proxyPass ? '#00ff64' : 'rgba(255,255,255,0.5)',
              background: proxyPass ? '#0a0a0a' : 'transparent',
              padding: '0 8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              border: proxyPass ? '1px solid rgba(0, 255, 100, 0.4)' : 'none',
              borderRadius: '0',
              whiteSpace: 'nowrap'
            }}>Proxy Password</label>
          </div>
        </div>
        
        <div style={{ fontSize: '0.8rem', marginTop: '-8px', marginBottom: '32px', color: '#888', fontWeight: 'bold' }}>
            NEED A PROXY? TRY <a href="https://www.webshare.io/" target="_blank" rel="noreferrer" style={{ color: '#00ff64', textDecoration: 'none', borderBottom: '1px solid #00ff64' }}>WEBSHARE</a> OR <a href="https://proxyscrape.com/home" target="_blank" rel="noreferrer" style={{ color: '#00ff64', textDecoration: 'none', borderBottom: '1px solid #00ff64' }}>PROXYSCRAPE</a> FOR FREE RESIDENTIAL/DATACENTER IPS.
        </div>
        
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Authentication & Profiles</h3>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
            Link your Google account (or any other session) manually. This opens a secure browser window for you to log in. The agent will then reuse this profile for future automations without needing your password.
          </p>
          <button 
            type="button"
            className="btn-secondary" 
            style={{ 
              background: 'transparent', 
              border: '2px solid #4facfe', 
              color: '#4facfe',
              borderRadius: '0',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '1px',
              padding: '12px 24px',
              boxShadow: '4px 4px 0 rgba(79, 172, 254, 0.4)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onClick={async () => {
              const tId = toast.loading('Opening secure browser for Auth...');
              try {
                await fetch('http://localhost:8000/api/v1/auth/google', { method: 'POST' });
                toast.success('Browser launched! Please log in and close the window when done.', { id: tId, duration: 8000 });
              } catch (err) {
                toast.error('Failed to launch browser', { id: tId });
              }
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 rgba(79, 172, 254, 0.6)'; e.currentTarget.style.background = 'rgba(79, 172, 254, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0 rgba(79, 172, 254, 0.4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Link Google Account
          </button>
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
            background: '#00ff64', 
            color: '#000',
            border: '2px solid #00ff64',
            borderRadius: '0',
            textTransform: 'uppercase',
            fontWeight: '900',
            letterSpacing: '1px',
            padding: '12px 24px',
            boxShadow: '6px 6px 0 rgba(0, 150, 60, 0.6)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }} onClick={handleSave}
          onMouseOver={(e) => { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(0, 150, 60, 0.8)'; e.target.style.background = '#33ff83'; }}
          onMouseOut={(e) => { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(0, 150, 60, 0.6)'; e.target.style.background = '#00ff64'; }}
          >SAVE CONFIG</button>
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

export default SettingsModal;
