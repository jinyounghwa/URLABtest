const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const domParser = require('../utils/domParser');

// 스크린샷 저장 경로
const SCREENSHOT_DIR = path.join(__dirname, '../../public/screenshots');

// 스크린샷 디렉토리 확인 및 생성
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * 경쟁사 URL 분석 서비스
 */
exports.analyzeCompetitors = async (urlA, urlB) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 결과 객체 초기화
    const result = {
      siteA: {
        url: urlA,
        screenshots: {},
        features: {}
      },
      siteB: {
        url: urlB,
        screenshots: {},
        features: {}
      },
      featureMatrix: {}
    };

    // 주요 페이지 경로 정의
    const pagePaths = [
      { name: 'home', path: '/' },
      { name: 'search', path: '/search' },
      { name: 'product', path: '/product' }
    ];

    // 각 사이트 분석
    for (const site of ['siteA', 'siteB']) {
      const url = site === 'siteA' ? urlA : urlB;
      
      // 각 주요 페이지 분석
      for (const pagePath of pagePaths) {
        try {
          const page = await browser.newPage();
          
          // 페이지 설정
          await page.setViewport({ width: 1280, height: 800 });
          
          // 페이지 방문
          const targetUrl = new URL(pagePath.path, url).toString();
          await page.goto(targetUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });
          
          // 스크린샷 파일명 생성
          const screenshotFilename = `${site}_${pagePath.name}_${Date.now()}.png`;
          const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFilename);
          
          // 스크린샷 촬영
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          });
          
          // 결과에 스크린샷 정보 저장
          result[site].screenshots[pagePath.name] = `/screenshots/${screenshotFilename}`;
          
          // HTML 추출
          const html = await page.content();
          
          // 기능 탐지
          const features = await domParser.detectFeatures(page);
          
          // 결과에 기능 정보 저장
          result[site].features[pagePath.name] = features;
          
          // 페이지 닫기
          await page.close();
          
        } catch (error) {
          console.error(`Error analyzing ${site} ${pagePath.name} page:`, error);
          // 오류가 발생해도 계속 진행
        }
      }
    }
    
    // 기능 매트릭스 생성
    result.featureMatrix = generateFeatureMatrix(result.siteA.features, result.siteB.features);
    
    return result;
    
  } finally {
    // 브라우저 종료
    await browser.close();
  }
};

/**
 * 기능 매트릭스 생성 함수
 */
function generateFeatureMatrix(siteFeaturesA, siteFeaturesB) {
  const matrix = {};
  
  // 모든 페이지와 기능을 순회하며 매트릭스 생성
  for (const pageName in siteFeaturesA) {
    if (siteFeaturesA[pageName]) {
      const pageFeatures = siteFeaturesA[pageName];
      
      for (const featureName in pageFeatures) {
        const matrixKey = `${pageName}_${featureName}`;
        
        // 매트릭스에 기능 추가
        if (!matrix[matrixKey]) {
          matrix[matrixKey] = {
            page: pageName,
            feature: featureName,
            siteA: false,
            siteB: false
          };
        }
        
        // 사이트 A 기능 상태 설정
        matrix[matrixKey].siteA = pageFeatures[featureName];
      }
    }
  }
  
  // 사이트 B의 기능도 매트릭스에 추가
  for (const pageName in siteFeaturesB) {
    if (siteFeaturesB[pageName]) {
      const pageFeatures = siteFeaturesB[pageName];
      
      for (const featureName in pageFeatures) {
        const matrixKey = `${pageName}_${featureName}`;
        
        // 매트릭스에 기능 추가 (사이트 A에 없는 기능일 경우)
        if (!matrix[matrixKey]) {
          matrix[matrixKey] = {
            page: pageName,
            feature: featureName,
            siteA: false,
            siteB: false
          };
        }
        
        // 사이트 B 기능 상태 설정
        matrix[matrixKey].siteB = pageFeatures[featureName];
      }
    }
  }
  
  return matrix;
}
