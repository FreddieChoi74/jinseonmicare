/**
 * 진선미 재가장기요양기관 인터랙티브 프론트엔드 엔진
 */

// 1. 상태 관리
const AppState = {
  currentView: 'home',
  calculator: {
    grade: '3',
    monthlyLimit: 1453100, // 3등급 기본
    copayRate: 0.15, // 일반 15%
  },
  quiz: {
    q1: null,
    q2: null,
    q3: null,
    q4: null
  }
};

// 장기요양 등급별 월 한도액 기준 (모의 산출용)
const GRADE_LIMITS = {
  '1': { limit: 2069900, name: '1등급 (장기요양 1등급)', text: '월 206만원 한도' },
  '2': { limit: 1869600, name: '2등급 (장기요양 2등급)', text: '월 186만원 한도' },
  '3': { limit: 1453100, name: '3등급 (장기요양 3등급)', text: '월 145만원 한도' },
  '4': { limit: 1341800, name: '4등급 (장기요양 4등급)', text: '월 134만원 한도' },
  '5': { limit: 1151600, name: '5등급 (치매 지원)', text: '월 115만원 한도' },
  'cognitive': { limit: 636600, name: '인지지원등급', text: '월 63만원 한도' }
};

// 2. 뷰 전환 및 라우팅 함수
function switchView(viewName, subAnchor) {
  const views = ['home', 'services', 'grade-check', 'contact'];
  if (!views.includes(viewName)) viewName = 'home';

  AppState.currentView = viewName;
  window.location.hash = viewName;

  // 뷰 DOM 전환
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
        el.classList.add('active');
      } else {
        el.classList.add('hidden');
        el.classList.remove('active');
      }
    }
  });

  // 하단 모바일 탭 스타일 업데이트
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === viewName) {
      btn.className = 'mobile-tab-btn flex-1 flex flex-col items-center justify-center h-14 transition-colors text-primary font-bold';
    } else {
      btn.className = 'mobile-tab-btn flex-1 flex flex-col items-center justify-center h-14 text-on-surface-variant transition-colors hover:text-primary';
    }
  });

  // 상단 데스크톱 네비게이션 스타일 업데이트
  document.querySelectorAll('.desktop-nav-link').forEach(btn => {
    const tab = btn.getAttribute('data-nav-tab');
    if (tab === viewName) {
      btn.className = 'desktop-nav-link active px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 text-primary bg-primary/10 font-bold';
    } else {
      btn.className = 'desktop-nav-link px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container';
    }
  });

  // 서브 앵커가 지정되었거나 상단 스크롤
  if (subAnchor === 'calc') {
    setTimeout(() => {
      switchServiceTab('calc');
    }, 150);
  } else if (['care', 'bath', 'family', 'equipment'].includes(subAnchor)) {
    switchServiceTab(subAnchor);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 시설 위치 지도 초기화
  if (viewName === 'contact') {
    initFacilityMap();
  }
}

// 2-1. 서비스 안내 서브 탭 전환 함수 (방문요양, 방문목욕, 가족요양, 복지용구, 계산기)
function switchServiceTab(tabName) {
  if (tabName === 'calc') {
    const calcEl = document.getElementById('cost-calculator-section') || document.getElementById('gradeSelectionContainer');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // 탭 버튼 스타일 갱신
  const tabBtns = document.querySelectorAll('#serviceTabGroup .service-tab-btn');
  tabBtns.forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabName) {
      btn.className = 'service-tab-btn flex items-center gap-1.5 px-4 py-2.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-primary text-on-primary shadow-sm transition-all duration-200';
    } else if (target === 'calc') {
      btn.className = 'service-tab-btn flex items-center gap-1.5 px-4 py-2.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-secondary font-bold transition-all duration-200';
    } else {
      btn.className = 'service-tab-btn flex items-center gap-1.5 px-4 py-2.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant transition-all duration-200';
    }
  });

  // 패널 토글
  const panels = {
    'care': document.getElementById('service-panel-care'),
    'bath': document.getElementById('service-panel-bath'),
    'family': document.getElementById('service-panel-family'),
    'equipment': document.getElementById('service-panel-equipment')
  };

  Object.keys(panels).forEach(key => {
    if (panels[key]) {
      if (key === tabName) {
        panels[key].classList.remove('hidden');
      } else {
        panels[key].classList.add('hidden');
      }
    }
  });
}

