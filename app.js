/* app.js - shared front-end logic for courses, course page, dashboard
   - No backend required; uses localStorage to remember enrollments & progress.
*/

/* ========== Sample course data (in real app this would come from API) ========== */
const SAMPLE_COURSES = [
  {
    id: 'js-101',
    title: 'JavaScript Essentials',
    category: 'Web Development',
    description: 'Learn fundamentals of modern JavaScript: variables, functions, DOM, events and async.',
    video: 'https://www.youtube.com/embed/PkZNo7MFNFg', // sample youtube embed
    lessons: [
      { id: 'l1', title: 'Intro & Setup', length: '6:12' },
      { id: 'l2', title: 'Variables, Types', length: '12:08' },
      { id: 'l3', title: 'DOM Manipulation', length: '16:24' },
      { id: 'l4', title: 'Fetch & Async', length: '14:10' }
    ]
  },
  {
    id: 'react-101',
    title: 'React Basics',
    category: 'Frontend',
    description: 'Component model, props, state, hooks and building a small app with React.',
    video: 'https://www.youtube.com/embed/Ke90Tje7VS0',
    lessons: [
      { id: 'r1', title: 'React Intro', length: '8:33' },
      { id: 'r2', title: 'JSX & Components', length: '13:12' },
      { id: 'r3', title: 'useState & useEffect', length: '18:00' }
    ]
  },
  {
    id: 'py-data',
    title: 'Python for Data',
    category: 'Data Science',
    description: 'Python basics and an intro to data processing with pandas and numpy.',
    video: 'https://www.youtube.com/embed/rfscVS0vtbw',
    lessons: [
      { id: 'p1', title: 'Python Basics', length: '20:00' },
      { id: 'p2', title: 'Numpy Intro', length: '12:30' },
      { id: 'p3', title: 'Pandas Basics', length: '17:45' }
    ]
  }
];

/* ========== Persistence helpers ========== */
const STORAGE_KEY = 'learnit:user_progress';

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { enrolled: {}, lessonStatus: {} };
  } catch(e) {
    console.warn('Failed to parse stored progress', e);
    return { enrolled: {}, lessonStatus: {} };
  }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ========== Rendering helpers ========== */
function getCourseById(id){
  return SAMPLE_COURSES.find(c => c.id === id);
}

/* ---------- Index / Course list ---------- */
function renderCourseList(){
  const grid = document.getElementById('coursesGrid');
  if(!grid) return;

  grid.innerHTML = '';
  const state = loadState();

  SAMPLE_COURSES.forEach(course => {
    const enrolled = !!state.enrolled[course.id];
    const completedLessons = Object.keys(state.lessonStatus).filter(k => k.startsWith(course.id + '::') && state.lessonStatus[k]).length;
    const totalLessons = course.lessons.length;
    const pct = Math.round((completedLessons/totalLessons)*100);

    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div class="kicker small">${course.category}</div>
      <h3>${course.title}</h3>
      <p>${course.description}</p>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <div style="flex:1">
          <div class="small">Progress</div>
          <div class="progress-wrap"><div class="progress" style="width:${pct}%"></div></div>
        </div>
        <div>
          <a class="btn secondary" href="course.html?id=${encodeURIComponent(course.id)}">Open</a>
          <button class="btn" data-action="enroll" data-id="${course.id}">${enrolled ? 'Enrolled' : 'Enroll'}</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach enroll listeners
  grid.querySelectorAll('button[data-action="enroll"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const s = loadState();
      s.enrolled[id] = true;
      saveState(s);
      renderCourseList(); // refresh UI
    });
  });
}

