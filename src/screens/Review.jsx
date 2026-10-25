import { useCallback, useEffect, useMemo, useState } from 'react';
import { bumpStats, db, endOfToday, getSettings, todayKey } from '../db';
import { formatInterval, nextInterval, schedule } from '../srs';
import { speak } from '../speech';
import { ShadowBar } from '../components/ui';
import { VOCAB_TOPICS } from '../data/seedVocab';
import { PHRASE_TOPICS } from '../data/seedPhrases';

// mode: 'daily' (thẻ đến hạn + thẻ mới theo hạn mức) | 'extra' (thêm thẻ mới)
export async function buildSession(mode = 'daily') {
  const s = getSettings();
  const stat = (await db.stats.get(todayKey())) || {};
  const due = mode === 'daily'
    ? (await db.cards.where('due').between(1, endOfToday(), true, true).toArray())
        .filter((c) => c.status === 1)
        .sort((a, b) => a.due - b.due)
    : [];
  const nV = mode === 'daily' ? Math.max(0, s.newVocab - (stat.newVocab || 0)) : s.newVocab;
  const nP = mode === 'daily' ? Math.max(0, s.newPhrase - (stat.newPhrase || 0)) : s.newPhrase;
  const fresh = await db.cards.where('status').equals(0).sortBy('createdAt');
  const newV = fresh.filter((c) => c.type === 'vocab').slice(0, nV);
  const newP = fresh.filter((c) => c.type === 'phrase').slice(0, nP);
  return [...due, ...newV, ...newP];
}

const GRADES = [
  { g: 0, label: 'Quên' },
  { g: 1, label: 'Khó' },
  { g: 2, label: 'Nhớ' },
  { g: 3, label: 'Dễ' },
];

function topicLabel(card) {
  return card.type === 'vocab' ? VOCAB_TOPICS[card.topic] : PHRASE_TOPICS[card.topic]?.label;
}

