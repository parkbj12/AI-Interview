import logo from '../asset/logo.svg';
import '../css/App.css';


function App() {
  return (
    <div className="App">
      <div class="admin">
        <a href='admin'><span>관리자 메뉴</span></a>
      </div>
      <div class="account-manage">
        <span><a href='register'>회원가입</a></span>
        <span><a href="logout">로그아웃</a></span>
        <span><a href='login'>로그인</a></span>
      </div>
      <div class="home">
        <h1><a href='./'>A.I.I</a></h1>
      </div>
      <ul class="menu-bar">
        <li><span class="menu-item"><a href="../video_interview">AI 모의 영상 면접</a></span></li>
        <li><span class="menu-item"><a href="../result">결과보기</a></span></li>
        <li><span class="menu-item"><a href="../history">기록보기</a></span></li>
        <li><span class="menu-item"><a href="../profile">내 프로필</a></span></li>
        <li><span class="menu-item"><a href='../board'>자유게시판</a></span></li>
      </ul>
      <div class="recommand-box">
        <h3>추천 직군</h3>
        <div class="recommandation">
          <ol>
            <li class="job-type"><span class="job-name">개발자</span>
            <span class="dash-deco">--------------------------------------------------</span>
            <span><a href='../video_inteview/developer'>면접 보기</a></span></li>
          </ol>
        </div>
      </div>
      <jobs />
    </div>
    
  );
}

export default App;
