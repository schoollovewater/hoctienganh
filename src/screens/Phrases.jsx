import { useState } from 'react';
import { db, useLive } from '../db';
import { ShadowBar } from '../components/ui';
import { PHRASE_TOPICS } from '../data/seedPhrases';

export default function Phrases({ onEdit }) {
  const [topic, setTopic] = useState(null);
  const cards = useLive(() => db.cards.where('type').equals('phrase').toArray(), [], []);

  if (topic) {
    const meta = PHRASE_TOPICS[topic];
    const list = cards.filter((c) => c.topic === topic);
    return (
      <main className="screen" key={topic}>
        <header className="screen-header">
          <button className="icon-btn" onClick={() => setTopic(null)} aria-label="Quay lại">←</button>
          <div className="grow">
            <h1 style={{ fontSize: 22 }}>{meta.icon} {meta.label}</h1>
            <p className="subtitle">{list.length} mẫu câu · Nghe → Ghi âm → So sánh</p>
          </div>
        </header>

        <div className="list" style={{ gap: 10 }}>
          {list.map((c) => (
            <article key={c.id} className="phrase-card">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="en">{c.front}</div>
                  <div className="vi">{c.meaning}</div>
                </div>
                <button className="icon-btn sm" onClick={() => onEdit(c)} aria-label="Sửa">✎</button>
              </div>
              <ShadowBar card={c} />
            </article>
          ))}
        </div>

        <button id="add-phrase" className="fab" onClick={() => onEdit({ type: 'phrase', topic })} aria-label="Thêm mẫu câu">＋</button>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <h1>Giao tiếp</h1>
          <p className="subtitle">Chọn tình huống để luyện nói</p>
        </div>
      </header>

      <div className="topic-grid">
        {Object.entries(PHRASE_TOPICS).map(([k, meta]) => {
          const list = cards.filter((c) => c.topic === k);
          const learned = list.filter((c) => c.status === 1).length;
          const pct = list.length ? (learned / list.length) * 100 : 0;
          return (
            <button key={k} id={`topic-${k}`} className="topic" onClick={() => setTopic(k)}>
              <span className="emoji">{meta.icon}</span>
              <div>
                <div className="name">{meta.label}</div>
                <div className="muted small">{learned}/{list.length} đã học</div>
                <div className="progress"><i style={{ width: `${pct}%` }} /></div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>🎧 Cách luyện</div>
        <ol className="muted small" style={{ lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Bấm 🔊 nghe mẫu 2–3 lần</li>
          <li>Bấm 🎙️ đọc theo, cố bắt chước nhịp và ngữ điệu</li>
          <li>Bấm ▶️ nghe lại giọng mình và so sánh</li>
        </ol>
      </div>
    </main>
  );
}
