import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getWsUrl } from '../api';

export default function LiveCopilot() {
    const [ws, setWs] = useState(null);
    const [connected, setConnected] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [logs, setLogs] = useState([]);
    const [screenshot, setScreenshot] = useState(null);
    const [url, setUrl] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    
    // Virtual Trackpad State
    const [cursor, setCursor] = useState({ x: 50, y: 50 });
    const [isVirtualTrackpad, setIsVirtualTrackpad] = useState(false);
    const lastTouch = useRef(null);
    const intentionalDisconnect = useRef(false);
    
    const logsEndRef = useRef(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const connect = () => {
        if (ws) return;
        const socket = new WebSocket(getWsUrl());
        
        socket.onopen = () => {
            setConnected(true);
            toast.success("Connected to Live Agent");
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
                setLogs(prev => [...prev, { type: 'info', text: data.message }]);
            } else if (data.type === 'question') {
                setLogs(prev => [...prev, { type: 'question', text: `🤖 AI: ${data.message}` }]);
                setIsRunning(false);
            } else if (data.type === 'error') {
                setLogs(prev => [...prev, { type: 'error', text: data.message }]);
                toast.error(data.message);
                setIsRunning(false);
            } else if (data.type === 'status') {
                setLogs(prev => [...prev, { type: 'success', text: data.message }]);
                toast.success(data.message);
                setIsRunning(false);
            } else if (data.type === 'screenshot') {
                setScreenshot(data.data);
                if (data.url) setUrl(data.url);
            }
        };
        
        socket.onclose = () => {
            setConnected(false);
            setWs(null);
            setIsRunning(false);
            if (!intentionalDisconnect.current) {
                toast.error("Connection lost. Reconnecting in 3s...", { id: 'ws-err' });
                setTimeout(connect, 3000);
            } else {
                toast.success("Disconnected from Live Agent");
            }
        };
        
        setWs(socket);
        intentionalDisconnect.current = false;
    };

    const disconnect = () => {
        intentionalDisconnect.current = true;
        if (ws) {
            ws.close();
            setWs(null);
            setScreenshot(null);
            setUrl('');
            setLogs([]);
        }
    };

    const sendInstruction = (e) => {
        e.preventDefault();
        if (!ws || !connected || !instruction.trim()) return;
        
        setIsRunning(true);
        setLogs(prev => [...prev, { type: 'user', text: `> USER_COMMAND: ${instruction}` }]);
        ws.send(JSON.stringify({ instruction: instruction.trim() }));
        setInstruction('');
    };

    const handleRemoteClick = (e) => {
        if (isVirtualTrackpad) return; // Prevent double clicks if trackpad active
        if (!ws || !connected || isRunning) return;
        const rect = e.target.getBoundingClientRect();
        // Since image is objectFit: contain, clicking might be outside actual image if aspect ratio differs.
        // For simplicity, we just calculate % of the container for now.
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

    const handleTouchStart = (e) => {
        if (!isVirtualTrackpad) return;
        if (e.target.closest('button')) return; // Ignore button touches
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e) => {
        if (!isVirtualTrackpad || !lastTouch.current) return;
        if (e.target.closest('button')) return;
        e.preventDefault(); // Prevent scrolling
        
        const dx = e.touches[0].clientX - lastTouch.current.x;
        const dy = e.touches[0].clientY - lastTouch.current.y;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        const elem = document.getElementById('live-feed-container');
        if (!elem) return;
        const rect = elem.getBoundingClientRect();
        const dxPct = (dx / rect.width) * 100;
        const dyPct = (dy / rect.height) * 100;
        
        setCursor(prev => ({
            x: Math.max(0, Math.min(100, prev.x + dxPct * 1.5)),
            y: Math.max(0, Math.min(100, prev.y + dyPct * 1.5))
        }));
    };

    const handleTouchEnd = () => {
        lastTouch.current = null;
    };

    const handleTrackpadClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!ws || !connected || isRunning) return;
        ws.send(JSON.stringify({ remote_action: 'click', x: cursor.x / 100, y: cursor.y / 100 }));
        toast('Trackpad Click Sent', { icon: '🖱️', style: { background: '#333', color: '#fff', fontSize: '12px' }});
    };

    return (
        <div className="bento-grid LiveCopilot-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.5fr)', gap: '24px', height: 'calc(100vh - 140px)', padding: '0 2rem 2rem' }}>
            {/* Left Panel: Cyber-deck Chat & Controls */}
            <div className="live-panel-left bento-item liquid-glass" style={{ 
                display: 'flex', flexDirection: 'column', 
                border: '1px solid rgba(0, 255, 255, 0.15)',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Cyberpunk Header */}
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.2rem', 
                    borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
                    background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.05) 0%, transparent 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', 
                            background: connected ? '#00ffcc' : '#ff3366',
                            boxShadow: connected ? '0 0 10px #00ffcc' : '0 0 10px #ff3366'
                        }}></div>
                        <h2 style={{ 
                            margin: 0, fontSize: '18px', fontWeight: '800', 
                            color: '#fff', textTransform: 'uppercase', letterSpacing: '2px',
                            fontFamily: 'monospace'
                        }}>
                            SYS.TERMINAL // AI_CORE
                        </h2>
                    </div>
                    {connected ? (
                        <button onClick={disconnect} style={{
                            background: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', border: '1px solid #ff3366',
                            padding: '6px 16px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer',
                            textTransform: 'uppercase', boxShadow: '0 0 10px rgba(255, 51, 102, 0.2)'
                        }}>TERMINATE_LINK</button>
                    ) : (
                        <button onClick={connect} style={{
                            background: 'rgba(0, 255, 204, 0.1)', color: '#00ffcc', border: '1px solid #00ffcc',
                            padding: '6px 16px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer',
                            textTransform: 'uppercase', boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)'
                        }}>INIT_UPLINK</button>
                    )}
                </div>

                {/* Logs Area */}
                <div style={{ 
                    flex: 1, overflowY: 'auto', padding: '1.5rem', 
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    {logs.length === 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>
                            [ WAITING FOR SYSTEM INITIALIZATION... ]
                        </div>
                    )}
                    {logs.map((log, i) => {
                        const isWorkflow = log.text.includes("Running Zero-Token Workflow");
                        
                        let bg, border, color, icon;
                        if (log.type === 'user') {
                            bg = 'rgba(0, 150, 255, 0.05)';
                            border = '1px solid rgba(0, 150, 255, 0.3)';
                            color = '#66b3ff';
                            icon = '>';
                        } else if (log.type === 'question') {
                            bg = 'rgba(255, 204, 0, 0.05)';
                            border = '1px solid rgba(255, 204, 0, 0.4)';
                            color = '#ffcc00';
                            icon = '[?]';
                        } else if (log.type === 'error') {
                            bg = 'rgba(255, 51, 102, 0.05)';
                            border = '1px solid rgba(255, 51, 102, 0.4)';
                            color = '#ff6688';
                            icon = '[ERR]';
                        } else if (log.type === 'success' || isWorkflow) {
                            bg = 'rgba(0, 255, 204, 0.05)';
                            border = '1px solid rgba(0, 255, 204, 0.4)';
                            color = '#00ffcc';
                            icon = '[OK]';
                        } else {
                            bg = 'transparent';
                            border = '1px dashed rgba(255, 255, 255, 0.1)';
                            color = '#a0a0b0';
                            icon = '[SYS]';
                        }

                        return (
                            <div key={i} style={{ 
                                padding: '12px 16px', 
                                background: bg,
                                border: border,
                                borderLeft: `4px solid ${color}`,
                                color: color,
                                fontSize: '13px',
                                animation: 'fadeIn 0.2s ease-out forwards',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                display: 'flex',
                                gap: '12px',
                                textShadow: `0 0 8px ${color}40`,
                                borderRadius: '0 4px 4px 0'
                            }}>
                                <span style={{ opacity: 0.7, fontWeight: 'bold' }}>{icon}</span>
                                <span style={{ lineHeight: '1.5' }}>{log.text}</span>
                            </div>
                        )
                    })}
                    {isRunning && (
                        <div style={{ 
                            padding: '12px 16px', color: '#ff00ff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px',
                            border: '1px solid rgba(255, 0, 255, 0.2)', borderLeft: '4px solid #ff00ff', background: 'rgba(255, 0, 255, 0.05)'
                        }}>
                            <div style={{ width: '8px', height: '8px', background: '#ff00ff', boxShadow: '0 0 10px #ff00ff', animation: 'blink 1s infinite' }}></div>
                            <span style={{ fontFamily: 'monospace' }}>PROCESSING_ROUTINE...</span>
                        </div>
                    )}
                    <div ref={logsEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(0, 255, 255, 0.2)', background: 'rgba(0,0,0,0.3)' }}>
                    <form onSubmit={sendInstruction} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ 
                            flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0, 255, 255, 0.03)', 
                            border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '4px', padding: '0 12px' 
                        }}>
                            <span style={{ color: '#00ffff', marginRight: '8px', fontFamily: 'monospace' }}>$</span>
                            <input 
                                type="text" 
                                style={{ 
                                    flex: 1, background: 'transparent', border: 'none', color: '#fff', 
                                    padding: '12px 0', fontFamily: 'monospace', fontSize: '14px', outline: 'none'
                                }}
                                placeholder="ENTER_COMMAND..." 
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                disabled={!connected || isRunning}
                            />
                        </div>
                        <button type="submit" disabled={!connected || isRunning || !instruction.trim()} style={{
                            background: instruction.trim() && connected && !isRunning ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: instruction.trim() && connected && !isRunning ? '#00ffff' : '#666',
                            border: `1px solid ${instruction.trim() && connected && !isRunning ? '#00ffff' : '#333'}`,
                            padding: '0 20px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer',
                            textTransform: 'uppercase', transition: 'all 0.2s',
                            boxShadow: instruction.trim() && connected && !isRunning ? '0 0 15px rgba(0, 255, 255, 0.2)' : 'none'
                        }}>
                            {isRunning ? 'EXEC...' : 'EXECUTE'}
                        </button>
                    </form>
                </div>
                
                {/* CSS Animations */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                `}} />
            </div>

            {/* Right Panel: Holographic Live View */}
            <div className="live-panel-right bento-item liquid-glass" style={{ 
                display: 'flex', flexDirection: 'column', 
                border: '1px solid rgba(255, 0, 255, 0.15)',
                borderRadius: '24px',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ 
                    padding: '1.2rem', 
                    borderBottom: '1px solid rgba(255, 0, 255, 0.2)',
                    background: 'linear-gradient(90deg, rgba(255, 0, 255, 0.05) 0%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ 
                            margin: 0, fontSize: '18px', fontWeight: '800', 
                            color: '#fff', textTransform: 'uppercase', letterSpacing: '2px',
                            fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <span style={{ color: '#ff00ff' }}>■</span> OPTIC_SENSOR_FEED
                        </h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setIsVirtualTrackpad(!isVirtualTrackpad)}
                                style={{
                                    background: isVirtualTrackpad ? 'rgba(0, 255, 100, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    border: isVirtualTrackpad ? '1px solid #00ff66' : '1px solid #555',
                                    color: isVirtualTrackpad ? '#00ff66' : '#aaa',
                                    padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                                    fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                                }}>
                                [🕹️ TRACKPAD: {isVirtualTrackpad ? 'ON' : 'OFF'}]
                            </button>
                            <button 
                                onClick={handleRemoteType}
                                disabled={!connected || isRunning}
                                style={{
                                    background: 'rgba(255, 0, 255, 0.2)', border: '1px solid #ff00ff',
                                    color: '#ff00ff', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                                    fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                                    opacity: (!connected || isRunning) ? 0.5 : 1
                                }}>
                                [⌨️ REMOTE TYPE]
                            </button>
                            <button 
                                onClick={() => {
                                    const elem = document.getElementById('live-feed-container');
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
                                [⛶ FULL SCREEN]
                            </button>
                        </div>
                    </div>
                    <div style={{ 
                        fontFamily: 'monospace', fontSize: '12px', color: '#ff00ff', opacity: 0.8,
                        background: 'rgba(255,0,255,0.1)', padding: '4px 8px', borderRadius: '4px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        TARGET_URI: {url || 'NULL'}
                    </div>
                </div>

                <div style={{ 
                    flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden', padding: '1rem'
                }}>
                    {/* Scanline Effect Overlay */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1))',
                        backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 10
                    }}></div>
                    
                    {screenshot ? (
                        <div 
                            id="live-feed-container" 
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}
                        >
                            <img 
                                src={`data:image/jpeg;base64,${screenshot}`} 
                                alt="Live Feed" 
                                onClick={handleRemoteClick}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'contrast(1.1) brightness(1.05)', cursor: connected && !isRunning ? 'crosshair' : 'default', background: '#000', pointerEvents: isVirtualTrackpad ? 'none' : 'auto' }} 
                            />
                            
                            {isVirtualTrackpad && (
                                <>
                                    {/* Virtual Cursor */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${cursor.x}%`,
                                        top: `${cursor.y}%`,
                                        width: '24px', height: '24px',
                                        marginLeft: '-2px', marginTop: '-2px',
                                        pointerEvents: 'none',
                                        zIndex: 50
                                    }}>
                                        <svg viewBox="0 0 32 32" fill="none" stroke="#00ffcc" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }}>
                                            <path d="M12 12 L24 24 M12 12 L12 28 L17 23 L22 30 L26 28 L21 21 L28 21 Z" fill="rgba(0,255,204,0.5)" />
                                        </svg>
                                    </div>
                                    
                                    {/* Action Buttons Overlay */}
                                    <div style={{
                                        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                                        display: 'flex', gap: '16px', zIndex: 100
                                    }}>
                                        <button 
                                            onClick={handleTrackpadClick}
                                            disabled={!connected || isRunning}
                                            style={{
                                                padding: '12px 24px', borderRadius: '24px', background: 'rgba(0,255,204,0.2)',
                                                border: '1px solid #00ffcc', color: '#fff', fontWeight: 'bold',
                                                backdropFilter: 'blur(10px)', boxShadow: '0 0 15px rgba(0,255,204,0.4)',
                                                cursor: 'pointer'
                                            }}>
                                            🖱️ CLICK HERE
                                        </button>
                                        <button 
                                            onClick={handleRemoteType}
                                            disabled={!connected || isRunning}
                                            style={{
                                                padding: '12px 24px', borderRadius: '24px', background: 'rgba(255,0,255,0.2)',
                                                border: '1px solid #ff00ff', color: '#fff', fontWeight: 'bold',
                                                backdropFilter: 'blur(10px)', boxShadow: '0 0 15px rgba(255,0,255,0.4)',
                                                cursor: 'pointer'
                                            }}>
                                            ⌨️ TYPE
                                        </button>
                                    </div>
                                </>
                            )}
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