// 3. 계산기 인터랙션
function initCalculator() {
  const gradeButtons = document.querySelectorAll('.grade-pill-btn');
  const copayCards = document.querySelectorAll('.copay-card');

  // 등급 버튼 클릭 핸들러
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const grade = btn.getAttribute('data-grade');
      const limit = parseInt(btn.getAttribute('data-limit') || GRADE_LIMITS[grade]?.limit || 1453100, 10);

      AppState.calculator.grade = grade;
      AppState.calculator.monthlyLimit = limit;

      // 스타일 갱신
      gradeButtons.forEach(b => {
        b.className = 'grade-pill-btn p-3 rounded-lg bg-surface-container-low text-on-surface-variant flex flex-col items-center justify-center transition-all duration-150 active:scale-95';
      });
      btn.className = 'grade-pill-btn p-3 rounded-lg bg-primary text-on-primary shadow-sm flex flex-col items-center justify-center transition-all duration-150 active:scale-95';

      recalculateAndRender();
    });
  });

  // 본인부담율 카드 클릭 핸들러
  copayCards.forEach(card => {
    card.addEventListener('click', () => {
      const rate = parseFloat(card.getAttribute('data-rate'));
      AppState.calculator.copayRate = rate;

      copayCards.forEach(c => {
        c.className = 'copay-card cursor-pointer flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low text-on-surface transition-colors duration-150';
        const ind = c.querySelector('.copay-indicator');
        if (ind) {
          ind.className = 'copay-indicator w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-transparent shrink-0';
        }
      });

      card.className = 'copay-card cursor-pointer flex items-center justify-between p-3.5 rounded-lg bg-primary/10 text-on-surface transition-colors duration-150 border border-primary/20';
      const indicator = card.querySelector('.copay-indicator');
      if (indicator) {
        indicator.className = 'copay-indicator w-5 h-5 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0';
      }

      recalculateAndRender();
    });
  });

  recalculateAndRender();
}

function recalculateAndRender() {
  const limit = AppState.calculator.monthlyLimit;
  const rate = AppState.calculator.copayRate;

  const myPay = Math.floor(limit * rate);
  const govSupport = limit - myPay;

  // DOM 반영
  const limitEl = document.getElementById('displayMonthlyLimit');
  const govEl = document.getElementById('displayGovSupport');
  const myPayEl = document.getElementById('displayMyPay');
  const rateTextEl = document.getElementById('displayRateText');

  if (limitEl) limitEl.innerText = limit.toLocaleString() + '원';
  if (govEl) govEl.innerText = govSupport.toLocaleString() + '원';
  if (myPayEl) myPayEl.innerText = myPay.toLocaleString() + '원';
  if (rateTextEl) {
    if (rate === 0) {
      rateTextEl.innerText = '기초생활수급자 전액 무료 (0%)';
    } else {
      rateTextEl.innerText = `본인부담금 ${(rate * 100).toFixed(0)}% 적용`;
    }
  }
}

