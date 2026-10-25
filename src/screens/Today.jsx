import { calcStreak, db, endOfToday, getSettings, todayKey, useLive } from '../db';
import { speak } from '../speech';

const TIPS = [
  { t: 'Học theo cụm', d: 'Nhớ cả cụm "flash the ECU" thay vì từng từ "flash".' },
  { t: 'Nói to khi ôn', d: 'Với mẫu câu, hãy nói thành tiếng trước khi lật thẻ, đừng chỉ nghĩ trong đầu.' },
  { t: 'Self-talk 1 phút', d: 'Tự nói "Today I tested..." về công việc hôm nay, không cần hoàn hảo.' },
  { t: 'Sentence mining', d: 'Gặp câu hay trong Jira hay email thì thêm ngay vào app (tab Từ vựng → +).' },
  { t: 'Shadowing', d: 'Nghe mẫu, ghi âm, nghe lại. Chú ý nhấn âm và nối âm hơn là từng chữ.' },
  { t: 'Đều đặn > nhiều', d: '15 phút mỗi ngày hiệu quả hơn 2 tiếng vào cuối tuần.' },
  { t: 'Chấm điểm thật lòng', d: 'Quên thì bấm "Quên". App sẽ cho bạn ôn lại sớm hơn.' },
];

export default function Today({ onStart, onSettings }) {
  const data = useLive(async () => {
    const end = endOfToday();
    const [due, fresh, learnedV, learnedP, totalV, totalP, stats] = await Promise.all([
      db.cards.where('due').between(1, end, true, true).filter((c) => c.status === 1).count(),
      db.cards.where('status').equals(0).toArray(),
      db.cards.where('status').equals(1).filter((c) => c.type === 'vocab').count(),
      db.cards.where('status').equals(1).filter((c) => c.type === 'phrase').count(),
      db.cards.where('type').equals('vocab').count(),
      db.cards.where('type').equals('phrase').count(),
      db.stats.toArray(),
    ]);
    const s = getSettings();
    const today = stats.find((x) => x.date === todayKey()) || {};
    const freshV = fresh.filter((c) => c.type === 'vocab').length;
    const freshP = fresh.length - freshV;
    const newV = Math.min(freshV, Math.max(0, s.newVocab - (today.newVocab || 0)));
    const newP = Math.min(freshP, Math.max(0, s.newPhrase - (today.newPhrase || 0)));
    return {
      due, newV, newP, freshLeft: fresh.length,
      learnedV, learnedP, totalV, totalP,
      streak: calcStreak(stats),
      reviewedToday: today.reviewed || 0,
    };
  }, [], null);

  if (!data) return <div className="screen" />;

  const todo = data.due + data.newV + data.newP;
  const hour = new Date().getHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="subtitle">{hello} 👋</p>
          <h1>Daily English</h1>
        </div>
        <button id="open-settings" className="icon-btn" onClick={onSettings} aria-label="Cài đặt">⚙️</button>
      </header>

      <section className="hero">
        <div className="row">
          <span className="streak-flame">🔥</span>
          <div className="grow">
            <div style={{ fontSize: 22, fontWeight: 800 }}>{data.streak} ngày liên tiếp</div>
            <div className="muted small">
              {data.reviewedToday ? `Hôm nay đã ôn ${data.reviewedToday} thẻ` : 'Hôm nay bạn chưa học'}
            </div>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat"><b style={{ color: 'var(--amber)' }}>{data.due}</b><span>Cần ôn</span></div>
          <div className="stat"><b style={{ color: '#b9a8ff' }}>{data.newV}</b><span>Từ mới</span></div>
          <div className="stat"><b style={{ color: 'var(--cyan)' }}>{data.newP}</b><span>Câu mới</span></div>
        </div>

        {todo > 0 ? (
          <button id="start-session" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} onClick={() => onStart('daily')}>
            Bắt đầu học · {todo} thẻ
          </button>
        ) : (
          <>
            <p style={{ marginTop: 18, fontWeight: 700 }}>🎉 Xong bài hôm nay rồi!</p>
            {data.freshLeft > 0 && (
              <button id="extra-session" className="btn btn-block" style={{ marginTop: 10 }} onClick={() => onStart('extra')}>
                Học thêm thẻ mới
              </button>
            )}
          </>
        )}
      </section>

      <h2 className="section-title">Tiến độ</h2>
      <div className="topic-grid">
        <ProgressTile emoji="🃏" name="Từ vựng" done={data.learnedV} total={data.totalV} />
        <ProgressTile emoji="💬" name="Mẫu câu" done={data.learnedP} total={data.totalP} />
      </div>

      <h2 className="section-title">Mẹo hôm nay</h2>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>💡 {tip.t}</div>
        <div className="muted small" style={{ lineHeight: 1.5 }}>{tip.d}</div>
      </div>

      <h2 className="section-title">Tự nói 1 phút</h2>
      <div className="card">
        <p className="muted small" style={{ lineHeight: 1.5, marginBottom: 10 }}>
          Gợi ý: nói về công việc hôm nay bằng các câu mở đầu dưới đây. Chạm vào để nghe.
        </p>
        <div className="list">
          {['Today I worked on...', 'The main problem was...', 'Tomorrow I am going to...'].map((s) => (
            <button key={s} className="list-item" onClick={() => speak(s)}>
              <span>🔊</span><span className="grow title" style={{ fontWeight: 600 }}>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function ProgressTile({ emoji, name, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="topic" style={{ minHeight: 100 }}>
      <div className="row"><span className="emoji">{emoji}</span><span className="grow" /><span className="badge ok">{pct}%</span></div>
      <div>
        <div className="name">{name}</div>
        <div className="muted small">{done}/{total} đã học</div>
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
