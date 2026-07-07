import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getBackendUrl, getFetchHeaders } from '../api';

const WorkflowList = ({ domain }) => {
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    fetch(`${getBackendUrl()}/api/v1/sites/${domain}/workflows`, { headers: getFetchHeaders() })
      .then(res => res.json())
      .then(data => setWorkflows(data))
      .catch(err => {
        console.error("Failed to fetch workflows", err);
        toast.error("Failed to fetch workflows");
      });
  }, [domain]);

  const handleRun = async (workflowId) => {
    try {
      await fetch(`${getBackendUrl()}/api/v1/sites/${domain}/workflows/${workflowId}/run`, {
        method: 'POST',
        headers: getFetchHeaders(),
        body: JSON.stringify({ headless: true, screenshot_on_fail: true })
      });
      toast.success('EXECUTION INITIATED // CHECK LOGS');
    } catch (e) {
      console.error(e);
      toast.error('EXECUTION FAILED');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {workflows.length === 0 ? (
        <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>No protocols found</div>
      ) : workflows.map(wf => (
        <div key={wf.workflow_id} style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderLeft: '4px solid #667eea',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{wf.workflow_name}</h4>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', lineHeight: 1.4 }}>{wf.workflow_description || 'No description provided.'}</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 800, textTransform: 'uppercase' }}>Steps</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{wf.steps_count}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 800, textTransform: 'uppercase' }}>Heals</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{wf.heal_count}</span>
              </div>
            </div>
            
            <button 
              className="btn-primary" 
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.8rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                background: '#667eea', 
                color: '#fff', 
                border: 'none',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px rgba(0,0,0,0.5)'
              }} 
              onClick={() => handleRun(wf.workflow_id)}
              onMouseEnter={(e) => { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '4px 4px 0px rgba(0,0,0,0.5)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)'; }}
            >
              Execute
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowList;
