// SM-2 rút gọn. grade: 0 = Quên, 1 = Khó, 2 = Nhớ, 3 = Dễ
const DAY = 24 * 60 * 60 * 1000;

function startOfDay(t = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function nextInterval(card, grade) {
  const { interval = 0, ease = 2.5, reps = 0 } = card;
  switch (grade) {
    case 0: return 1;
    case 1: return reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    case 2: return reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease));
    case 3: return reps === 0 ? 3 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
    default: return 1;
  }
}

export function schedule(card, grade, now = Date.now()) {
  let { ease = 2.5, reps = 0, lapses = 0 } = card;
  const interval = nextInterval(card, grade);
  if (grade === 0) { ease -= 0.2; lapses += 1; reps = 0; }
  else if (grade === 1) { ease -= 0.15; reps += 1; }
  else if (grade === 2) { reps += 1; }
  else { ease += 0.15; reps += 1; }
  ease = Math.min(3.0, Math.max(1.3, ease));
  return {
    ...card,
    status: 1,
    interval,
    ease: Math.round(ease * 100) / 100,
    reps,
    lapses,
    due: startOfDay(now) + interval * DAY,
    lastReview: now,
  };
}

export function formatInterval(days) {
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}

export function dueLabel(card) {
  if (card.status === 0) return 'Mới';
  const days = Math.round((startOfDay(card.due) - startOfDay()) / DAY);
  if (days <= 0) return 'Đến hạn';
  if (days === 1) return 'Ngày mai';
  return `${formatInterval(days)} nữa`;
}