// 4. 자가진단 퀴즈 인터랙션
function updateScore() {
  const form = document.getElementById('quiz-form');
  if (!form) return;

  const q1 = form.querySelector('input[name="q1"]:checked');
  const q2 = form.querySelector('input[name="q2"]:checked');
  const q3 = form.querySelector('input[name="q3"]:checked');
  const q4 = form.querySelector('input[name="q4"]:checked');

  let answeredCount = 0;
  let totalScore = 0;

  if (q1) { answeredCount++; totalScore += parseInt(q1.value, 10); }
  if (q2) { answeredCount++; totalScore += parseInt(q2.value, 10); }
  if (q3) { answeredCount++; totalScore += parseInt(q3.value, 10); }
  if (q4) { answeredCount++; } // q4는 'yes', 'disease', 'no'

  // 옵션 선택 박스 시각적 피드백 (선택된 카드 강조)
  form.querySelectorAll('.quiz-option').forEach(label => {
    const radio = label.querySelector('input[type="radio"]');
    if (radio && radio.checked) {
      label.className = 'quiz-option cursor-pointer flex items-center justify-between p-3.5 rounded-lg bg-primary/10 border-2 border-primary text-primary font-bold shadow-sm transition-all';
    } else {
      label.className = 'quiz-option cursor-pointer flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low border-2 border-transparent text-on-surface hover:bg-surface-container transition-all';
    }
  });

  // 프로그레스 바 갱신
  const progressBar = document.getElementById('quiz-progress-bar');
  if (progressBar) {
    const percent = Math.max(15, (answeredCount / 4) * 100);
    progressBar.style.width = `${percent}%`;
  }

  // 진단 결과 미리보기
  const diagnosticText = document.getElementById('diagnostic-text');
  const diagnosticPreview = document.getElementById('diagnostic-preview');

  if (answeredCount < 4) {
    if (diagnosticText) {
      diagnosticText.innerText = `${answeredCount}/4개 문항 완료됨 (남은 문항을 체크해 주세요)`;
    }
    if (diagnosticPreview) {
      diagnosticPreview.classList.remove('border', 'border-secondary/40', 'bg-secondary/5', 'border-error/40', 'bg-error/5');
    }
    return;
  }

  // 4개 문항 모두 완료 시 판정 알고리즘
  // 1. Q4 기본 자격 요건 판정 (만 65세 미만이고 노인성 질환이 없는 경우)
  if (q4 && q4.value === 'no') {
    if (diagnosticText) {
      diagnosticText.innerHTML = `
        <span class="text-error font-bold block mb-1">신청 기준 미충족 (일반 복지 대상)</span>
        <span class="text-xs text-on-surface-variant font-normal leading-relaxed">
          노인장기요양보험은 만 65세 이상 또는 노인성 질환(뇌혈관질환·파킨슨 등) 진단 시 신청 가능합니다. 만 65세 도래 시 또는 일반 돌봄 상담은 센터(033-662-0001)로 문의해 주세요.
        </span>
      `;
    }
    if (diagnosticPreview) {
      diagnosticPreview.classList.remove('border-secondary/40', 'bg-secondary/5');
      diagnosticPreview.classList.add('border', 'border-error/40', 'bg-error/5');
    }
    return;
  }

  // 2. Q1~Q3 신체 및 인지 상태 점수 합산 (최소 3점 ~ 최대 9점)
  let predictedGrade = '';
  let explanation = '';

  if (totalScore >= 8) {
    predictedGrade = '1~2등급 유력 (중증 케어 / 최대 국비지원 대상)';
    explanation = '어르신의 거동 및 일상생활 자립도가 매우 낮아 하루 최대 4시간 방문요양, 2인 케어 또는 방문목욕이 집중 권장되는 등급입니다.';
  } else if (totalScore >= 6) {
    predictedGrade = '3등급 유력 (맞춤 재가요양 최적화 대상)';
    explanation = '혼자서는 외출이나 식사·가사가 어려우시며, 전문 요양보호사의 신체활동 및 가사 돌봄이 절실히 필요한 상태로 분석됩니다.';
  } else if (totalScore >= 4) {
    predictedGrade = '4~5등급 유력 (가사 지원 및 치매 인지 케어 대상)';
    explanation = '기본 거동은 일부 가능하나 인지기능 저하나 가사 보조가 필요하여, 맞춤형 인지활동 및 생활 돌봄 혜택 대상입니다.';
  } else {
    predictedGrade = '인지지원등급 또는 등급 외 (예방 관리 대상)';
    explanation = '신체 거동은 비교적 양호하시나 치매 예방이나 정기적 안부 확인이 필요한 상태입니다. 세부 인정 여부는 센터 사회복지사와 무료 상담을 권장합니다.';
  }

  if (diagnosticText) {
    diagnosticText.innerHTML = `
      <span class="text-secondary font-bold block mb-1">${predictedGrade}</span>
      <span class="text-xs text-on-surface-variant font-normal leading-relaxed">${explanation}</span>
    `;
  }
  if (diagnosticPreview) {
    diagnosticPreview.classList.remove('border-error/40', 'bg-error/5');
    diagnosticPreview.classList.add('border', 'border-secondary/40', 'bg-secondary/5');
  }
}

// 5. 신청 폼 제출 처리 (수신처: codud913@naver.com 이상현 시설장)
const NOTIFICATION_EMAIL = 'codud913@naver.com';
let currentConsultCategory = '방문요양 서비스';

