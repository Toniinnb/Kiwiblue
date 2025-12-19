import React, { useState, useEffect } from 'react';
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2 } from 'lucide-react';
// 关键点：引入我们刚才建立的连接文件
import { supabase } from './supabase';

// 样式补丁
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

// === 假数据 (保留给老板看，因为目前只插入了招工数据) ===
const MOCK_WORKERS = [
  { id: 1, name: "老王 (Wang)", role: "木工大工", rate: "$35/hr", location: "Albany", dist: "3.5km", tags: ["有车", "有工具", "SiteSafe"], verified: true, type: 'worker' },
  { id: 2, name: "Alex Chen", role: "油漆中工", rate: "$28/hr", location: "Glenfield", dist: "5.2km", tags: ["有车", "勤快"], verified: false, type: 'worker' },
];

function App() {
  // 默认改为 'worker' (我是工友)，这样您一进来就能看到从数据库读出来的招工贴
  const [userRole, setUserRole] = useState('worker'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 新增：用来存从 Supabase 读出来的真实数据
  const [realJobs, setRealJobs] = useState([]);
  // 新增：加载状态
  const [loading, setLoading] = useState(false);

  // === 核心逻辑：从数据库抓取数据 ===
  useEffect(() => {
    // 定义抓取函数
    async function fetchJobs() {
      if (userRole === 'worker') {
        setLoading(true);
        // 去 jobs 表里查所有数据
        const { data, error } = await supabase.from('jobs').select('*');
        
        if (error) {
          console.error('抓取失败:', error);
          alert('连不上数据库，请检查 supabase.js 配置');
        } else {
          console.log('抓取成功:', data);
          setRealJobs(data || []);
        }
        setLoading(false);
      }
    }

    fetchJobs();
  }, [userRole]); // 当身份切换时，重新触发

  // 决定显示哪副牌
  // 如果是工友，看 realJobs；如果是老板，看 MOCK_WORKERS (因为还没做工人的真实入库)
  const deck = userRole === 'boss' ? MOCK_WORKERS : realJobs;
  const currentCard = deck[currentIndex];

  const handleSwipe = (direction) => {
    if (direction === 'right') alert(userRole === 'boss' ? "已解锁联系方式！" : "已发送意向！");
    if (currentIndex < deck.length) setCurrentIndex(curr => curr + 1);
  };

  // 如果正在加载，显示转圈圈
  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280'}}>
        <Loader2 className="animate-spin" size={48} />
        <p style={{marginTop: '16px'}}>正在寻找附近的工作...</p>
      </div>
    );
  }

  // 刷完了
  if (!currentCard) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif'}}>
        <div style={{color: '#9ca3af', marginBottom: '16px'}}><CheckCircle2 size={64} /></div>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937'}}>暂时没有更多卡片</h2>
        <button onClick={() => setCurrentIndex(0)} style={{marginTop: '20px', padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '99px', fontSize: '16px'}}>从头再刷一次</button>
        <button onClick={() => { setUserRole(r => r === 'boss' ? 'worker' : 'boss'); setCurrentIndex(0); }} style={{marginTop: '40px', color: '#9ca3af', border: 'none', background: 'none', textDecoration: 'underline'}}>
          切换身份: {userRole === 'boss' ? '老板(看工人)' : '工友(看工作)'}
        </button>
      </div>
    );
  }

  return (
    <div style={{maxWidth: '450px', margin: '0 auto', height: '100vh', background: '#f3f4f6', position: 'relative', fontFamily: 'sans-serif'}}>
      <Header />

      <div style={{padding: '16px', marginTop: '60px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={cardStyle}>
          {/* 上半部分：头像区 */}
          <div style={{height: '60%', position: 'relative'}}>
            <Avatar type={userRole === 'boss' ? 'worker' : 'boss'} />
            
            {/* 如果有位置信息，显示出来 */}
            {(currentCard.location || currentCard.dist) && (
              <div style={{position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                <MapPin size={12} /> {currentCard.location || currentCard.dist}
              </div>
            )}
            
            {/* 招工贴显示直招标签 */}
            {userRole === 'worker' && (
              <div style={{position: 'absolute', top: '16px', right: '16px', background: '#2563EB', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold'}}>
                热门急招
              </div>
            )}
          </div>

          {/* 下半部分：文字信息区 */}
          <div style={{flex: 1, padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                {/* 这里的逻辑兼容了假数据和数据库真实数据 */}
                <h2 style={{fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111'}}>
                  {userRole === 'boss' ? currentCard.role : currentCard.title}
                </h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                  <p style={{fontSize: '18px', color: '#6b7280', margin: 0}}>
                    {userRole === 'boss' ? currentCard.name : "企业/雇主"}
                  </p>
                  {/* 如果是真实数据，我们假设通过审核 */}
                  <ShieldCheck size={18} color="#22c55e" />
                </div>
              </div>
              <div style={{color: '#2563EB', fontSize: '24px', fontWeight: 'bold'}}>
                {userRole === 'boss' ? currentCard.rate : currentCard.wage}
              </div>
            </div>

            {/* 标签显示区 */}
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
