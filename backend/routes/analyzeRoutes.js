const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');

// URL 분석 요청 라우트
router.post('/analyze', analyzeController.analyzeUrls);

// 분석 결과 조회 라우트
router.get('/result/:jobId', analyzeController.getResult);

// PDF 내보내기 라우트
router.get('/export-pdf/:jobId', analyzeController.exportPdf);

module.exports = router;
