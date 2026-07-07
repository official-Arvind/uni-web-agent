export const getBackendUrl = () => {
    let custom = localStorage.getItem('backend_url');
    if (custom) {
        custom = custom.trim();
        if (custom.endsWith('/')) custom = custom.slice(0, -1);
        return custom;
    }
    // Check if we are running in production on a relative path
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('github.io')) {
        return window.location.origin;
    }
    return 'http://localhost:8000';
};

export const getWsUrl = () => {
    let custom = localStorage.getItem('backend_url');
    if (custom) {
        custom = custom.trim();
        if (custom.endsWith('/')) custom = custom.slice(0, -1);
        if (custom.startsWith('https://')) return custom.replace('https://', 'wss://') + '/ws/live-agent';
        if (custom.startsWith('http://')) return custom.replace('http://', 'ws://') + '/ws/live-agent';
        return `ws://${custom}/ws/live-agent`;
    }
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('github.io')) {
        return window.location.origin.replace(/^http/, 'ws') + '/ws/live-agent';
    }
    return 'ws://localhost:8000/ws/live-agent';
};

export const getFetchHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true' // Bypasses localtunnel warning screen
    };
};
