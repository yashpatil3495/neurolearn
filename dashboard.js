// dashboard.js — Reads localStorage emotion log and renders stats, chart, timeline

const STORAGE_KEY = 'neurolearn_emotion_log';

// Emoji + color metadata for each emotion state
const EMOTION_META = {
  focused:    { emoji: '😊', color: '#4CAF50', label: 'Focused' },
  confused:   { emoji: '😵', color: '#FF9800', label: 'Confused' },
  bored:      { emoji: '😴', color: '#2196F3', label: 'Bored' },
  frustrated: { emoji: '😤', color: '#F44336', label: 'Frustrated' }
};

// Reads and parses the emotion log array from localStorage
function getLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

// Formats an ISO timestamp string into a short readable time (HH:MM:SS)
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Calculates duration string between the first and last log event
function calcDuration(log) {
  if (log.length < 2) return '< 1 min';
  const ms = new Date(log[log.length - 1].timestamp) - new Date(log[0].timestamp);
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Counts occurrences of each emotion in the log and returns a frequency map
function countEmotions(log) {
  return log.reduce((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1;
    return acc;
  }, {});
}

// Finds the emotion with the highest count from the frequency map
function topEmotion(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// Populates the three summary stat cards at the top of the dashboard
function renderStats(log) {
  const counts = countEmotions(log);
  const best   = topEmotion(counts);
  const meta   = best ? EMOTION_META[best] : null;

  document.getElementById('stat-total').textContent        = log.length || '0';
  document.getElementById('stat-duration').textContent     = log.length ? calcDuration(log) : '—';
  document.getElementById('stat-top-emotion').textContent  = meta ? `${meta.emoji} ${meta.label}` : '—';
}

// Draws the emotion frequency bar chart using Chart.js
function renderChart(counts) {
  const labels = Object.keys(EMOTION_META);
  const values = labels.map(k => counts[k] || 0);
  const colors = labels.map(k => EMOTION_META[k].color);

  const ctx = document.getElementById('emotion-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(k => `${EMOTION_META[k].emoji} ${EMOTION_META[k].label}`),
      datasets: [{
        label: 'Detections',
        data: values,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: '#eee' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// Renders each emotion event as a row in the scrollable timeline list
function renderTimeline(log) {
  const list = document.getElementById('timeline-list');

  if (!log.length) {
    list.innerHTML = '<li class="empty-state">No session data yet. Open the Student page to start learning.</li>';
    return;
  }

  // Show most recent events first
  const reversed = [...log].reverse();
  list.innerHTML = reversed.map(ev => {
    const meta = EMOTION_META[ev.emotion] || { emoji: '❓', label: ev.emotion };
    return `
      <li class="timeline-item">
        <span class="timeline-time">${formatTime(ev.timestamp)}</span>
        <span class="timeline-emoji">${meta.emoji}</span>
        <span class="timeline-emotion">${meta.label}</span>
        <span class="timeline-topic">${ev.topic}</span>
      </li>`;
  }).join('');
}

// Clears all session data from localStorage and reloads the dashboard
function clearSession() {
  if (confirm('Clear all session data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}

// Main dashboard init — loads data and renders all sections
function init() {
  const log    = getLog();
  const counts = countEmotions(log);

  renderStats(log);
  renderChart(counts);
  renderTimeline(log);

  document.getElementById('clear-btn').addEventListener('click', clearSession);
}

document.addEventListener('DOMContentLoaded', init);
