# SSE 기능 테스트를 위한 미니 프로젝트 입니다

### event-source-polyfill 설치가 필요 합니다
npm install event-source-polyfill
npm i --save-dev @types/event-source-polyfill


### 로그인 버튼
로그인 API 호출
SSE 연결 API 호출

### 디스커넥트 버튼
SSE 연결종료 API 호출

### 메시지 버튼
MESSAGE API 호출(연결된 이후 메시지가 전달되는지 기능 테스트를 위한 API입니다)

### 기타 참고 사항
SSE 연결의 만료시간이 45초로 되어있으며 다음의 파일을 열어서 확인할 수 있습니다.
node_modules\event-source-polyfill\src\eventsource.js
var heartbeatTimeout = parseDuration(options.heartbeatTimeout, 45000);
