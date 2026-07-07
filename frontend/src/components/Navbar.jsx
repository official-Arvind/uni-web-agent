import React from 'react';

const Navbar = ({ onOpenSettings, activeTab, setActiveTab }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'sticky', top: '1.5rem', zIndex: 100, marginBottom: '2.5rem' }}>
            <nav className="flex-between" style={{ 
                background: 'rgba(10, 10, 15, 0.7)', 
                backdropFilter: 'blur(20px)', 
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                width: '90%',
                maxWidth: '1200px',
                borderRadius: '50px',
                padding: '16px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
                <div className="flex-center" style={{ gap: '12px', paddingLeft: '8px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(79, 172, 254, 0.5)'
                    }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.05em', fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>
                        Jigar <span style={{ color: '#4facfe' }}>UWA</span>
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingRight: '8px' }}>
                    <button 
                        style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: activeTab === 'dashboard' ? 'rgba(79, 172, 254, 0.15)' : 'transparent',
                            color: activeTab === 'dashboard' ? '#4facfe' : '#a0a0b0',
                            boxShadow: activeTab === 'dashboard' ? '0 0 20px rgba(79, 172, 254, 0.2), inset 0 0 10px rgba(79, 172, 254, 0.1)' : 'none',
                            border: activeTab === 'dashboard' ? '1px solid rgba(79, 172, 254, 0.3)' : '1px solid transparent'
                        }}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button 
                        style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: activeTab === 'live' ? 'rgba(255, 42, 133, 0.15)' : 'transparent',
                            color: activeTab === 'live' ? '#ff2a85' : '#a0a0b0',
                            boxShadow: activeTab === 'live' ? '0 0 20px rgba(255, 42, 133, 0.2), inset 0 0 10px rgba(255, 42, 133, 0.1)' : 'none',
                            border: activeTab === 'live' ? '1px solid rgba(255, 42, 133, 0.3)' : '1px solid transparent'
                        }}
                        onClick={() => setActiveTab('live')}
                    >
                        Live Copilot
                    </button>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
                    <button 
                        style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e0e0e0',
                            fontWeight: '500',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onClick={onOpenSettings}
                    >
                        <span style={{ fontSize: '16px' }}>⚙️</span> Settings
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
