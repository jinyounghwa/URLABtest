/**
 * 경쟁사 기능 비교 뷰어 - 프론트엔드 스크립트
 */

// DOM 요소
const analyzeForm = document.getElementById('analyze-form');
const inputSection = document.getElementById('input-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const featureTableBody = document.getElementById('feature-table-body');
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const resetButton = document.getElementById('reset-button');
const resetButtonResult = document.getElementById('reset-button-result');

// 현재 분석 결과 데이터
let currentAnalysisData = null;
let currentJobId = null;

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  // 분석 폼 제출 이벤트
  analyzeForm.addEventListener('submit', handleAnalyzeFormSubmit);
  
  // 탭 버튼 클릭 이벤트
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  
  // 내보내기 버튼 이벤트
  exportCsvBtn.addEventListener('click', exportAsCsv);
  exportPdfBtn.addEventListener('click', exportAsPdf);
  
  // 초기화 버튼 이벤트 (입력 화면)
  resetButton.addEventListener('click', resetApplication);
  
  // 초기화 버튼 이벤트 (결과 화면)
  resetButtonResult.addEventListener('click', resetApplication);
});

/**
 * 분석 폼 제출 처리
 */
async function handleAnalyzeFormSubmit(event) {
  event.preventDefault();
  
  // 폼 데이터 가져오기
  const urlA = document.getElementById('url-a').value.trim();
  const urlB = document.getElementById('url-b').value.trim();
  
  // URL 유효성 검사
  if (!isValidUrl(urlA) || !isValidUrl(urlB)) {
    alert('유효한 URL을 입력해주세요.');
    return;
  }
  
  // UI 상태 변경 (로딩 표시)
  inputSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  
  try {
    // 분석 요청 보내기
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ urlA, urlB })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '분석 요청 중 오류가 발생했습니다.');
    }
    
    // 작업 ID 저장
    currentJobId = data.jobId;
    
    // 작업 ID로 결과 폴링 시작
    pollAnalysisResult(data.jobId);
    
  } catch (error) {
    console.error('분석 요청 오류:', error);
    alert(`오류가 발생했습니다: ${error.message}`);
    
    // UI 상태 복원
    inputSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
  }
}

/**
 * 분석 결과 폴링
 */
