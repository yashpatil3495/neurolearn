// app.js — Webcam setup, emotion detection, lesson loading, Claude API integration

// ── Constants ──
const LESSONS = ['lessons/math.json', 'lessons/science.json'];
const DETECT_INTERVAL_MS = 3000;
const STORAGE_KEY = 'neurolearn_emotion_log';

// ── State ──
let currentLessonIndex = 0;
let currentLesson = null;   // { topic, title, content }
let isAdapting = false;     // Prevents overlapping API calls

// ── DOM refs ──
const videoEl       = document.getElementById('webcam');
const topicBadge    = document.getElementById('topic-badge');
const lessonTitle   = document.getElementById('lesson-title');
const contentText   = document.getElementById('content-text');
const lessonContent = document.getElementById('lesson-content');
const emotionBadge  = document.getElementById('emotion-badge');
const statusBar     = document.getElementById('status-bar');
const nextBtn       = document.getElementById('next-btn');

// ── Emoji map for the 4 emotion states ──
const EMOTION_META = {
  focused:    { emoji: '😊', label: 'Focused',    cls: 'badge-focused' },
  confused:   { emoji: '😵', label: 'Confused',   cls: 'badge-confused' },
  bored:      { emoji: '😴', label: 'Bored',       cls: 'badge-bored' },
  frustrated: { emoji: '😤', label: 'Frustrated', cls: 'badge-frustrated' }
};

// Maps face-api.js raw expression keys to our 4 states
function mapExpression(expressions) {
  const top = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0][0];
  if (['happy', 'surprised'].includes(top))             return 'focused';
  if (['sad', 'fearful'].includes(top))                 return 'confused';
  if (['angry', 'disgusted'].includes(top))             return 'frustrated';
  return 'bored'; // neutral + everything else
}

// Fetches a lesson JSON file and sets it as the current lesson
async function loadLesson(index) {
  const res  = await fetch(LESSONS[index]);
  const data = await res.json();
  currentLesson = data;
  topicBadge.textContent  = data.topic;
  lessonTitle.textContent = data.title;
  setContentText(data.content);
}

// Smoothly swaps in new lesson text with a fade transition
function setContentText(text) {
  lessonContent.classList.add('fading');
  setTimeout(() => {
    contentText.textContent = text;
    lessonContent.classList.remove('fading');
  }, 400);
}

// Updates the emotion badge UI element with the correct color class
function updateEmotionBadge(emotion) {
  const meta = EMOTION_META[emotion] || { emoji: '😐', label: 'Detecting…', cls: 'badge-neutral' };
  emotionBadge.textContent = `${meta.emoji} ${meta.label}`;
  emotionBadge.className   = `badge badge-emotion ${meta.cls}`;
}

// Persists a single emotion event to localStorage for the dashboard
function logEmotionEvent(emotion, topic) {
  const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  log.push({ timestamp: new Date().toISOString(), emotion, topic });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

// Shows or hides the "Adapting content…" status bar
function setStatus(visible) {
  statusBar.classList.toggle('hidden', !visible);
}

// Calls the backend /api/adapt endpoint and updates lesson content
async function adaptContent(emotion) {
  if (isAdapting || !currentLesson) return;
  isAdapting = true;
  setStatus(true);

  const body = {
    emotion,
    topic:       currentLesson.topic,
    currentText: contentText.textContent
  };

  try {
    const res  = await fetch('/api/adapt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (data.adaptedText) setContentText(data.adaptedText);
  } catch (err) {
    // Silently fall back — original text stays on screen
    console.error('Adaptation fetch error:', err);
  } finally {
    isAdapting = false;
    setStatus(false);
  }
}

// Starts the browser webcam stream and attaches it to the video element
async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  videoEl.srcObject = stream;
  await new Promise(resolve => { videoEl.onloadedmetadata = resolve; });
}

// Loads both face-api.js models from the public CDN weights path
async function loadFaceModels() {
  const CDN = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
  await faceapi.nets.tinyFaceDetector.loadFromUri(CDN);
  await faceapi.nets.faceExpressionNet.loadFromUri(CDN);
}

// Runs one emotion detection frame and triggers adaptation if a face is found
async function detectEmotion() {
  const result = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!result) return; // No face detected this frame — skip silently

  const emotion = mapExpression(result.expressions);
  updateEmotionBadge(emotion);
  logEmotionEvent(emotion, currentLesson?.topic || 'Unknown');
  await adaptContent(emotion);
}

// Wires up the "Next Lesson" button to cycle through the lessons array
function bindNextButton() {
  nextBtn.addEventListener('click', async () => {
    currentLessonIndex = (currentLessonIndex + 1) % LESSONS.length;
    await loadLesson(currentLessonIndex);
  });
}

// Main entry point — initialises everything in the correct order
async function init() {
  bindNextButton();

  // Wait for face-api.js CDN script to finish loading
  await new Promise(resolve => {
    if (typeof faceapi !== 'undefined') { resolve(); return; }
    document.querySelector('script[src*="face-api"]').addEventListener('load', resolve);
  });

  await loadFaceModels();
  await startWebcam();
  await loadLesson(currentLessonIndex);

  // Run emotion detection on a fixed interval
  setInterval(detectEmotion, DETECT_INTERVAL_MS);
}

// Kick off once the DOM is fully ready
document.addEventListener('DOMContentLoaded', init);