async function handleFormSubmit(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('caregiver-name');
  const phoneInput = document.getElementById('caregiver-phone');
  const locationInput = document.getElementById('senior-location');
  const relRadio = document.querySelector('input[name="relationship"]:checked');
  const privacyConsent = document.getElementById('privacy-consent');
  const submitBtn = document.querySelector('#consult-form button[type="submit"]');

  if (privacyConsent && !privacyConsent.checked) {
    showToast('개인정보 수집 및 이용에 동의해 주세요.', 'error');
    return;
  }

  const name = nameInput?.value?.trim() || '';
  const phone = phoneInput?.value?.trim() || '';
  const location = locationInput?.value?.trim() || '';
  const relationship = relRadio ? (relRadio.value === 'child' ? '자녀' : relRadio.value === 'spouse' ? '배우자' : relRadio.value === 'self' ? '본인' : '기타/친척') : '미지정';

  const services = Array.from(document.querySelectorAll('#consult-form input[name="service"]:checked'))
    .map(cb => {
      if (cb.value === 'care') return '방문요양';
      if (cb.value === 'bath') return '방문목욕';
      if (cb.value === 'hospital') return '병원동행';
      if (cb.value === 'family') return '가족요양';
      return cb.value;
    }).join(', ');

  if (!name) {
    showToast('보호자(신청자) 성함을 입력해 주세요.', 'error');
    nameInput?.focus();
    return;
  }

  if (!phone) {
    showToast('연락처를 입력해 주세요.', 'error');
    phoneInput?.focus();
    return;
  }

  if (!location) {
    showToast('어르신 실거주 지역을 입력해 주세요.', 'error');
    locationInput?.focus();
    return;
  }

  // 버튼 로딩 피드백
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
      <span>접수 전송 중...</span>
    `;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
  }

  const payload = {
    _subject: `[진선미재가요양] 무료 등급신청 대행 접수: ${name}님 (${phone})`,
    _template: 'table',
    _captcha: 'false',
    '접수 유형': '등급신청 무료 대행 신청',
    '보호자(신청자) 성함': name,
    '연락처': phone,
    '어르신과의 관계': relationship,
    '어르신 실거주 지역': location,
    '필요 돌봄 서비스': services || '미선택',
    '자가진단 예상 결과': document.getElementById('diagnostic-text')?.textContent || '(미수행)',
    '접수 일시': new Date().toLocaleString('ko-KR')
  };

  // 1. 로컬 서버 접수 저장
  try {
    fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}

  // 2. 이메일 전송 (FormSubmit)
  try {
    await fetch(`https://formsubmit.co/ajax/${NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('FormSubmit transmission notice:', err);
  }

  // 성공 모달 띄우기
  const modal = document.getElementById('success-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('div')?.classList.remove('scale-95');
    }, 10);
  } else {
    showToast(`${name}님의 무료 등급신청 대행이 성공적으로 접수되었습니다!`, 'verified');
  }

  // 로컬 브라우저 백업 보관
  try {
    const list = JSON.parse(localStorage.getItem('jinseonmi_requests') || '[]');
    list.push({ ...payload, date: new Date().toISOString() });
    localStorage.setItem('jinseonmi_requests', JSON.stringify(list));
  } catch (e) {}

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

function closeModal() {
  const modal = document.getElementById('success-modal');
  if (modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
  }
}

function closeSuccessModal() {
  closeModal();
}

