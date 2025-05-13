/**
 * DOM 파서 유틸리티
 * 웹 페이지에서 기능 요소를 탐지하는 함수들을 제공합니다.
 */

/**
 * 페이지에서 기능 요소 탐지
 * @param {Page} page - Puppeteer 페이지 객체
 * @returns {Object} 탐지된 기능 목록
 */
exports.detectFeatures = async (page) => {
  // 페이지 내에서 기능 탐지 스크립트 실행
  const features = await page.evaluate(() => {
    return {
      // 검색 기능
      searchBar: !!document.querySelector(
        'input[type="search"], input[placeholder*="검색"], input[placeholder*="search"], [aria-label*="검색"], [aria-label*="search"]'
      ),
      
      // 필터 기능
      filter: !!document.querySelector(
        '.filter, [data-filter], select, [role="listbox"], [aria-label*="필터"], [aria-label*="filter"]'
      ),
      
      // 정렬 기능
      sort: !!document.querySelector(
        '.sort, [data-sort], [aria-label*="정렬"], [aria-label*="sort"]'
      ),
      
      // 좋아요/찜 기능
      favorite: !!document.querySelector(
        '[class*="wish"], [class*="like"], [class*="favorite"], [aria-label*="찜"], [aria-label*="좋아요"]'
      ),
      
      // 장바구니 기능
      cart: !!document.querySelector(
        '[class*="cart"], [class*="basket"], [aria-label*="장바구니"], [aria-label*="cart"]'
      ),
      
      // 로그인/회원가입 기능
      login: !!document.querySelector(
        '[href*="login"], [href*="signin"], [class*="login"], [class*="signin"], [aria-label*="로그인"]'
      ),
      
      // 메뉴/네비게이션
      navigation: !!document.querySelector(
        'nav, [role="navigation"], .menu, .nav, #menu, #nav'
      ),
      
      // 페이지네이션
      pagination: !!document.querySelector(
        '.pagination, [aria-label*="페이지"], [role="navigation"][aria-label*="페이지"], ul.pages'
      ),
      
      // 공유 기능
      share: !!document.querySelector(
        '[class*="share"], [aria-label*="공유"], [aria-label*="share"]'
      ),
      
      // 리뷰/평점 기능
      review: !!document.querySelector(
        '[class*="review"], [class*="rating"], [aria-label*="리뷰"], [aria-label*="평점"]'
      )
    };
  });
  
  return features;
};

/**
 * URL에서 주요 페이지 경로 추출
 * @param {string} url - 대상 URL
 * @returns {Array} 주요 페이지 경로 목록
 */
exports.detectMainPages = (url) => {
  // 기본 주요 페이지 경로
  const mainPages = [
    { name: 'home', path: '/' },
    { name: 'search', path: '/search' },
    { name: 'product', path: '/product' }
  ];
  
  // TODO: URL 구조 분석을 통한 추가 페이지 탐지 로직 구현
  
  return mainPages;
};