async function pollAnalysisResult(jobId) {
  try {
    const response = await fetch(`/api/result/${jobId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '결과 조회 중 오류가 발생했습니다.');
    }
    
    // 처리 중인 경우 계속 폴링
    if (data.status === 'processing') {
      setTimeout(() => pollAnalysisResult(jobId), 2000);
      return;
    }
    
    // 완료된 경우 결과 표시
    currentAnalysisData = data.data;
    displayAnalysisResult(currentAnalysisData);
    
  } catch (error) {
    console.error('결과 조회 오류:', error);
    alert(`오류가 발생했습니다: ${error.message}`);
    
    // UI 상태 복원
    inputSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
  }
}

/**
 * 분석 결과 화면에 표시
 */
function displayAnalysisResult(data) {
  // UI 상태 변경
  loadingSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  
  // 사이트 이름 설정
  const siteADomain = new URL(data.siteA.url).hostname;
  const siteBDomain = new URL(data.siteB.url).hostname;
  
  document.getElementById('site-a-name').textContent = siteADomain;
  document.getElementById('site-b-name').textContent = siteBDomain;
  document.getElementById('site-a-name-search').textContent = siteADomain;
  document.getElementById('site-b-name-search').textContent = siteBDomain;
  document.getElementById('site-a-name-product').textContent = siteADomain;
  document.getElementById('site-b-name-product').textContent = siteBDomain;
  
  document.getElementById('site-a-header').textContent = siteADomain;
  document.getElementById('site-b-header').textContent = siteBDomain;
  
  // 스크린샷 이미지 설정
  if (data.siteA.screenshots.home) {
    document.getElementById('site-a-home-img').src = data.siteA.screenshots.home;
  }
  if (data.siteB.screenshots.home) {
    document.getElementById('site-b-home-img').src = data.siteB.screenshots.home;
  }
  
  if (data.siteA.screenshots.search) {
    document.getElementById('site-a-search-img').src = data.siteA.screenshots.search;
  }
  if (data.siteB.screenshots.search) {
    document.getElementById('site-b-search-img').src = data.siteB.screenshots.search;
  }
  
  if (data.siteA.screenshots.product) {
    document.getElementById('site-a-product-img').src = data.siteA.screenshots.product;
  }
  if (data.siteB.screenshots.product) {
    document.getElementById('site-b-product-img').src = data.siteB.screenshots.product;
  }
  
  // 기능 매트릭스 테이블 생성
  generateFeatureTable(data.featureMatrix);
  
  // 첫 번째 탭 활성화
  switchTab('home');
}

/**
 * 기능 매트릭스 테이블 생성
 */
function generateFeatureTable(featureMatrix) {
  // 테이블 초기화
  featureTableBody.innerHTML = '';
  
  // 기능별 행 추가
  for (const key in featureMatrix) {
    const feature = featureMatrix[key];
    const row = document.createElement('tr');
    
    // 페이지 열
    const pageCell = document.createElement('td');
    pageCell.textContent = getPageDisplayName(feature.page);
    row.appendChild(pageCell);
    
    // 기능 열
    const featureCell = document.createElement('td');
    featureCell.textContent = getFeatureDisplayName(feature.feature);
    row.appendChild(featureCell);
    
    // 사이트 A 기능 유무 열
    const siteACell = document.createElement('td');
    siteACell.innerHTML = feature.siteA ? '<span class="feature-yes">✅ 있음</span>' : '<span class="feature-no">❌ 없음</span>';
    row.appendChild(siteACell);
    
    // 사이트 B 기능 유무 열
    const siteBCell = document.createElement('td');
    siteBCell.innerHTML = feature.siteB ? '<span class="feature-yes">✅ 있음</span>' : '<span class="feature-no">❌ 없음</span>';
    row.appendChild(siteBCell);
    
    featureTableBody.appendChild(row);
  }
}

/**
 * 페이지 이름 표시용 변환
 */
function getPageDisplayName(pageName) {
  const pageNames = {
    'home': '홈페이지',
    'search': '검색 페이지',
    'product': '상품 페이지'
  };
  
  return pageNames[pageName] || pageName;
}

/**
 * 기능 이름 표시용 변환
 */
function getFeatureDisplayName(featureName) {
  const featureNames = {
    'searchBar': '검색 기능',
    'filter': '필터 기능',
    'sort': '정렬 기능',
    'favorite': '찜/좋아요',
    'cart': '장바구니',
    'login': '로그인/회원가입',
    'navigation': '메뉴/네비게이션',
    'pagination': '페이지네이션',
    'share': '공유 기능',
    'review': '리뷰/평점'
  };
  
  return featureNames[featureName] || featureName;
}

/**
 * 탭 전환 함수
 */
function switchTab(tabName) {
  // 모든 탭 비활성화
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  // 선택한 탭 활성화
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

/**
 * CSV 형식으로 내보내기
 */
function exportAsCsv() {
  if (!currentAnalysisData) return;
  
  const matrix = currentAnalysisData.featureMatrix;
  const siteADomain = new URL(currentAnalysisData.siteA.url).hostname;
  const siteBDomain = new URL(currentAnalysisData.siteB.url).hostname;
  
  // CSV 헤더
  let csvContent = `페이지,기능,${siteADomain},${siteBDomain}\n`;
  
  // CSV 데이터 행
  for (const key in matrix) {
    const feature = matrix[key];
    const page = getPageDisplayName(feature.page);
    const featureName = getFeatureDisplayName(feature.feature);
    const siteAValue = feature.siteA ? 'O' : 'X';
    const siteBValue = feature.siteB ? 'O' : 'X';
    
    csvContent += `${page},${featureName},${siteAValue},${siteBValue}\n`;
  }
  
  // 다운로드 링크 생성
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `기능비교_${siteADomain}_vs_${siteBDomain}_${formatDate()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PDF 형식으로 내보내기
 */
async function exportAsPdf() {
  if (!currentAnalysisData) {
    alert('내보낼 분석 결과가 없습니다.');
    return;
  }
  
  try {
    // 작업 ID 가져오기
    const jobId = currentJobId;
    
    if (!jobId) {
      alert('작업 ID를 찾을 수 없습니다.');
      return;
    }
    
    // 버튼 비활성화 및 로딩 표시
    exportPdfBtn.disabled = true;
    exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PDF 생성 중...';
    
    // PDF 생성 API 호출
    const response = await fetch(`/api/export-pdf/${jobId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'PDF 생성 중 오류가 발생했습니다.');
    }
    
    // PDF 다운로드 링크 생성
    const pdfUrl = data.pdfUrl;
    
    // 다운로드 시작
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = `경쟁사_기능_비교_${formatDate()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 완료 후 버튼 상태 복원
    exportPdfBtn.disabled = false;
    exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDF 내보내기';
    
  } catch (error) {
    console.error('PDF 내보내기 오류:', error);
    alert(`오류가 발생했습니다: ${error.message}`);
    
    // 오류 발생 시 버튼 상태 복원
    exportPdfBtn.disabled = false;
    exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDF 내보내기';
  }
}

/**
 * URL 유효성 검사
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
}

/**
 * 애플리케이션 초기화 함수
 */
function resetApplication() {
  // 폼 초기화
  analyzeForm.reset();
  
  // UI 상태 초기화
  resultSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  inputSection.classList.remove('hidden');
  
  // 결과 데이터 초기화
  currentAnalysisData = null;
  
  // 테이블 초기화
  featureTableBody.innerHTML = '';
  
  // 스크린샷 이미지 초기화
  document.getElementById('site-a-home-img').src = '';
  document.getElementById('site-b-home-img').src = '';
  document.getElementById('site-a-search-img').src = '';
  document.getElementById('site-b-search-img').src = '';
  document.getElementById('site-a-product-img').src = '';
  document.getElementById('site-b-product-img').src = '';
  
  // 사이트 이름 초기화
  document.getElementById('site-a-name').textContent = '경쟁사 A';
  document.getElementById('site-b-name').textContent = '경쟁사 B';
  document.getElementById('site-a-name-search').textContent = '경쟁사 A';
  document.getElementById('site-b-name-search').textContent = '경쟁사 B';
  document.getElementById('site-a-name-product').textContent = '경쟁사 A';
  document.getElementById('site-b-name-product').textContent = '경쟁사 B';
  
  document.getElementById('site-a-header').textContent = '경쟁사 A';
  document.getElementById('site-b-header').textContent = '경쟁사 B';
  
  console.log('애플리케이션이 초기화되었습니다.');
}
