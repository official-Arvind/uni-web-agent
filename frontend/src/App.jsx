import { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Dashboard from './components/Dashboard'
import Navbar from './components/Navbar'
import SettingsModal from './components/SettingsModal'
import LiveCopilot from './components/LiveCopilot'

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    toast('JIGAR UWA SYS_INIT COMPLETE', {
      icon: '🚀',
      style: { border: '1px solid #00ffcc', color: '#00ffcc' }
    });
  }, []);

  return (
    <div className="App fade-in">
      <div className="app-background"></div>
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            background: 'rgba(10, 10, 10, 0.8)', 
            backdropFilter: 'blur(16px)',
            color: '#fff',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 127, 0.3)',
            boxShadow: '0 0 20px rgba(255, 0, 127, 0.2)'
          } 
        }} 
      />
      <Navbar onOpenSettings={() => setShowSettings(true)} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {activeTab === 'dashboard' ? <Dashboard /> : <LiveCopilot />}
      </main>
      
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
