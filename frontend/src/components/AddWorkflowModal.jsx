import React, { useState } from 'react';
import toast from 'react-hot-toast';

const AddWorkflowModal = ({ domain, onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!name || !startUrl) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/api/v1/sites/${domain}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_name: name,
          workflow_description: description,
          start_url: startUrl
        })
      });
      toast.success('Workflow generated successfully!');
      onAdded();
    } catch(e) {
      console.error(e);
      toast.error('Failed to generate workflow. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(20px)', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="modal-content" style={{ 
        background: 'rgba(15, 15, 15, 0.75)', 
        border: '3px solid rgba(255, 0, 255, 0.4)', 
        borderRadius: '0', 
        boxShadow: '12px 12px 0 rgba(255, 0, 255, 0.2), 0 10px 40px rgba(0,0,0,0.9)',
        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        padding: '32px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h2 className="gradient-text" style={{ textTransform: 'uppercase', letterSpacing: '3px', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '32px', fontSize: '24px' }}>
          Generate AI Workflow <span style={{ color: '#ff00ff' }}>{domain}</span>
        </h2>
        
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
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#ff00ff';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(255,0,255,0.2), 0 0 10px rgba(255,0,255,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="workflowName"
          />
          <label htmlFor="workflowName" style={{
            position: 'absolute',
            left: '12px',
            top: name ? '-12px' : '16px',
            fontSize: name ? '12px' : '16px',
            color: name ? '#ff00ff' : 'rgba(255,255,255,0.5)',
            background: name ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: name ? '1px solid rgba(255, 0, 255, 0.4)' : 'none',
            borderRadius: '0'
          }}>Workflow Name</label>
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
            value={startUrl} 
            onChange={(e) => setStartUrl(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#ff00ff';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(255,0,255,0.2), 0 0 10px rgba(255,0,255,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="startUrl"
          />
          <label htmlFor="startUrl" style={{
            position: 'absolute',
            left: '12px',
            top: startUrl ? '-12px' : '16px',
            fontSize: startUrl ? '12px' : '16px',
            color: startUrl ? '#ff00ff' : 'rgba(255,255,255,0.5)',
            background: startUrl ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: startUrl ? '1px solid rgba(255, 0, 255, 0.4)' : 'none',
            borderRadius: '0'
          }}>Start URL</label>
        </div>

        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <textarea 
            className="input-field" 
            rows="3" 
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
              resize: 'vertical'
            }}
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder=" " 
            onFocus={(e) => {
              e.target.style.borderColor = '#ff00ff';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(255,0,255,0.2), 0 0 10px rgba(255,0,255,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 0 15px rgba(0,0,0,0.8)';
            }}
            id="desc"
          />
          <label htmlFor="desc" style={{
            position: 'absolute',
            left: '12px',
            top: description ? '-12px' : '16px',
            fontSize: description ? '12px' : '16px',
            color: description ? '#ff00ff' : 'rgba(255,255,255,0.5)',
            background: description ? '#0a0a0a' : 'transparent',
            padding: '0 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            border: description ? '1px solid rgba(255, 0, 255, 0.4)' : 'none',
            borderRadius: '0'
          }}>Description (for AI)</label>
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
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }} onClick={onClose} disabled={loading}
          onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(255,255,255,0.1)'; } }}
          onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(255,255,255,0.05)'; } }}
          >Cancel</button>
          
          <button className="btn-primary" style={{ 
            background: '#ff00ff', 
            color: '#fff',
            border: '2px solid #ff00ff',
            borderRadius: '0',
            textTransform: 'uppercase',
            fontWeight: '900',
            letterSpacing: '1px',
            padding: '12px 24px',
            boxShadow: '6px 6px 0 rgba(150, 0, 150, 0.6)',
            transition: 'all 0.2s ease',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.8 : 1
          }} onClick={handleGenerate} disabled={loading}
          onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '8px 8px 0 rgba(150, 0, 150, 0.8)'; e.target.style.background = '#ff33ff'; } }}
          onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'translate(0, 0)'; e.target.style.boxShadow = '6px 6px 0 rgba(150, 0, 150, 0.6)'; e.target.style.background = '#ff00ff'; } }}
          >
            {loading ? '🤖 MAPPING...' : 'GENERATE CONFIG'}
          </button>
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

export default AddWorkflowModal;
