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
            toast.error("Disconnected from Live Agent");
        };
        
        setWs(socket);
    };

    const disconnect = () => {
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

    return (
        <div className="LiveCopilot-container" style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 140px)', padding: '0 2rem 2rem' }}>
            {/* Left Panel: Cyber-deck Chat & Controls */}
            <div className="live-panel-left" style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                background: '#0a0a0c', 
                border: '1px solid rgba(0, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(0, 255, 255, 0.05), inset 0 0 20px rgba(0,255,255,0.02)',
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
            <div className="live-panel-right" style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                background: '#0a0a0c', 
                border: '1px solid rgba(255, 0, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(255, 0, 255, 0.05), inset 0 0 20px rgba(255,0,255,0.02)',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ 
                    padding: '1.2rem', 
                    borderBottom: '1px solid rgba(255, 0, 255, 0.2)',
                    background: 'linear-gradient(90deg, rgba(255, 0, 255, 0.05) 0%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <h2 style={{ 
                        margin: 0, fontSize: '18px', fontWeight: '800', 
                        color: '#fff', textTransform: 'uppercase', letterSpacing: '2px',
                        fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <span style={{ color: '#ff00ff' }}>■</span> OPTIC_SENSOR_FEED
                    </h2>
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
                        <div style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                            <img 
                                src={`data:image/jpeg;base64,${screenshot}`} 
                                alt="Live Feed" 
                                onClick={handleRemoteClick}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'contrast(1.1) brightness(1.05)', cursor: connected && !isRunning ? 'crosshair' : 'default' }} 
                            />
                            
                            <button 
                                onClick={handleRemoteType}
                                disabled={!connected || isRunning}
                                style={{
                                    position: 'absolute', bottom: '10px', right: '10px', zIndex: 20,
                                    background: 'rgba(255, 0, 255, 0.2)', border: '1px solid #ff00ff',
                                    color: '#ff00ff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                                    fontFamily: 'monospace', fontWeight: 'bold'
                                }}>
                                [⌨️ REMOTE TYPE]
                            </button>
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
