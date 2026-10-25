import { useEffect, useState } from 'react';
import { ensureSeed } from './db';
import { ToastHost } from './components/ui';
import Today from './screens/Today';
import Vocab from './screens/Vocab';
import Phrases from './screens/Phrases';
import Review from './screens/Review';
import CardEditor from './screens/CardEditor';
import Settings from './screens/Settings';

const TABS = [
  { id: 'today', label: 'Hôm nay', icon: '📅' },
  { id: 'vocab', label: 'Từ vựng', icon: '🃏' },
  { id: 'phrases', label: 'Giao tiếp', icon: '💬' },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('today');
  const [session, setSession] = useState(null); // 'daily' | 'extra'
  const [editing, setEditing] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    ensureSeed().then(() => setReady(true));
    navigator.storage?.persist?.(); // xin trình duyệt giữ dữ liệu lâu dài
  }, []);

  if (!ready) return null;

  return (
    <div className="app">
      {tab === 'today' && <Today onStart={setSession} onSettings={() => setSettingsOpen(true)} />}
      {tab === 'vocab' && <Vocab onEdit={setEditing} />}
      {tab === 'phrases' && <Phrases onEdit={setEditing} />}

      <nav className="tabbar" aria-label="Điều hướng">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="ico">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {session && <Review mode={session} onClose={() => setSession(null)} />}
      {editing && <CardEditor card={editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      <ToastHost />
    </div>
  );
}
