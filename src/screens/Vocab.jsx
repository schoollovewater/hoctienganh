import { useState } from 'react';
import { db, useLive } from '../db';
import { dueLabel } from '../srs';
import { speak } from '../speech';
import { VOCAB_TOPICS } from '../data/seedVocab';

export default function Vocab({ onEdit }) {
  const [topic, setTopic] = useState('all');
  const [q, setQ] = useState('');

  const cards = useLive(() => db.cards.where('type').equals('vocab').toArray(), [], []);

  const query = q.trim().toLowerCase();
  const list = cards
    .filter((c) => topic === 'all' || c.topic === topic)
    .filter((c) => !query || c.front.toLowerCase().includes(query) || c.meaning.toLowerCase().includes(query));

  const counts = cards.reduce((m, c) => ((m[c.topic] = (m[c.topic] || 0) + 1), m), {});

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <h1>Từ vựng</h1>
          <p className="subtitle">{cards.length} thẻ · {cards.filter((c) => c.status === 1).length} đã học</p>
        </div>
      </header>

      <input
        id="vocab-search"
        className="search"
        type="search"
        placeholder="Tìm từ hoặc nghĩa..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="chip-row" style={{ marginBottom: 14 }}>
        <button className={`chip ${topic === 'all' ? 'active' : ''}`} onClick={() => setTopic('all')}>
          Tất cả
        </button>
        {Object.entries(VOCAB_TOPICS)
          .filter(([k]) => counts[k])
          .map(([k, label]) => (
            <button key={k} className={`chip ${topic === k ? 'active' : ''}`} onClick={() => setTopic(k)}>
              {label} · {counts[k]}
            </button>
          ))}
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="big">🔍</div>Không tìm thấy thẻ nào</div>
      ) : (
        <div className="list">
          {list.map((c) => {
            const label = dueLabel(c);
            const cls = c.status === 0 ? 'new' : label === 'Đến hạn' ? 'due' : 'ok';
            return (
              <div key={c.id} className="list-item" role="button" tabIndex={0} onClick={() => onEdit(c)}>
                <div className="grow">
                  <div className="title">{c.front}</div>
                  <div className="sub">{c.meaning}</div>
                </div>
                <span className={`badge ${cls}`}>{label}</span>
                <button
                  className="icon-btn sm"
                  onClick={(e) => { e.stopPropagation(); speak(c.front); }}
                  aria-label={`Nghe ${c.front}`}
                >🔊</button>
              </div>
            );
          })}
        </div>
      )}

      <button
        id="add-vocab"
        className="fab"
        onClick={() => onEdit({ type: 'vocab', topic: topic === 'all' ? 'work' : topic })}
        aria-label="Thêm từ mới"
      >＋</button>
    </main>
  );
}