/* ---------- Course page ---------- */
function renderCoursePage(courseId){
  const course = getCourseById(courseId);
  const container = document.getElementById('courseContainer');
  if(!course || !container){ return; }

  const state = loadState();
  const enrolled = !!state.enrolled[courseId];

  document.getElementById('courseCategory').textContent = course.category;
  document.getElementById('courseTitle').textContent = course.title;
  document.getElementById('courseDesc').textContent = course.description;
  document.getElementById('enrollBtn').textContent = enrolled ? 'Enrolled' : 'Enroll';

  // video embed
  const videoWrap = document.getElementById('videoWrap');
  videoWrap.innerHTML = ''; // clear
  const iframe = document.createElement('iframe');
  iframe.src = course.video;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.position = 'absolute';
  iframe.style.left = '0';
  iframe.style.top = '0';
  iframe.setAttribute('title', course.title + ' video');
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  videoWrap.appendChild(iframe);

  // lessons list
  const lessonsList = document.getElementById('lessonsList');
  lessonsList.innerHTML = '';
  course.lessons.forEach((lesson, idx) => {
    const key = `${course.id}::${lesson.id}`;
    const done = !!state.lessonStatus[key];
    const lessonDiv = document.createElement('div');
    lessonDiv.className = 'lesson';
    lessonDiv.innerHTML = `
      <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${done ? 'linear-gradient(90deg,#10b981,#60a5fa)' : '#eef2ff'};color:${done ? 'white' : '#2563eb'};font-weight:700">${idx+1}</div>
      <div>
        <div class="title">${lesson.title}</div>
        <div class="small">${lesson.length}</div>
      </div>
      <div class="meta">
        <button class="btn secondary" data-action="mark" data-key="${key}">${done ? 'Completed' : 'Mark Completed'}</button>
      </div>
    `;
    lessonsList.appendChild(lessonDiv);
  });

  // attach enroll button
  document.getElementById('enrollBtn').onclick = () => {
    const s = loadState();
    s.enrolled[courseId] = true;
    saveState(s);
    renderCoursePage(courseId);
  };

  // attach lesson mark listeners
  lessonsList.querySelectorAll('button[data-action="mark"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const k = btn.dataset.key;
      const s = loadState();
      s.lessonStatus[k] = true;
      saveState(s);
      renderCoursePage(courseId);
      updateCourseProgressElement(courseId);
    });
  });

  updateCourseProgressElement(courseId);
}

/* update progress element on course page */
function updateCourseProgressElement(courseId){
  const course = getCourseById(courseId);
  if(!course) return;
  const s = loadState();
  const completed = course.lessons.filter(l => !!s.lessonStatus[`${courseId}::${l.id}`]).length;
  const pct = Math.round((completed / course.lessons.length) * 100);
  const progressEl = document.getElementById('courseProgress');
  if(progressEl) progressEl.style.width = pct + '%';
}

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const area = document.getElementById('enrolledList');
  if(!area) return;
  area.innerHTML = '';
  const s = loadState();
  const enrolledIds = Object.keys(s.enrolled || {});
  if(enrolledIds.length === 0){
    area.innerHTML = `<div class="card center"><p class="small">You haven't enrolled in any course yet. Browse <a href="index.html">courses</a>.</p></div>`;
    document.getElementById('summaryText').textContent = 'No enrolled courses';
    return;
  }

  let totalLessons = 0, totalCompleted = 0;
  enrolledIds.forEach(id => {
    const course = getCourseById(id);
    if(!course) return;
    const completed = course.lessons.filter(l => !!s.lessonStatus[`${id}::${l.id}`]).length;
    const pct = Math.round((completed / course.lessons.length) * 100);
    totalLessons += course.lessons.length;
    totalCompleted += completed;

    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:10px;height:60px;border-radius:6px;background:linear-gradient(180deg,#60a5fa,#2563eb)"></div>
        <div style="flex:1">
          <h3 style="margin:0">${course.title}</h3>
          <div class="small">${completed} of ${course.lessons.length} lessons completed</div>
          <div style="margin-top:8px" class="progress-wrap"><div class="progress" style="width:${pct}%"></div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <a class="btn" href="course.html?id=${encodeURIComponent(id)}">Open</a>
        </div>
      </div>
    `;
    area.appendChild(card);
  });

  const summaryText = `${totalCompleted} of ${totalLessons} lessons completed overall (${Math.round((totalCompleted/totalLessons)*100)}%)`;
  document.getElementById('summaryText').textContent = summaryText;
}

/* ========== Expose for pages to use (so the inline scripts can call these) ========== */
window.renderCourseList = renderCourseList;
window.renderCoursePage = renderCoursePage;
window.renderDashboard = renderDashboard;
