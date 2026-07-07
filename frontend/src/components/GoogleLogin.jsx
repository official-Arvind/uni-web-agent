import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getWsUrl } from '../api';

export default function GoogleLogin() {
    const [ws, setWs] = useState(null);
    const [connected, setConnected] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [url, setUrl] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        // Auto-connect on mount
        const socket = new WebSocket(getWsUrl());
        
        socket.onopen = () => {
            setConnected(true);
            toast.success("Connected to Auth Browser");
            socket.send(JSON.stringify({ action: "start_auth" }));
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'screenshot') {
                setScreenshot(data.data);
                if (data.url) setUrl(data.url);
            } else if (data.type === 'status' || data.type === 'error' || data.type === 'question') {
                setIsRunning(false);
            }
        };
        
        socket.onclose = () => {
            setConnected(false);
            setWs(null);
            setIsRunning(false);
            toast.error("Disconnected from Auth Browser");
        };
        
        setWs(socket);

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    const handleRemoteClick = (e) => {
        if (!ws || !connected || isRunning) return;
        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        ws.send(JSON.stringify({ remote_action: 'click', x, y }));
        toast('Remote Click Sent', { icon: '🖱️', style: { background: '#333', color: '#fff', fontSize: '12px' }});
    };

    const handleRemoteType = () => {
        if (!ws || !connected || isRunning) return;
        const text = prompt("Enter text to type at cursor position:");
        if (text) {
            ws.send(JSON.stringify({ remote_action: 'type', text }));
            toast('Remote Typed: ' + text, { icon: '⌨️', style: { background: '#333', color: '#fff', fontSize: '12px' }});
        }
    };

    return (
        <div className="bento-grid" style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: 'calc(100vh - 140px)', padding: '0 2rem 2rem', gap: '24px' }}>
            <div className="bento-item liquid-glass" style={{
                border: '1px solid rgba(0, 255, 255, 0.15)',
                borderRadius: '24px',
                padding: '1.5rem',
                textAlign: 'center'
            }}>
                <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Google Authentication Link
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0, fontSize: '14px' }}>
                    Use the viewer below to interact with the backend browser and log in to your Google Account.
                </p>
            </div>

            <div className="bento-item liquid-glass" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                border: '1px solid rgba(0, 255, 255, 0.15)',
                borderRadius: '24px',
                overflow: 'hidden'
            }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px 16px', background: 'rgba(0,0,0,0.5)', 
                    borderBottom: '1px solid rgba(0, 255, 255, 0.1)' 
                }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff3366' }}></div>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffcc00' }}></div>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ffcc' }}></div>
                    </div>
                    <div style={{ 
                        flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', 
                        padding: '6px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', 
                        fontFamily: 'monospace', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        TARGET_URI: {url || 'NULL'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={handleRemoteType}
                            disabled={!connected || isRunning}
                            style={{
                                background: 'rgba(255, 0, 255, 0.2)', border: '1px solid #ff00ff',
                                color: '#ff00ff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                                fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                                opacity: (!connected || isRunning) ? 0.5 : 1
                            }}>
                            [⌨️ TYPE]
                        </button>
                        <button 
                            onClick={() => {
                                const elem = document.getElementById('google-feed-container');
                                if (elem && elem.requestFullscreen) {
                                    elem.requestFullscreen();
                                }
                            }}
                            disabled={!screenshot}
                            style={{
                                background: 'rgba(0, 255, 255, 0.2)', border: '1px solid #00ffff',
                                color: '#00ffff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                                fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                                opacity: !screenshot ? 0.5 : 1
                            }}>
                            [⛶ FULL]
                        </button>
                        <div style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold',
                            background: connected ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 51, 102, 0.1)',
                            color: connected ? '#00ffcc' : '#ff3366',
                            border: connected ? '1px solid #00ffcc' : '1px solid #ff3366',
                            display: 'flex', alignItems: 'center'
                        }}>
                            {connected ? 'CONNECTED' : 'OFFLINE'}
                        </div>
                    </div>
                </div>

                <div style={{ 
                    flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden', padding: '1rem'
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1))',
                        backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 10
                    }}></div>
                    
                    {screenshot ? (
                        <div id="google-feed-container" style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                            <img 
                                src={`data:image/jpeg;base64,${screenshot}`} 
                                alt="Live Feed" 
                                onClick={handleRemoteClick}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'contrast(1.1) brightness(1.05)', cursor: connected && !isRunning ? 'crosshair' : 'default', background: '#000' }} 
                            />
                        </div>
                    ) : (
                        <div style={{ color: 'rgba(255,0,255,0.4)', textAlign: 'center', fontFamily: 'monospace' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>∅</div>
                            <div style={{ letterSpacing: '2px' }}>NO_VIDEO_SIGNAL_DETECTED</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