export default function Review({ mode, onClose }) {
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({ reviewed: 0, learned: 0, again: 0 });
  const total = useMemo(() => queue?.filter((c) => !c._relearn).length ?? 0, [queue]);

  useEffect(() => {
    buildSession(mode).then(setQueue);
  }, [mode]);

  const card = queue?.[idx];
  const autoPlay = getSettings().autoPlay;

  // Tự đọc: từ vựng đọc ngay ở mặt trước; mẫu câu đọc khi lật (vì mặt trước là tiếng Việt)
  useEffect(() => {
    if (!card || !autoPlay) return;
    if (card.type === 'vocab' && !flipped) speak(card.front);
    if (card.type === 'phrase' && flipped) speak(card.front);
  }, [card, flipped, autoPlay]);

  const grade = useCallback(async (g) => {
    if (!card) return;
    const next = [...queue];
    if (!card._relearn) {
      const wasNew = card.status === 0;
      const updated = schedule(card, g);
      delete updated._relearn;
      await db.cards.put(updated);
      await bumpStats({
        reviewed: 1,
        learned: wasNew ? 1 : 0,
        newVocab: wasNew && card.type === 'vocab' ? 1 : 0,
        newPhrase: wasNew && card.type === 'phrase' ? 1 : 0,
      });
      setDone((d) => ({ reviewed: d.reviewed + 1, learned: d.learned + (wasNew ? 1 : 0), again: d.again + (g === 0 ? 1 : 0) }));
    }
    // Quên → ôn lại trong phiên này sau vài thẻ
    if (g === 0) next.splice(Math.min(next.length, idx + 4), 0, { ...card, _relearn: true });
    setQueue(next);
    setFlipped(false);
    speechSynthesis?.cancel();
    setIdx((i) => i + 1);
  }, [card, queue, idx]);

  if (!queue) return <div className="overlay"><div className="inner" /></div>;

  const finished = idx >= queue.length;
  const reviewedCount = queue.slice(0, idx).filter((c) => !c._relearn).length;

  return (
    <div className="overlay">
      <div className="inner">
        <div className="review-top">
          <button className="icon-btn sm" onClick={onClose} aria-label="Thoát">✕</button>
          <div className="progress"><i style={{ width: `${total ? (reviewedCount / total) * 100 : 100}%` }} /></div>
          <span className="review-count">{Math.min(reviewedCount, total)}/{total}</span>
        </div>

        {finished ? (
          <div className="done">
            <div className="trophy">{queue.length ? '🏆' : '🌿'}</div>
            <h2>{queue.length ? 'Xong phiên học!' : 'Không có thẻ nào'}</h2>
            <p className="muted">
              {queue.length
                ? `Đã ôn ${done.reviewed} thẻ · ${done.learned} thẻ mới${done.again ? ` · ${done.again} lần quên` : ''}`
                : 'Hôm nay bạn đã học hết. Quay lại vào ngày mai nhé!'}
            </p>
            <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} onClick={onClose}>
              Về trang chính
            </button>
          </div>
        ) : (
          <>
            <div className="flash-wrap" onClick={() => !flipped && setFlipped(true)}>
              <div className={`flash ${flipped ? 'flipped' : ''}`}>
                <Front card={card} />
                <Back card={card} />
              </div>
            </div>

            {flipped ? (
              <div className="grade-row">
                {GRADES.map(({ g, label }) => (
                  <button key={g} id={`grade-${g}`} className={`grade g${g}`} onClick={() => grade(g)}>
                    {label}
                    {!card._relearn && <small>{g === 0 ? '<1 phút' : formatInterval(nextInterval(card, g))}</small>}
                  </button>
                ))}
              </div>
            ) : (
              <button id="flip-btn" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 16 }} onClick={() => setFlipped(true)}>
                Lật thẻ
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Kind({ card }) {
  const isNew = card.status === 0 && !card._relearn;
  return (
    <div className="kind row" style={{ gap: 6 }}>
      <span className="badge">{card.type === 'vocab' ? '🃏 Từ vựng' : '💬 Mẫu câu'}</span>
      {isNew && <span className="badge new">Mới</span>}
      {card._relearn && <span className="badge due">Ôn lại</span>}
    </div>
  );
}

function Front({ card }) {
  if (card.type === 'vocab') {
    return (
      <div className="face">
        <Kind card={card} />
        <div className="word">{card.front}</div>
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); speak(card.front); }} aria-label="Nghe">🔊</button>
        <span className="muted small">{topicLabel(card)}</span>
        <span className="tap-hint">Nhớ nghĩa rồi chạm để lật</span>
      </div>
    );
  }
  return (
    <div className="face">
      <Kind card={card} />
      <span className="muted small">{topicLabel(card)}</span>
      <div className="meaning" style={{ fontSize: 22, lineHeight: 1.4 }}>{card.meaning}</div>
      <span className="muted small">Nói to câu này bằng tiếng Anh</span>
      <span className="tap-hint">Nói xong rồi chạm để xem đáp án</span>
    </div>
  );
}

function Back({ card }) {
  if (card.type === 'vocab') {
    return (
      <div className="face back">
        <div className="row" style={{ justifyContent: 'center' }}>
          <div className="word" style={{ fontSize: 26 }}>{card.front}</div>
          <button className="icon-btn sm" onClick={(e) => { e.stopPropagation(); speak(card.front); }} aria-label="Nghe">🔊</button>
        </div>
        {card.ipa && <div className="ipa">{card.ipa}</div>}
        <div className="meaning">{card.meaning}</div>
        {card.example && (
          <div className="example">
            <button className="icon-btn sm" onClick={(e) => { e.stopPropagation(); speak(card.example); }} aria-label="Nghe câu ví dụ">🔊</button>
            <em>{card.example}</em>
          </div>
        )}
        {card.ref && <div className="ref">Tham chiếu: {card.ref}</div>}
      </div>
    );
  }
  return (
    <div className="face back">
      <span className="muted small">{card.meaning}</span>
      <div className="word phrase">{card.front}</div>
      <p className="muted small">Nghe mẫu → ghi âm lại → so sánh</p>
      <ShadowBar card={card} />
    </div>
  );
}
