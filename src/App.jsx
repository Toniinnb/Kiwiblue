import React, { useState } from 'react';
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign } from 'lucide-react';

// 样式补丁：因为没有配置 Tailwind 编译，我们手动定义一些样式
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

// === 组件区 ===
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

// === 假数据 ===
const MOCK_WORKERS = [
  { id: 1, name: "老王 (Wang)", role: "木工大工", rate: "$35/hr", location: "Albany", dist: "3.5km", tags: ["有车", "有工具", "SiteSafe"], verified: true, type: 'worker' },
  { id: 2, name: "Alex Chen", role: "油漆中工", rate: "$28/hr", location: "Glenfield", dist: "5.2km", tags: ["有车", "勤快"], verified: false, type: 'worker' },
];

const MOCK_JOBS = [
  { id: 101, title: "北岸工地招中工", company: "Fletcher (分包)", rate: "$30/hr", location: "Rosedale", type: 'boss', badge: 'employer' },
];

function App() {
  const [userRole, setUserRole] = useState('boss'); 
  const [currentIndex, setCurrentIndex] = useState(0);

  const deck = userRole === 'boss' ? MOCK_WORKERS : MOCK_JOBS;
  const currentCard = deck[currentIndex];

  const handleSwipe = (direction) => {
    if (direction === 'right') alert(userRole === 'boss' ? "已解锁联系方式！" : "已发送意向！");
    if (currentIndex < deck.length) setCurrentIndex(curr => curr + 1);
  };

  if (currentIndex >= deck.length) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif'}}>
        <div style={{color: '#9ca3af', marginBottom: '16px'}}><CheckCircle2 size={64} /></div>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937'}}>附近的人刷完了</h2>
        <button onClick={() => setCurrentIndex(0)} style={{marginTop: '20px', padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '99px', fontSize: '16px'}}>再刷一次</button>
        <button onClick={() => { setUserRole(r => r === 'boss' ? 'worker' : 'boss'); setCurrentIndex(0); }} style={{marginTop: '40px', color: '#9ca3af', border: 'none', background: 'none', textDecoration: 'underline'}}>切换身份测试</button>
      </div>
    );
  }

  return (
    <div style={{maxWidth: '450px', margin: '0 auto', height: '100vh', background: '#f3f4f6', position: 'relative', fontFamily: 'sans-serif'}}>
      <Header />

      <div style={{padding: '16px', marginTop: '60px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={cardStyle}>
          {/* 上半部分 */}
          <div style={{height: '60%', position: 'relative'}}>
            <Avatar type={currentCard.type} />
            {currentCard.dist && <div style={{position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}><MapPin size={12} /> {currentCard.dist}</div>}
            {currentCard.badge === 'employer' && <div style={{position: 'absolute', top: '16px', right: '16px', background: '#2563EB', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold'}}>企业直招</div>}
          </div>

          {/* 下半部分 */}
          <div style={{flex: 1, padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'between', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <h2 style={{fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111'}}>{userRole === 'boss' ? currentCard.role : currentCard.title}</h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                  <p style={{fontSize: '18px', color: '#6b7280', margin: 0}}>{userRole === 'boss' ? currentCard.name : currentCard.company}</p>
                  {currentCard.verified && <ShieldCheck size={18} color="#22c55e" />}
                </div>
              </div>
              <div style={{color: '#2563EB', fontSize: '24px', fontWeight: 'bold'}}>{currentCard.rate}</div>
            </div>

            <div style={{display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap'}}>
              {currentCard.tags && currentCard.tags.map((tag, i) => (
                <span key={i} style={{padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '14px', fontWeight: '600'}}>{tag}</span>
              ))}
            </div>

            <div style={{marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px'}}>
              <MapPin size={14} style={{marginRight: '4px'}} /> {currentCard.location}
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