async function handleConsultSubmit(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('caller-name');
  const phoneInput = document.getElementById('caller-phone');
  const memoInput = document.getElementById('consult-memo');
  const agree = document.getElementById('privacy-agree');
  const submitBtn = document.querySelector('#care-consult-form button[type="submit"]');

  if (agree && !agree.checked) {
    showToast('개인정보 수집 및 이용에 동의해 주세요.', 'error');
    return;
  }

  const name = nameInput?.value?.trim() || '';
  const phone = phoneInput?.value?.trim() || '';
  const memo = memoInput?.value?.trim() || '';

  if (!name) {
    showToast('보호자(신청인) 성함을 입력해 주세요.', 'error');
    nameInput?.focus();
    return;
  }

  if (!phone) {
    showToast('연락처를 입력해 주세요.', 'error');
    phoneInput?.focus();
    return;
  }

  // 버튼 로딩 피드백
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
      <span>상담 신청 전송 중...</span>
    `;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
  }

  const payload = {
    _subject: `[진선미재가요양] 새 1:1 상담 신청 접수: ${name}님 (${phone})`,
    _template: 'table',
    _captcha: 'false',
    '접수 유형': '1:1 간편 상담 접수',
    '신청인(보호자) 성함': name,
    '연락처': phone,
    '주요 문의 분야': currentConsultCategory,
    '어르신 상황 메모': memo || '(작성 내용 없음)',
    '접수 일시': new Date().toLocaleString('ko-KR')
  };

  // 1. 로컬 서버 접수 저장
  try {
    fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}

  // 2. 이메일 전송 (FormSubmit)
  try {
    await fetch(`https://formsubmit.co/ajax/${NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('FormSubmit transmission notice:', err);
  }

  // 폼 숨기고 성공 배너 표시
  const form = document.getElementById('care-consult-form');
  const successBanner = document.getElementById('form-success-banner');
  if (form) form.classList.add('hidden');
  if (successBanner) {
    successBanner.classList.remove('hidden');
    successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showToast(`${name}님의 1:1 상담 예약이 접수되었습니다!`, 'check_circle');

  // 로컬 백업 저장
  try {
    const list = JSON.parse(localStorage.getItem('jinseonmi_requests') || '[]');
    list.push({ ...payload, date: new Date().toISOString() });
    localStorage.setItem('jinseonmi_requests', JSON.stringify(list));
  } catch (e) {}

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

function selectCategory(button, categoryName) {
  currentConsultCategory = categoryName || button.querySelector('span')?.textContent?.trim() || '방문요양 서비스';
  const group = document.getElementById('consult-category-group');
  if (!group) return;

  group.querySelectorAll('.consult-opt').forEach(btn => {
    btn.className = 'consult-opt h-11 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-between text-left';
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.add('opacity-0');
  });

  button.className = 'consult-opt h-11 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-between text-left shadow-sm';
  const activeIcon = button.querySelector('.material-symbols-outlined');
  if (activeIcon) activeIcon.classList.remove('opacity-0');
}

// 5-1. 자주 묻는 질문 (FAQ) 아코디언 토글
function toggleFaq(index) {
  const ans = document.getElementById(`faq-ans-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);
  if (!ans) return;

  const isHidden = ans.classList.contains('hidden');
  if (isHidden) {
    ans.classList.remove('hidden');
    if (icon) {
      icon.innerText = 'expand_less';
      icon.classList.add('text-secondary');
    }
  } else {
    ans.classList.add('hidden');
    if (icon) {
      icon.innerText = 'expand_more';
      icon.classList.remove('text-secondary');
    }
  }
}

// 6. 모바일 드로어 및 카카오 모달
function openDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const panel = document.getElementById('drawer-panel');
  if (drawer && panel) {
    drawer.classList.remove('hidden');
    setTimeout(() => {
      drawer.classList.remove('opacity-0');
      panel.classList.remove('translate-x-full');
    }, 10);
  }
}

function closeDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const panel = document.getElementById('drawer-panel');
  if (drawer && panel) {
    drawer.classList.add('opacity-0');
    panel.classList.add('translate-x-full');
    setTimeout(() => drawer.classList.add('hidden'), 300);
  }
}

function openKakaoModal() {
  const modal = document.getElementById('kakao-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('div')?.classList.remove('scale-95');
    }, 10);
  }
}

function closeKakaoModal() {
  const modal = document.getElementById('kakao-modal');
  if (modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
  }
}

const KAKAO_OPENCHAT_URL = 'https://open.kakao.com/o/glWVgATi';

function copyKakaoLink() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(KAKAO_OPENCHAT_URL).then(() => {
      showToast('진선미 공유방 링크가 복사되었습니다!', 'content_copy');
    }).catch(() => {
      prompt('아래 오픈채팅 링크를 복사하여 이용해 주세요:', KAKAO_OPENCHAT_URL);
    });
  } else {
    prompt('아래 오픈채팅 링크를 복사하여 이용해 주세요:', KAKAO_OPENCHAT_URL);
  }
}

function copyKakaoId() {
  copyKakaoLink();
}

// 7. 토스트 알림 헬퍼
function showToast(message, icon = 'check_circle') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast || !toastMsg) return;

  toastMsg.innerText = message;
  if (toastIcon) toastIcon.innerText = icon;

  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 3200);
}

// 8. 시설 위치 Leaflet 지도 및 주소 복사
let facilityMap = null;
const JUMUNJIN_COORDS = [37.893895, 128.826724]; // 강원특별자치도 강릉시 주문진읍 교항원길 39-2

function initFacilityMap() {
  try {
    const container = document.getElementById('facility-map');
    if (!container) return;

    // Leaflet 라이브러리가 로드되었는지 확인
    if (typeof L === 'undefined') {
      setTimeout(initFacilityMap, 300);
      return;
    }

    if (container._leaflet_id && !facilityMap) {
      container._leaflet_id = null;
    }

    if (!facilityMap) {
      facilityMap = L.map('facility-map', {
        center: JUMUNJIN_COORDS,
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false
      });

      // OpenStreetMap 타일 레이어
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(facilityMap);

      // 커스텀 마커 핀
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="position:relative; transform: translate(-50%, -100%); cursor:pointer;">
            <div style="background-color: #0d402e; color: #ffffff; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 12px rgba(13,64,46,0.35); display: flex; align-items: center; gap: 5px; border: 2px solid #ffffff;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#fe8449; box-shadow: 0 0 6px #fe8449;"></span>
              진선미 재가요양기관
            </div>
            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid #0d402e; margin:0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker(JUMUNJIN_COORDS, { icon: customIcon }).addTo(facilityMap);

      // 팝업 내용
      marker.bindPopup(`
        <div style="font-family:'Noto Sans KR',sans-serif; padding:4px; max-width:220px;">
          <strong style="color:#0d402e; font-size:13px; display:block; margin-bottom:2px;">진선미 재가장기요양기관</strong>
          <span style="font-size:11px; color:#555; display:block; line-height:1.4;">강원특별자치도 강릉시 주문진읍 교항원길 39-2</span>
          <div style="margin-top:8px; display:flex; gap:4px;">
            <a href="https://map.kakao.com/link/map/진선미재가장기요양기관,37.893895,128.826724" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; padding:4px 6px; background:#FEE500; color:#3C1E1E; border-radius:6px; font-size:10px; font-weight:bold; text-decoration:none;">카카오맵</a>
            <a href="https://map.naver.com/p/search/%EA%B0%95%EC%9B%90%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%20%EA%B0%95%EB%A6%89%EC%8B%9C%20%EC%A3%BC%EB%AC%B8%EC%A7%84%EC%9D%8D%20%EA%B5%90%ED%95%AD%EC%9B%90%EA%B8%B8%2039-2" target="_blank" rel="noopener noreferrer" style="flex:1; text-align:center; padding:4px 6px; background:#03C75A; color:#ffffff; border-radius:6px; font-size:10px; font-weight:bold; text-decoration:none;">네이버지도</a>
          </div>
        </div>
      `);
    }

    // SPA 탭 전환 시 Leaflet 타일 렌더링 갱신
    setTimeout(() => {
      if (facilityMap) {
        facilityMap.invalidateSize();
        facilityMap.setView(JUMUNJIN_COORDS, 16);
      }
    }, 150);
  } catch (err) {
    console.warn('Map init safe warning:', err);
  }
}

function copyFacilityAddress() {
  const address = '강원특별자치도 강릉시 주문진읍 교항원길 39-2';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(address).then(() => {
      showToast('센터 주소가 클립보드에 복사되었습니다!', 'content_copy');
    }).catch(() => {
      showToast(address, 'pin_drop');
    });
  } else {
    showToast(address, 'pin_drop');
  }
}

// 9. 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  // 해시 기반 라우팅
  const initialHash = window.location.hash.replace('#', '') || 'home';
  switchView(initialHash);

  // 뒤로가기 대응
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    if (hash !== AppState.currentView) {
      switchView(hash);
    }
  });

  // 드로어 토글 바인딩
  const btnToggle = document.getElementById('btn-toggle-menu');
  const btnClose = document.getElementById('btn-close-drawer');
  if (btnToggle) btnToggle.addEventListener('click', openDrawer);
  if (btnClose) btnClose.addEventListener('click', closeDrawer);

  // 드로어 배경 클릭 시 닫기
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
  }

  // 계산기 초기화
  initCalculator();

  // 폼 제출 이벤트 명시적 바인딩
  const careConsultForm = document.getElementById('care-consult-form');
  if (careConsultForm) {
    careConsultForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleConsultSubmit(e);
      return false;
    });
  }

  const gradeConsultForm = document.getElementById('consult-form');
  if (gradeConsultForm) {
    gradeConsultForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleFormSubmit(e);
      return false;
    });
  }

  // 전화번호 자동 하이픈 (-) 포맷터 바인딩
  ['caregiver-phone', 'consult-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function(e) {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 3 && val.length <= 7) {
          val = val.slice(0, 3) + '-' + val.slice(3);
        } else if (val.length > 7) {
          val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
        }
        e.target.value = val;
      });
    }
  });
  document.querySelectorAll('a[href="#"]').forEach(a => {
    const text = a.innerText.trim();
    if (text.includes('방문요양') || text.includes('방문목욕') || text.includes('가족요양') || text.includes('복지용구') || text.includes('자세히보기')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('services');
      });
    }
    if (text.includes('자가진단') || text.includes('등급')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('grade-check');
      });
    }
    if (text.includes('상담') || text.includes('오시는길')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('contact');
      });
    }
  });

  console.log('Jinseonmi Care Web App initialized successfully.');
});
