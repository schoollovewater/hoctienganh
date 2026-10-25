import { useEffect, useState } from 'react';
import { canRecord, speak, useRecorder } from '../speech';

// Bộ điều khiển shadowing: Nghe → Ghi âm → Nghe lại
export function ShadowBar({ card, compact = false }) {
  const { state, url, start, stop, play } = useRecorder(card.id);
  const recording = state === 'recording';
  return (
    <div className="shadow-bar" onClick={(e) => e.stopPropagation()}>
      <button className="btn" onClick={() => speak(card.front)} aria-label="Nghe mẫu">
        🔊{!compact && ' Nghe'}
      </button>
      {canRecord() && (
        <button
          className={`btn ${recording ? 'rec-on' : ''}`}
          onClick={recording ? stop : start}
          aria-label={recording ? 'Dừng ghi âm' : 'Ghi âm'}
        >
          {recording ? '⏹ Dừng' : `🎙️${compact ? '' : ' Ghi âm'}`}
        </button>
      )}
      {canRecord() && (
        <button className="btn" onClick={play} disabled={!url || recording} aria-label="Nghe lại giọng của tôi">
          ▶️{!compact && ' Của tôi'}
        </button>
      )}
      {state === 'error' && <span className="small" style={{ color: 'var(--coral)' }}>Không truy cập được micro</span>}
    </div>
  );
}

// ---------- Toast ----------
export function toast(message) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: message }));
}

export function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const on = (e) => {
      setMsg(e.detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2200);
    };
    window.addEventListener('app-toast', on);
    return () => { window.removeEventListener('app-toast', on); clearTimeout(t); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

// ---------- Bottom sheet ----------
export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="grabber" />
        <div className="row" style={{ marginBottom: 14 }}>
          <h2 className="grow" style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn sm" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        {children}
      </div>
    </>
  );
}
