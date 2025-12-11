/**
 * 네이버 지도 설정 체크리스트 자동 확인 스크립트
 * 
 * 사용법: node scripts/check-naver-map-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 네이버 지도 설정 체크리스트 확인 중...\n');

const checks = {
  envFile: false,
  envVar: false,
  devServer: false,
  apiKey: false,
};

// 1. .env.local 파일 확인
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  checks.envFile = true;
  console.log('✅ [1/5] .env.local 파일이 존재합니다.');
  
  // 2. NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경 변수 확인
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const envVarMatch = envContent.match(/NEXT_PUBLIC_NAVER_MAP_CLIENT_ID\s*=\s*([^\s#]+)/);
  
  if (envVarMatch && envVarMatch[1] && envVarMatch[1] !== 'your_naver_map_client_id') {
    checks.envVar = true;
    checks.apiKey = true;
    const keyPreview = envVarMatch[1].substring(0, 10) + '...';
    console.log(`✅ [2/5] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되어 있습니다. (${keyPreview})`);
  } else {
    console.log('❌ [2/5] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았거나 기본값입니다.');
    console.log('   💡 .env.local 파일에 다음을 추가하세요:');
    console.log('   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id');
  }
} else {
  console.log('❌ [1/5] .env.local 파일이 없습니다.');
  console.log('   💡 프로젝트 루트에 .env.local 파일을 생성하세요.');
}

// 3. 개발 서버 실행 확인 (프로세스 확인)
console.log('\n📋 [3/5] 개발 서버 실행 확인:');
console.log('   💡 다음 명령어로 개발 서버를 실행하세요:');
console.log('   pnpm dev');
console.log('   또는 이미 실행 중이라면 브라우저에서 http://localhost:3000 을 확인하세요.');

// 4. 브라우저 콘솔 확인 안내
console.log('\n📋 [4/5] 브라우저 콘솔 확인:');
console.log('   💡 브라우저 개발자 도구(F12)를 열고 콘솔 탭에서 다음을 확인하세요:');
console.log('   - "✅ 네이버 지도 API 로드 성공" 메시지');
console.log('   - "🗺️ 지도 초기화 시작" 메시지');
console.log('   - 에러 메시지가 있다면 내용을 확인하세요.');

// 5. 네이버 클라우드 플랫폼 설정 확인 안내
console.log('\n📋 [5/5] 네이버 클라우드 플랫폼 설정 확인:');
console.log('   💡 다음 사항을 확인하세요:');
console.log('   1. 네이버 클라우드 플랫폼 콘솔에서 Maps API가 활성화되어 있는지');
console.log('   2. API 키의 도메인 설정에 localhost가 포함되어 있는지');
console.log('   3. API 키가 유효한지 (만료되지 않았는지)');
console.log('   📖 참고: https://www.ncloud.com/product/applicationService/maps');

// 요약
console.log('\n' + '='.repeat(50));
console.log('📊 체크리스트 요약:');
console.log('='.repeat(50));
console.log(`[${checks.envFile ? '✅' : '❌'}] .env.local 파일 존재`);
console.log(`[${checks.envVar ? '✅' : '❌'}] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 설정`);
console.log(`[${checks.apiKey ? '✅' : '❌'}] API 키가 기본값이 아님`);
console.log(`[📋] 개발 서버 실행 확인 (수동)`);
console.log(`[📋] 브라우저 콘솔 확인 (수동)`);
console.log(`[📋] 네이버 클라우드 플랫폼 설정 확인 (수동)`);

if (checks.envFile && checks.envVar && checks.apiKey) {
  console.log('\n✅ 자동 확인 가능한 항목이 모두 통과했습니다!');
  console.log('   다음 단계: 개발 서버를 재시작하고 브라우저 콘솔을 확인하세요.');
} else {
  console.log('\n⚠️ 일부 항목이 설정되지 않았습니다. 위의 안내를 따라 설정하세요.');
}

