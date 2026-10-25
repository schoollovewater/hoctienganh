import { useState } from 'react';
import { db, newCardFields } from '../db';
import { speak } from '../speech';
import { Sheet, toast } from '../components/ui';
import { VOCAB_TOPICS } from '../data/seedVocab';
import { PHRASE_TOPICS } from '../data/seedPhrases';

// card: thẻ có id (sửa) hoặc { type, topic } (thêm mới)
export default function CardEditor({ card, onClose }) {
  const isNew = card.id == null;
  const [f, setF] = useState({
    type: card.type || 'vocab',
    front: card.front || '',
    ipa: card.ipa || '',
    meaning: card.meaning || '',
    example: card.example || '',
    topic: card.topic || (card.type === 'phrase' ? 'standup' : 'work'),
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const isVocab = f.type === 'vocab';
  const topics = isVocab
    ? Object.entries(VOCAB_TOPICS)
    : Object.entries(PHRASE_TOPICS).map(([k, v]) => [k, `${v.icon} ${v.label}`]);

  const switchType = (type) =>
    setF((s) => ({ ...s, type, topic: type === 'vocab' ? 'work' : 'standup' }));

  const save = async () => {
    const data = {
      ...f,
      front: f.front.trim(),
      meaning: f.meaning.trim(),
      ipa: isVocab ? f.ipa.trim() : '',
      example: isVocab ? f.example.trim() : '',
    };
    if (!data.front || !data.meaning) return toast('Cần nhập tiếng Anh và nghĩa');
    if (isNew) {
      await db.cards.add({ ...data, ...newCardFields(), source: 'work', verified: true, ref: '' });
      toast('Đã thêm thẻ mới ✓');
    } else {
      await db.cards.update(card.id, { ...data, verified: true });
      toast('Đã lưu ✓');
    }
    onClose();
  };

  const remove = async () => {
    if (!confirm(`Xoá thẻ "${card.front}"?`)) return;
    await db.cards.delete(card.id);
    await db.recordings.delete(card.id);
    toast('Đã xoá thẻ');
    onClose();
  };

  const resetProgress = async () => {
    await db.cards.update(card.id, newCardFields());
    toast('Thẻ đã về trạng thái mới');
    onClose();
  };

  return (
    <Sheet title={isNew ? 'Thêm thẻ' : 'Sửa thẻ'} onClose={onClose}>
      {isNew && (
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={isVocab ? 'active' : ''} onClick={() => switchType('vocab')}>🃏 Từ vựng</button>
          <button className={!isVocab ? 'active' : ''} onClick={() => switchType('phrase')}>💬 Mẫu câu</button>
        </div>
      )}

      <div className="field">
        <label htmlFor="f-front">{isVocab ? 'Từ / cụm từ tiếng Anh *' : 'Câu tiếng Anh *'}</label>
        <div className="row">
          {isVocab ? (
            <input id="f-front" className="input grow" value={f.front} onChange={set('front')} autoCapitalize="off" placeholder="vd: flash the ECU" />
          ) : (
            <textarea id="f-front" className="grow" value={f.front} onChange={set('front')} placeholder="vd: I'm blocked by the test bench." />
          )}
          <button className="icon-btn" onClick={() => speak(f.front)} aria-label="Nghe thử">🔊</button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-meaning">Nghĩa tiếng Việt *</label>
        <input id="f-meaning" className="input" value={f.meaning} onChange={set('meaning')} />
      </div>

      {isVocab && (
        <>
          <div className="field">
            <label htmlFor="f-ipa">Phiên âm (tuỳ chọn)</label>
            <input id="f-ipa" className="input" value={f.ipa} onChange={set('ipa')} placeholder="/flæʃ/" autoCapitalize="off" />
          </div>
          <div className="field">
            <label htmlFor="f-example">Câu ví dụ (nên có, lấy từ công việc thật)</label>
            <textarea id="f-example" value={f.example} onChange={set('example')} />
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="f-topic">Nhóm</label>
        <select id="f-topic" value={f.topic} onChange={set('topic')}>
          {topics.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      <button id="save-card" className="btn btn-primary btn-lg btn-block" onClick={save}>Lưu</button>

      {!isNew && (
        <div className="row" style={{ marginTop: 10 }}>
          {card.status === 1 && <button className="btn grow" onClick={resetProgress}>Học lại từ đầu</button>}
          <button className="btn btn-danger grow" onClick={remove}>Xoá thẻ</button>
        </div>
      )}
      {!isNew && card.source === 'seed' && !card.verified && (
        <p className="muted small" style={{ marginTop: 12, lineHeight: 1.5 }}>
          ℹ️ Thẻ có sẵn do AI soạn{card.ref ? ` (tham chiếu: ${card.ref})` : ''}. Nếu chưa đúng với cách dùng ở công ty bạn, hãy sửa lại.
        </p>
      )}
    </Sheet>
  );
}
