import Dexie, { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { seedVocab } from './data/seedVocab';
import { seedPhrases } from './data/seedPhrases';

export const db = new Dexie('daily-english');

// status: 0 = mới (chưa học), 1 = đã vào lịch ôn
db.version(1).stores({
  cards: '++id, type, topic, status, due, source, createdAt',
  recordings: 'cardId',
  stats: 'date',
  meta: 'key',
});

export function newCardFields() {
  return { status: 0, due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, createdAt: Date.now() };
}

// Xen kẽ các chủ đề để thẻ mới mỗi ngày không bị dồn 1 nhóm
function interleave(list) {
  const groups = {};
  list.forEach((c) => (groups[c.topic] ||= []).push(c));
  const buckets = Object.values(groups);
  const out = [];
  for (let i = 0; out.length < list.length; i++) {
    buckets.forEach((b) => b[i] && out.push(b[i]));
  }
  return out;
}

let seedPromise = null;
export function ensureSeed() {
  return (seedPromise ||= seed());
}

async function seed() {
  if (await db.meta.get('seeded')) return;
  const base = newCardFields();
  const cards = [...interleave(seedVocab), ...interleave(seedPhrases)].map((c, i) => ({
    ...c, ...base, createdAt: base.createdAt + i, source: 'seed', verified: false,
  }));
  await db.transaction('rw', db.cards, db.meta, async () => {
    await db.cards.bulkAdd(cards);
    await db.meta.put({ key: 'seeded', value: true });
  });
}

// ---- Ngày & thống kê ----
export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export async function bumpStats(patch) {
  const date = todayKey();
  const cur = (await db.stats.get(date)) || { date, reviewed: 0, learned: 0, newVocab: 0, newPhrase: 0 };
  Object.entries(patch).forEach(([k, v]) => (cur[k] = (cur[k] || 0) + v));
  await db.stats.put(cur);
}

export function calcStreak(stats) {
  const active = new Set(stats.filter((s) => s.reviewed > 0).map((s) => s.date));
  const d = new Date();
  if (!active.has(todayKey(d))) d.setDate(d.getDate() - 1); // hôm nay chưa học vẫn giữ streak
  let streak = 0;
  while (active.has(todayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ---- Cài đặt (localStorage) ----
const DEFAULT_SETTINGS = { newVocab: 5, newPhrase: 3, voiceURI: '', rate: 0.9, autoPlay: true };

export function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('settings') || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  localStorage.setItem('settings', JSON.stringify(s));
}

// ---- Sao lưu ----
export async function exportData() {
  const [cards, stats] = await Promise.all([db.cards.toArray(), db.stats.toArray()]);
  return { app: 'daily-english', version: 1, exportedAt: new Date().toISOString(), settings: getSettings(), cards, stats };
}

export async function importData(data) {
  if (data?.app !== 'daily-english' || !Array.isArray(data.cards)) throw new Error('File không hợp lệ');
  await db.transaction('rw', db.cards, db.stats, db.meta, db.recordings, async () => {
    await Promise.all([db.cards.clear(), db.stats.clear(), db.recordings.clear()]);
    await db.cards.bulkAdd(data.cards);
    await db.stats.bulkAdd(data.stats || []);
    await db.meta.put({ key: 'seeded', value: true });
  });
  if (data.settings) saveSettings(data.settings);
}

export async function resetAll() {
  await db.delete();
  localStorage.removeItem('settings');
  location.reload();
}

// ---- Hook truy vấn tự cập nhật ----
export function useLive(query, deps = [], initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: console.error });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
