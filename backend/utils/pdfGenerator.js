/**
 * PDF 생성 유틸리티
 * 분석 결과를 PDF 형식으로 변환하는 기능을 제공합니다.
 */

const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

// 맑은고딕 폰트 경로
const MALGUN_FONT_PATH = path.join(__dirname, '../../public/fonts/malgun.ttf');

/**
 * 분석 결과를 PDF로 생성
 * @param {Object} analysisData - 분석 결과 데이터
 * @param {String} outputPath - PDF 저장 경로
 * @returns {Promise<String>} 생성된 PDF 파일 경로
 */
exports.generatePDF = async (analysisData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // PDF 문서 생성
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: '경쟁사 기능 비교 분석 보고서',
          Author: 'URL A/B TEST 도구',
          Subject: '웹사이트 기능 비교 분석',
          Keywords: '기능 비교, 웹사이트 분석, 경쟁사 분석'
        }
      });
      
      // 맑은고딕 폰트 등록
      if (fs.existsSync(MALGUN_FONT_PATH)) {
        doc.registerFont('Malgun', MALGUN_FONT_PATH);
      }

      // 출력 스트림 설정
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // 사이트 정보 추출
      const siteAUrl = analysisData.siteA.url;
      const siteBUrl = analysisData.siteB.url;
      const siteADomain = new URL(siteAUrl).hostname;
      const siteBDomain = new URL(siteBUrl).hostname;

      // 제목 및 헤더 추가
      const useKoreanFont = fs.existsSync(MALGUN_FONT_PATH);
      const koreanFont = useKoreanFont ? 'Malgun' : 'Helvetica-Bold';
      
      doc.font(koreanFont)
         .fontSize(20)
         .text('경쟁사 기능 비교 분석 보고서', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12)
         .text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, { align: 'right' });
      
      doc.moveDown();
      doc.fontSize(14)
         .text('비교 대상 웹사이트', { underline: true });
      
      doc.fontSize(12)
         .text(`사이트 A: ${siteADomain} (${siteAUrl})`)
         .text(`사이트 B: ${siteBDomain} (${siteBUrl})`);
      
      doc.moveDown(2);

      // 기능 매트릭스 테이블 생성
      doc.fontSize(14)
         .text('기능 비교 매트릭스', { underline: true });
      
      doc.moveDown();
      
      // 페이지 이름 변환 함수
      const getPageDisplayName = (pageName) => {
        const pageNames = {
          'home': 'Homepage',
          'search': 'Search Page',
          'product': 'Product Page'
        };
        return pageNames[pageName] || pageName;
      };
      
      // 기능 이름 변환 함수
      const getFeatureDisplayName = (featureName) => {
        const featureNames = {
          'searchBar': 'Search Function',
          'filter': 'Filter Function',
          'sort': 'Sort Function',
          'favorite': 'Wishlist/Like',
          'cart': 'Shopping Cart',
          'login': 'Login/Register',
          'navigation': 'Menu/Navigation',
          'pagination': 'Pagination',
          'share': 'Share Function',
          'review': 'Review/Rating'
        };
        return featureNames[featureName] || featureName;
      };
      
      // 테이블 데이터 준비
      const tableData = {
        headers: [
          { label: 'Page', property: 'page', width: 100, renderer: null },
          { label: 'Feature', property: 'feature', width: 150, renderer: null },
          { label: siteADomain, property: 'siteA', width: 100, renderer: null },
          { label: siteBDomain, property: 'siteB', width: 100, renderer: null }
        ],
        rows: []
      };
      
      // 행 데이터 추가
      for (const key in analysisData.featureMatrix) {
        const feature = analysisData.featureMatrix[key];
        tableData.rows.push({
          page: getPageDisplayName(feature.page),
          feature: getFeatureDisplayName(feature.feature),
          siteA: feature.siteA ? 'Yes' : 'No',
          siteB: feature.siteB ? 'Yes' : 'No'
        });
      }
      
      // 테이블 생성 - 수동으로 테이블 그리기
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [100, 150, 100, 100];
      const rowHeight = 30;
      const headerHeight = 30;
      
      // 테이블 헤더 배경
      doc.fillColor('#f0f0f0')
         .rect(tableLeft, tableTop, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerHeight)
         .fill();
      
      // 테이블 헤더 텍스트
      doc.fillColor('#000000')
         .font(useKoreanFont ? 'Malgun' : 'Helvetica-Bold')
         .fontSize(10);
      
      let currentX = tableLeft;
      doc.text('Page', currentX + 5, tableTop + 10, { width: colWidths[0] - 10 });
      currentX += colWidths[0];
      
      doc.text('Feature', currentX + 5, tableTop + 10, { width: colWidths[1] - 10 });
      currentX += colWidths[1];
      
      doc.text(siteADomain, currentX + 5, tableTop + 10, { width: colWidths[2] - 10 });
      currentX += colWidths[2];
      
      doc.text(siteBDomain, currentX + 5, tableTop + 10, { width: colWidths[3] - 10 });
      
      // 행 그리기
      let rowY = tableTop + headerHeight;
      let rowCount = 0;
      
      // 테이블 데이터 반복
      for (const key in analysisData.featureMatrix) {
        const feature = analysisData.featureMatrix[key];
        
        // 페이지 넘치는지 확인
        if (rowY + rowHeight > doc.page.height - 100) {
          // 페이지 추가
          doc.addPage();
          rowY = 50;
          
          // 새 페이지에 테이블 헤더 추가
          doc.fillColor('#f0f0f0')
             .rect(tableLeft, rowY, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerHeight)
             .fill();
          
          doc.fillColor('#000000')
             .font(useKoreanFont ? 'Malgun' : 'Helvetica-Bold')
             .fontSize(10);
          
          currentX = tableLeft;
          doc.text('Page', currentX + 5, rowY + 10, { width: colWidths[0] - 10 });
          currentX += colWidths[0];
          
          doc.text('Feature', currentX + 5, rowY + 10, { width: colWidths[1] - 10 });
          currentX += colWidths[1];
          
          doc.text(siteADomain, currentX + 5, rowY + 10, { width: colWidths[2] - 10 });
          currentX += colWidths[2];
          
          doc.text(siteBDomain, currentX + 5, rowY + 10, { width: colWidths[3] - 10 });
          
          rowY += headerHeight;
        }
        
        // 행 배경색 (짝수/홀수 행 구분)
        if (rowCount % 2 === 1) {
          doc.fillColor('#f9f9f9')
             .rect(tableLeft, rowY, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowHeight)
             .fill();
        }
        
        // 행 데이터 추가
        doc.font(useKoreanFont ? 'Malgun' : 'Helvetica').fontSize(10).fillColor('#000000');
        
        currentX = tableLeft;
        doc.text(getPageDisplayName(feature.page), currentX + 5, rowY + 10, { width: colWidths[0] - 10 });
        currentX += colWidths[0];
        
        doc.text(getFeatureDisplayName(feature.feature), currentX + 5, rowY + 10, { width: colWidths[1] - 10 });
        currentX += colWidths[1];
        
        // 사이트 A 기능 유무
        doc.fillColor(feature.siteA ? '#28a745' : '#dc3545');
        doc.text(feature.siteA ? 'Yes' : 'No', currentX + 5, rowY + 10, { width: colWidths[2] - 10 });
        currentX += colWidths[2];
        
        // 사이트 B 기능 유무
        doc.fillColor(feature.siteB ? '#28a745' : '#dc3545');
        doc.text(feature.siteB ? 'Yes' : 'No', currentX + 5, rowY + 10, { width: colWidths[3] - 10 });
        
        rowY += rowHeight;
        rowCount++;
      }
      
      // 테이블 테두리 그리기
      doc.lineWidth(1)
         .rect(tableLeft, tableTop, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerHeight + (rowCount * rowHeight))
         .stroke();
      
      // 요약 정보 추가
      doc.addPage();
      
      doc.fillColor('#000')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('Analysis Summary', { align: 'center' });
      
      doc.moveDown();
      
      // 사이트별 기능 개수 계산
      let siteAFeatureCount = 0;
      let siteBFeatureCount = 0;
      
      for (const key in analysisData.featureMatrix) {
        const feature = analysisData.featureMatrix[key];
        if (feature.siteA) siteAFeatureCount++;
        if (feature.siteB) siteBFeatureCount++;
      }
      
      doc.fontSize(12)
         .text(`${siteADomain}: ${siteAFeatureCount} features detected`)
         .text(`${siteBDomain}: ${siteBFeatureCount} features detected`);
      
      doc.moveDown();
      
      // 공통 기능 및 차별화 기능
      let commonFeatures = [];
      let uniqueToA = [];
      let uniqueToB = [];
      
      for (const key in analysisData.featureMatrix) {
        const feature = analysisData.featureMatrix[key];
        const featureName = getFeatureDisplayName(feature.feature);
        const pageName = getPageDisplayName(feature.page);
        const fullFeatureName = `${pageName} - ${featureName}`;
        
        if (feature.siteA && feature.siteB) {
          commonFeatures.push(fullFeatureName);
        } else if (feature.siteA) {
          uniqueToA.push(fullFeatureName);
        } else if (feature.siteB) {
          uniqueToB.push(fullFeatureName);
        }
      }
      
      doc.font('Helvetica-Bold')
         .text('Common Features:');
      
      doc.font('Helvetica');
      if (commonFeatures.length > 0) {
        commonFeatures.forEach(feature => {
          doc.text(`• ${feature}`);
        });
      } else {
        doc.text('• No common features found.');
      }
      
      doc.moveDown()
         .font('Helvetica-Bold')
         .text(`${siteADomain} Unique Features:`);
      
      doc.font('Helvetica');
      if (uniqueToA.length > 0) {
        uniqueToA.forEach(feature => {
          doc.text(`• ${feature}`);
        });
      } else {
        doc.text('• No unique features found.');
      }
      
      doc.moveDown()
         .font('Helvetica-Bold')
         .text(`${siteBDomain} Unique Features:`);
      
      doc.font('Helvetica');
      if (uniqueToB.length > 0) {
        uniqueToB.forEach(feature => {
          doc.text(`• ${feature}`);
        });
      } else {
        doc.text('• No unique features found.');
      }
      
      // 푸터 추가
      try {
        const range = doc.bufferedPageRange();
        const pageCount = range.count;
        
        // 페이지 범위 확인 및 디버깅 정보 출력
        console.log(`PDF 페이지 범위: ${range.start}~${range.start + range.count - 1}, 총 ${pageCount}개`);
        
        // 각 페이지에 푸터 추가
        for (let i = 0; i < pageCount; i++) {
          const pageIndex = range.start + i;
          
          doc.switchToPage(pageIndex);
          
          doc.font('Helvetica')
             .fontSize(8)
             .text(
               `Website Feature Comparison - Page ${i + 1}/${pageCount}`,
               50,
               doc.page.height - 50,
               { align: 'center' }
             );
        }
      } catch (error) {
        console.error('PDF 푸터 추가 중 오류:', error);
        // 푸터 추가 오류가 발생해도 PDF 생성은 계속 진행
      }
      
      // PDF 문서 종료
      doc.end();
      
      // 스트림 종료 시 경로 반환
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};
