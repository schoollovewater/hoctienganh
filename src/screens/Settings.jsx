import { useRef, useState } from 'react';
import { exportData, getSettings, importData, resetAll, saveSettings, todayKey } from '../db';
import { speak, useVoices } from '../speech';
import { Sheet, toast } from '../components/ui';

function Stepper({ id, value, onChange, min = 0, max = 30 }) {
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="icon-btn sm" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Giảm">−</button>
      <b id={id} style={{ minWidth: 28, textAlign: 'center' }}>{value}</b>
      <button className="icon-btn sm" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Tăng">+</button>
    </div>
  );
}

export default function Settings({ onClose }) {
  const [s, setS] = useState(getSettings());
  const voices = useVoices();
  const fileRef = useRef(null);

  const update = (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  };

  const doExport = async () => {
    const data = await exportData();
    const name = `daily-english-${todayKey()}.json`;
    const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sao lưu Daily English' }); return; } catch { /* người dùng huỷ */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm(`Khôi phục ${data.cards?.length ?? 0} thẻ? Dữ liệu hiện tại sẽ bị thay thế.`)) return;
      await importData(data);
      setS(getSettings());
      toast('Đã khôi phục dữ liệu ✓');
    } catch (err) {
      toast(err.message || 'Không đọc được file');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Sheet title="Cài đặt" onClose={onClose}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Mỗi ngày</h3>
      <div className="card list" style={{ gap: 14 }}>
        <div className="row"><span className="grow">Từ vựng mới</span><Stepper id="set-new-vocab" value={s.newVocab} onChange={(v) => update({ newVocab: v })} /></div>
        <div className="row"><span className="grow">Mẫu câu mới</span><Stepper id="set-new-phrase" value={s.newPhrase} onChange={(v) => update({ newPhrase: v })} /></div>
      </div>

      <h3 className="section-title">Phát âm</h3>
      <div className="card">
        <div className="field">
          <label htmlFor="set-voice">Giọng đọc</label>
          <select id="set-voice" value={s.voiceURI} onChange={(e) => update({ voiceURI: e.target.value })}>
            <option value="">Tự động (en-US)</option>
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="set-rate">Tốc độ: {s.rate.toFixed(2)}×</label>
          <input id="set-rate" type="range" min="0.6" max="1.2" step="0.05" value={s.rate} onChange={(e) => update({ rate: Number(e.target.value) })} />
        </div>
        <div className="row">
          <label className="grow row" htmlFor="set-autoplay" style={{ gap: 8 }}>
            <input id="set-autoplay" type="checkbox" checked={s.autoPlay} onChange={(e) => update({ autoPlay: e.target.checked })} />
            Tự đọc khi ôn thẻ
          </label>
          <button className="btn" style={{ height: 40 }} onClick={() => speak('Could you clarify the expected result?')}>🔊 Thử</button>
        </div>
        <p className="muted small" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Mẹo iPhone: vào Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh, tải giọng "Nâng cao" để nghe tự nhiên hơn.
        </p>
      </div>

      <h3 className="section-title">Dữ liệu</h3>
      <div className="card list">
        <button id="export-data" className="btn btn-block" onClick={doExport}>⬇️ Sao lưu ra file</button>
        <button id="import-data" className="btn btn-block" onClick={() => fileRef.current?.click()}>⬆️ Khôi phục từ file</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
        <button
          className="btn btn-block btn-danger"
          onClick={() => confirm('Xoá toàn bộ dữ liệu và tiến độ? Không thể hoàn tác.') && resetAll()}
        >Xoá toàn bộ dữ liệu</button>
      </div>

      <p className="muted small" style={{ marginTop: 16, lineHeight: 1.6 }}>
        📱 Trên iPhone: mở bằng Safari → nút Chia sẻ → <b>Thêm vào MH chính</b> để dùng như app và tránh bị iOS xoá dữ liệu. Nên sao lưu mỗi tuần.
      </p>
    </Sheet>
  );
}
