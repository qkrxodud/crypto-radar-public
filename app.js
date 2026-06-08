// data/snapshot.json을 읽어 대시보드를 렌더링한다.
// 서버 없이 순수 정적 파일로 동작한다.

const DATA_URL = './data/snapshot.json';

// 점수 → 색상 클래스/텍스트 매핑
function scoreClass(score) {
  if (score >= 70) return { cls: 'green', text: '강한 매집', desc: '다수 지표가 매수 구간을 가리킵니다. 분할 매수 관점에서 긍정적 신호입니다.' };
  if (score >= 55) return { cls: 'blue',  text: '완만한 매집', desc: '매수 신호가 우세하나 확신이 강하지 않습니다. 소액 분할 접근을 고려하세요.' };
  if (score >= 40) return { cls: 'orange', text: '관망', desc: '매수·매도 신호가 혼재합니다. 명확한 방향이 나올 때까지 관망을 권장합니다.' };
  return { cls: 'red', text: '약세 / 청산 주의', desc: '다수 지표가 부정적입니다. 신규 진입보다 리스크 관리에 집중하세요.' };
}

function fmtNum(v, digits = 2) {
  if (v == null) return '--';
  return parseFloat(v).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function fgLabel(v) {
  if (v == null) return '';
  if (v <= 20) return '극도 공포';
  if (v <= 40) return '공포';
  if (v <= 60) return '중립';
  if (v <= 80) return '탐욕';
  return '극도 탐욕';
}

function rsiLabel(v) {
  if (v == null) return '';
  const n = parseFloat(v);
  if (n <= 30) return '과매도';
  if (n >= 70) return '과매수';
  return '중립';
}

function renderKpi(id, value, digits) {
  const el = document.getElementById(id);
  if (el) el.textContent = fmtNum(value, digits);
}

async function init() {
  let data;
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    data = await res.json();
  } catch (e) {
    document.getElementById('updated-at').textContent = '데이터 로드 실패';
    return;
  }

  if (!data.hasData) {
    document.getElementById('signal-text').textContent = '데이터 없음';
    return;
  }

  // 갱신 시각
  const upd = new Date(data.updatedAt);
  document.getElementById('updated-at').textContent =
    '최종 갱신: ' + upd.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' KST';

  // 점수 히어로
  const latest = data.latest;
  const score = latest?.score ?? 0;
  const { cls, text, desc } = scoreClass(score);

  document.getElementById('hero-score').textContent = score;
  const ring = document.getElementById('score-ring');
  ring.classList.add('c-' + cls);

  const badge = document.getElementById('signal-badge');
  badge.textContent = text;
  badge.classList.add('badge-' + cls);

  document.getElementById('signal-text').textContent =
    `종합 점수 ${score}점 — ${text}`;
  document.getElementById('signal-desc').textContent = desc;

  // KPI
  if (latest) {
    renderKpi('kpi-btc', latest.btcClose, 0);
    renderKpi('kpi-fg', latest.fearGreed, 0);
    document.getElementById('kpi-fg-hint').textContent = fgLabel(latest.fearGreed);
    renderKpi('kpi-rsi', latest.rsiDaily, 1);
    document.getElementById('kpi-rsi-hint').textContent = rsiLabel(latest.rsiDaily);
    renderKpi('kpi-mvrv', latest.mvrvZScore, 2);
    renderKpi('kpi-nupl', latest.nupl, 3);
    const domEl = document.getElementById('kpi-dom');
    if (domEl) domEl.textContent = latest.btcDominance != null ? latest.btcDominance + '%' : '--';
    const fundEl = document.getElementById('kpi-fund');
    if (fundEl) fundEl.textContent = latest.fundingRate != null
      ? (parseFloat(latest.fundingRate) * 100).toFixed(4) + '%' : '--';
    renderKpi('kpi-sopr', latest.sopr, 3);
  }

  // 점수 차트
  const scoreLabels = data.scoreHistory.map(d => d.date.slice(5));
  const scoreValues = data.scoreHistory.map(d => d.score);
  const scoreColors = scoreValues.map(s => {
    if (s >= 70) return '#3fb950';
    if (s >= 55) return '#58a6ff';
    if (s >= 40) return '#e3b341';
    return '#f85149';
  });

  new Chart(document.getElementById('score-chart'), {
    type: 'bar',
    data: {
      labels: scoreLabels,
      datasets: [{
        label: '종합 점수',
        data: scoreValues,
        backgroundColor: scoreColors,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b949e', maxTicksLimit: 10 }, grid: { color: '#21262d' } },
        y: { min: 0, max: 100, ticks: { color: '#8b949e' }, grid: { color: '#21262d' } }
      }
    }
  });

  // BTC 가격 차트
  const btcLabels = data.indicatorHistory.map(d => d.date.slice(5));
  const btcValues = data.indicatorHistory.map(d => d.btcClose != null ? parseFloat(d.btcClose) : null);

  new Chart(document.getElementById('btc-chart'), {
    type: 'line',
    data: {
      labels: btcLabels,
      datasets: [{
        label: 'BTC (USD)',
        data: btcValues,
        borderColor: '#f7931a',
        backgroundColor: 'rgba(247,147,26,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b949e', maxTicksLimit: 10 }, grid: { color: '#21262d' } },
        y: { ticks: { color: '#8b949e', callback: v => '$' + v.toLocaleString() }, grid: { color: '#21262d' } }
      }
    }
  });

  // 지표 테이블 (역순 = 최신 먼저)
  const tbody = document.getElementById('indicator-table');
  const rows = [...data.indicatorHistory].reverse().slice(0, 14);
  tbody.innerHTML = rows.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>${row.readinessScore ?? '--'}</td>
      <td>${row.btcClose != null ? '$' + fmtNum(row.btcClose, 0) : '--'}</td>
      <td>${row.fearGreed ?? '--'}</td>
      <td>${row.rsiDaily != null ? fmtNum(row.rsiDaily, 1) : '--'}</td>
      <td>${row.mvrvZScore != null ? fmtNum(row.mvrvZScore, 2) : '--'}</td>
      <td>${row.fundingRate != null ? (parseFloat(row.fundingRate)*100).toFixed(4)+'%' : '--'}</td>
    </tr>
  `).join('');
}

init();