import { useCallback, useEffect, useRef, useState } from 'react';
import { db, getSettings } from './db';

// ---------- Phát âm (Text-to-Speech) ----------
export function getEnglishVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
}

function pickVoice() {
  const voices = getEnglishVoices();
  const { voiceURI } = getSettings();
  return (
    voices.find((v) => v.voiceURI === voiceURI) ||
    voices.find((v) => /en-US/i.test(v.lang) && /Samantha|Google|Natural|Premium|Enhanced/i.test(v.name)) ||
    voices.find((v) => /en-US/i.test(v.lang)) ||
    voices[0]
  );
}

export function speak(text, { rate } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
  u.rate = rate ?? getSettings().rate;
  speechSynthesis.speak(u);
}

export function useVoices() {
  const [voices, setVoices] = useState(getEnglishVoices());
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => setVoices(getEnglishVoices());
    speechSynthesis.addEventListener('voiceschanged', update);
    update();
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

// ---------- Ghi âm (MediaRecorder) ----------
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

export const canRecord = () => !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

// Hook ghi âm gắn với 1 thẻ: lưu bản ghi mới nhất vào IndexedDB
export function useRecorder(cardId) {
  const [state, setState] = useState('idle'); // idle | recording | error
  const [url, setUrl] = useState(null);
  const recRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let objectUrl = null;
    let alive = true;
    setUrl(null);
    if (cardId == null) return;
    db.recordings.get(cardId).then((r) => {
      if (alive && r?.blob) {
        objectUrl = URL.createObjectURL(r.blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      recRef.current?.state === 'recording' && recRef.current.stop();
    };
  }, [cardId]);

  const start = useCallback(async () => {
    try {
      speechSynthesis?.cancel();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' });
        await db.recordings.put({ cardId, blob, createdAt: Date.now() });
        setUrl((old) => { old && URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        setState('idle');
      };
      recRef.current = rec;
      rec.start();
      setState('recording');
    } catch (e) {
      console.error(e);
      setState('error');
    }
  }, [cardId]);

  const stop = useCallback(() => {
    if (recRef.current?.state === 'recording') recRef.current.stop();
  }, []);

  const play = useCallback(() => {
    if (!url) return;
    speechSynthesis?.cancel();
    audioRef.current?.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play();
  }, [url]);

  return { state, url, start, stop, play };
}
