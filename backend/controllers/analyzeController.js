const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const analyzerService = require('../services/analyzer');
const pdfGenerator = require('../utils/pdfGenerator');

// PDF 저장 디렉토리 설정
const PDF_DIR = path.join(__dirname, '../../public/pdfs');

// PDF 디렉토리 확인 및 생성
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// 임시 저장소 (실제 프로젝트에서는 데이터베이스 사용 권장)
const analysisResults = {};

/**
 * URL 분석 요청 처리
 */
exports.analyzeUrls = async (req, res) => {
  try {
    const { urlA, urlB } = req.body;
    
    // 입력 검증
    if (!urlA || !urlB) {
      return res.status(400).json({ 
        success: false, 
        message: '두 개의 URL이 필요합니다.' 
      });
    }
    
    // 작업 ID 생성
    const jobId = uuidv4();
    
    // 비동기 분석 시작 (백그라운드 작업)
    analysisResults[jobId] = { 
      status: 'processing',
      startTime: new Date(),
      urls: { urlA, urlB }
    };
    
    // 비동기로 분석 작업 실행
    analyzerService.analyzeCompetitors(urlA, urlB)
      .then(result => {
        analysisResults[jobId] = {
          ...analysisResults[jobId],
          status: 'completed',
          completedTime: new Date(),
          result
        };
      })
      .catch(error => {
        analysisResults[jobId] = {
          ...analysisResults[jobId],
          status: 'failed',
          error: error.message
        };
      });
    
    // 작업 ID 반환
    res.status(202).json({
      success: true,
      message: '분석이 시작되었습니다.',
      jobId
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 분석 결과 조회
 */
exports.getResult = (req, res) => {
  try {
    const { jobId } = req.params;
    
    // 작업 ID 검증
    if (!jobId || !analysisResults[jobId]) {
      return res.status(404).json({
        success: false,
        message: '해당 작업을 찾을 수 없습니다.'
      });
    }
    
    const result = analysisResults[jobId];
    
    // 상태에 따른 응답
    if (result.status === 'processing') {
      return res.status(200).json({
        success: true,
        status: 'processing',
        message: '분석이 진행 중입니다.'
      });
    }
    
    if (result.status === 'failed') {
      return res.status(500).json({
        success: false,
        status: 'failed',
        message: '분석 중 오류가 발생했습니다.',
        error: result.error
      });
    }
    
    // 완료된 결과 반환
    res.status(200).json({
      success: true,
      status: 'completed',
      data: result.result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * PDF 형식으로 분석 결과 내보내기
 */
exports.exportPdf = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // 작업 ID 검증
    if (!jobId || !analysisResults[jobId]) {
      return res.status(404).json({
        success: false,
        message: '해당 작업을 찾을 수 없습니다.'
      });
    }
    
    const result = analysisResults[jobId];
    
    // 상태 확인
    if (result.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 분석 결과만 PDF로 내보낼 수 있습니다.'
      });
    }
    
    // PDF 파일명 생성
    const timestamp = new Date().getTime();
    const pdfFileName = `analysis_${jobId}_${timestamp}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFileName);
    
    // PDF 생성
    await pdfGenerator.generatePDF(result.result, pdfPath);
    
    // PDF 파일 URL 생성
    const pdfUrl = `/pdfs/${pdfFileName}`;
    
    // 응답
    res.status(200).json({
      success: true,
      message: 'PDF가 생성되었습니다.',
      pdfUrl
    });
    
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'PDF 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};
