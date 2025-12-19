import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login'; // 引入刚才写的登录页
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2 } from 'lucide-react';

// ... (此处省略样式 cardStyle, Header, Avatar 组件代码，请保持原样，为了篇幅我不重复贴了，您只需要把下面 function App() 里的逻辑改了) ...
// 为了方便您复制，我还是给您完整的 App.jsx 吧，防止出错。

const cardStyle = {
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  borderRadius: '1.5rem',
  background: 'white',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '65vh',
  width: '100%'
};

const Header = () => (
  <div style={{height: '56px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid #eee'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
      <div style={{padding: '6px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex'}}>
        <Hammer size={18} />
      </div>
      <span style={{fontSize: '18px', fontWeight: 'bold', color: '#111'}}>KiwiBlue</span>
    </div>
  </div>
);

const Avatar = ({ type }) => (
  <div style={{width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af'}}>
    {type === 'boss' ? <Building2 size={80} /> : <User size={80} />}
  </div>
);

// 假数据保留做备用
const MOCK_WORKERS = [
  { id: 1, name: "老王 (Wang)", role: "木工大工", rate: "$35/hr", location: "Albany", dist: "3.5km", tags: ["有车", "有工具", "SiteSafe"], verified: true, type: 'worker' },
];

function App() {
  // === 1. 新增：用户会话状态 ===
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // === 2. 检查是否登录 ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    // 监听登录/登出变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 原有的状态
  const [userRole, setUserRole] = useState('worker'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [realJobs, setRealJobs] = useState([]);
  const [loadingData, setLoadingData] = useState(false); // 改名防止冲突

  // === 3. 数据抓取逻辑 (保持不变) ===
  useEffect(() => {
    async function fetchJobs() {
      if (userRole === 'worker' && session) { // 只有登录了才抓取
        setLoadingData(true);
        const { data, error } = await supabase.from('jobs').select('*');
        if (!error) setRealJobs(data || []);
        setLoadingData(false);
      }
    }
    fetchJobs();
  }, [userRole, session]);

  // === 4. 如果还在检查登录状态，显示白屏或加载 ===
  if (loadingSession) return null;

  // === 5. 关键：如果没有登录，显示 Login 组件，而不是主界面 ===
  if (!session) {
    return <Login />;
  }

  // --- 以下是原本的主界面逻辑 (LoggedIn View) ---

  const deck = userRole === 'boss' ? MOCK_WORKERS : realJobs;
  const currentCard = deck[currentIndex];

  const handleSwipe = (direction) => {
    if (direction === 'right') alert("感兴趣！");
    if (currentIndex < deck.length) setCurrentIndex(curr => curr + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 数据加载中
  if (loadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // 刷完了
  if (!currentCard) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif'}}>
        <div style={{color: '#9ca3af', marginBottom: '16px'}}><CheckCircle2 size={64} /></div>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937'}}>暂时没有更多卡片</h2>
        <button onClick={() => setCurrentIndex(0)} style={{marginTop: '20px', padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '99px', fontSize: '16px'}}>从头再刷一次</button>
        <button onClick={handleLogout} style={{marginTop: '40px', color: '#ef4444', border: 'none', background: 'none', fontWeight: 'bold'}}>退出登录</button>
      </div>
    );
  }

  return (
    <div style={{maxWidth: '450px', margin: '0 auto', height: '100vh', background: '#f3f4f6', position: 'relative', fontFamily: 'sans-serif'}}>
      <Header />
      
      {/* 这是一个临时的登出按钮，方便测试 */}
      <button onClick={handleLogout} style={{position: 'fixed', top: '14px', right: '10px', zIndex: 60, fontSize: '12px', color: '#666'}}>退出</button>

      <div style={{padding: '16px', marginTop: '60px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={cardStyle}>
          <div style={{height: '60%', position: 'relative'}}>
            <Avatar type={userRole === 'boss' ? 'worker' : 'boss'} />
            {(currentCard.location || currentCard.dist) && (
              <div style={{position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                <MapPin size={12} /> {currentCard.location || currentCard.dist}
              </div>
            )}
          </div>

          <div style={{flex: 1, padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <h2 style={{fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111'}}>
                  {userRole === 'boss' ? currentCard.role : currentCard.title}
                </h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                  <p style={{fontSize: '18px', color: '#6b7280', margin: 0}}>
                    {userRole === 'boss' ? currentCard.name : "企业直招"}
                  </p>
                  <ShieldCheck size={18} color="#22c55e" />
                </div>
              </div>
              <div style={{color: '#2563EB', fontSize: '24px', fontWeight: 'bold'}}>
                {userRole === 'boss' ? currentCard.rate : currentCard.wage}
              </div>
            </div>

            <div style={{display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap'}}>
              {currentCard.tags && currentCard.tags.map((tag, i) => (
                <span key={i} style={{padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '14px', fontWeight: '600'}}>{tag}</span>
              ))}
            </div>
            
            <div style={{marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px'}}>
               <p>左右滑动以选择</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{position: 'fixed', bottom: '24px', left: 0, right: 0, maxWidth: '450px', margin: '0 auto', padding: '0 40px', display: 'flex', justifyContent: 'space-between', zIndex: 10}}>
        <button onClick={() => handleSwipe('left')} style={{width: '64px', height: '64px', borderRadius: '50%', background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer'}}><X size={32} /></button>
        <button onClick={() => handleSwipe('right')} style={{width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', border: 'none', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer'}}>{userRole === 'boss' ? <DollarSign size={32} /> : <Heart size={32} />}</button>
      </div>
    </div>
  );
}

export default App;
