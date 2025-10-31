import logo from './asset/logo.svg';
import './App.css';


function App() {
  return (
    <div className="App">
      <div class="admin">
        <a href='./admin'><span>관리자 메뉴</span></a>
      </div>
      <div class="account-manage">
        <span><a href='./login'>로그인</a></span>
        <span><a href="./logout">로그아웃</a></span>
      </div>
      <div class="home">
        <h1><a href='./'>A.I.I</a></h1>
      </div>
      <ul class="menu-bar">
        <li><a href="./jobs">직군</a></li>
        <li><a>1</a></li>
        <li><a>2</a></li>
        <li><a>3</a></li>
        <li><a>4</a></li>
      </ul>
      <div class="chat">
        <div class="ai-side"><p>ai side chat</p></div>
        <div class="user-side"><p>user side chat</p></div>
      </div>
      <jobs />
    </div>
    
  );
}

export default App;
