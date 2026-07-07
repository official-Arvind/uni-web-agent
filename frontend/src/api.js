export const getBackendUrl = () => {
    const custom = localStorage.getItem('backend_url');
    if (custom) return custom;
    return 'http://localhost:8000';
};

export const getWsUrl = () => {
    const custom = localStorage.getItem('backend_url');
    if (custom) {
        if (custom.startsWith('https://')) return custom.replace('https://', 'wss://') + '/ws/live-agent';
        if (custom.startsWith('http://')) return custom.replace('http://', 'ws://') + '/ws/live-agent';
        return `ws://${custom}/ws/live-agent`;
    }
    return 'ws://localhost:8000/ws/live-agent';
};

export const getFetchHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true' // Bypasses localtunnel warning screen
    };
};
