const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const analyzeRoutes = require('./routes/analyzeRoutes');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 라우트
app.use('/api', analyzeRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
