import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Onboarding from './Onboarding';
import PostJob from './PostJob'; // 新增
import Profile from './Profile'; // 新增
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2, Plus, AlertTriangle, ShieldAlert } from 'lucide-react';

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

const Header = ({ onOpenProfile }) => (
  <div style={{height: '56px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 40, borderBottom: '1px solid #eee', padding: '0 16px', maxWidth: '450px', left: '50%', transform: 'translateX(-50%)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
      <div style={{padding: '6px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex'}}>
        <Hammer size={18} />
      </div>
      <span style={{fontSize: '18px', fontWeight: 'bold', color: '#111'}}>KiwiBlue</span>
    </div>
    {/* 个人中心入口 */}
    <button onClick={onOpenProfile} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
      <User size={20} />
    </button>
  </div>
);

const Avatar = ({ type }) => (
  <div style={{width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af'}}>
    {type === 'boss' ? <Building2 size={80} /> : <User size={80} />}
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [userProfile, setUserProfile] = useState(null); 
  
  // 页面状态
  const [showPostJob, setShowPostJob] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // 数据状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([]); // 统一叫 cards，不管里面是人还是工作
  const [loadingData, setLoadingData] = useState(false);

  // 1. 检查 Session & Profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
    setLoadingSession(false);
  }

  // 2. 抓取数据 (核心逻辑)
  const fetchData = async () => {
    if (!session || !userProfile) return;
    setLoadingData(true);
    
    // 如果我是工友 -> 我看 jobs 表
    if (userProfile.role === 'worker') {
      const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      setCards(data || []);
    } 
    // 如果我是老板 -> 我看 profiles 表 (只看 worker)
    else {
      const { data } = await supabase.from('profiles')
        .select('*')
        .eq('role', 'worker')
        .neq('status', 'busy') // 不看忙碌的
        .order('created_at', { ascending: false });
      setCards(data || []);
    }
    setLoadingData(false);
  };

  // 当资料加载好，或者发完新帖后，重新抓取数据
  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setShowProfile(false);
  };

  const handleSwipe = (direction) => {
    if (direction === 'right') alert("感兴趣！(未来接通扣费)");
    if (currentIndex < cards.length) setCurrentIndex(curr => curr + 1);
  };

  // === 渲染逻辑 ===

  if (loadingSession) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!session) return <Login />;
  if (!userProfile) return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;

  // 弹窗层
  if (showPostJob) return <PostJob session={session} onClose={() => setShowPostJob(false)} onPostSuccess={fetchData} />;
  if (showProfile) return <Profile session={session} userProfile={userProfile} onClose={() => setShowProfile(false)} onLogout={handleLogout} />;

  // 刷完了
  const currentCard = cards[currentIndex];

  if (loadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (!currentCard) {
    return (
      <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">刷完了</h2>
        <p className="text-gray-500 mt-2 mb-6">暂时没有更多匹配。</p>
        <button onClick={() => setCurrentIndex(0)} className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium">从头再刷一次</button>
        
        {/* 老板特权按钮 */}
        {userProfile.role === 'boss' && (
           <button onClick={() => setShowPostJob(true)} className="mt-8 flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-6 py-3 rounded-xl">
             <Plus size={20} /> 发布新招工
           </button>
        )}
      </div>
    );
  }

  // 区分显示内容
  const isViewingJob = userProfile.role === 'worker'; // 我是工友，正在看工作
  // 核心隐私保护：如果我是老板看工人，隐藏手机号
  const displayTitle = isViewingJob ? currentCard.title : currentCard.intro?.split(' ')[0] || "工友"; // 标题显示工种
  const displaySub = isViewingJob ? "招聘方" : currentCard.name; // 副标题显示名字
  const displayPrice = isViewingJob ? currentCard.wage : `${currentCard.intro?.split(' ')?.[1] || '-'}`; // 价格
  const displayTags = currentCard.tags || (currentCard.intro ? [currentCard.experience || '经验不限'] : []);

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 relative font-sans overflow-hidden">
      <Header onOpenProfile={() => setShowProfile(true)} />

      <div className="px-4 mt-[60px] h-[calc(100vh-160px)] flex flex-col justify-center">
        <div style={cardStyle}>
          {/* 上半部分 */}
          <div className="h-3/5 relative bg-gray-200">
            <Avatar type={isViewingJob ? 'boss' : 'worker'} />
            
            {/* 隐私遮罩 (老板看工人时显示) */}
            {!isViewingJob && (
               <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                 <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm flex gap-1">
                   <Lock size={14} /> 联系方式已隐藏
                 </div>
               </div>
            )}

            {currentCard.location && (
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <MapPin size={12} /> {currentCard.location}
              </div>
            )}
          </div>

          {/* 下半部分 */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{displayTitle}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-lg font-medium">{displaySub}</p>
                  {/* 简单的认证标 */}
                  {currentCard.is_verified ? <ShieldCheck size={16} className="text-green-500" /> : null}
                </div>
              </div>
              <div className="text-blue-600 font-bold text-2xl tracking-tight">{displayPrice}</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {Array.isArray(displayTags) && displayTags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="mt-auto pt-4 flex items-center text-gray-400 text-sm">
               <p>左右滑动以选择</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部按钮 */}
      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-10 flex items-center justify-between z-10">
        <button onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-red-500">
          <X size={32} />
        </button>
        <button onClick={() => handleSwipe('right')} className="w-16 h-16 rounded-full bg-blue-600 shadow-xl shadow-blue-200 flex items-center justify-center text-white">
          {isViewingJob ? <Heart size={32} fill="white" /> : <DollarSign size={32} />}
        </button>
      </div>

      {/* 老板的悬浮发帖按钮 */}
      {userProfile.role === 'boss' && (
        <button 
          onClick={() => setShowPostJob(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-105 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

export default App;
