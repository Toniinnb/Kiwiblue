import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Onboarding from './Onboarding';
import PostJob from './PostJob'; 
import Profile from './Profile'; 
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2, Plus, Lock, Flame, Crown } from 'lucide-react';

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
  const [showPostJob, setShowPostJob] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([]); 
  const [loadingData, setLoadingData] = useState(false);

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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setUserProfile(data);
    setLoadingSession(false);
  }

  const fetchData = async () => {
    if (!session || !userProfile) return;
    setLoadingData(true);
    try {
      if (userProfile.role === 'worker') {
        const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        setCards(data || []);
      } else {
        const { data: unlocked } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
        const unlockedIds = unlocked ? unlocked.map(u => u.worker_id) : [];
        let query = supabase.from('profiles').select('*').eq('role', 'worker').neq('status', 'busy').order('updated_at', { ascending: false });
        if (unlockedIds.length > 0) {
          query = query.not('id', 'in', `(${unlockedIds.join(',')})`);
        }
        const { data } = await query;
        setCards(data || []);
      }
    } catch (error) { console.error(error); }
    setLoadingData(false);
  };

  useEffect(() => { fetchData(); }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // === 计算是否 VIP ===
  const isVip = () => {
    if (!userProfile?.vip_expiry) return false;
    return new Date(userProfile.vip_expiry) > new Date(); // 过期时间大于现在
  };

  const calculateCost = (card) => {
    if (!card.experience) return 1; 
    const match = card.experience.match(/(\d+)/); 
    if (match) {
      let years = parseInt(match[0], 10);
      if (years > 10) years = 10; 
      if (years < 1) years = 1;   
      return years;
    }
    return 1; 
  };

  const handleSwipe = async (direction) => {
    const currentCard = cards[currentIndex];
    
    if (direction === 'left') {
      setCurrentIndex(curr => curr + 1);
      return;
    }

    if (direction === 'right') {
      // === 场景 A: 工友滑工作 (无感交互) ===
      if (userProfile.role === 'worker') {
        // 不弹窗，直接后台记录，滑走
        supabase.from('jobs').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);
        setCurrentIndex(curr => curr + 1);
        return;
      } 
      
      // === 场景 B: 老板滑工友 (VIP逻辑) ===
      else if (userProfile.role === 'boss') {
        
        // 1. 如果是 VIP，直接起飞
        if (isVip()) {
           // 不扣费，不确认，直接解锁
           await supabase.from('contacts').insert({ boss_id: session.user.id, worker_id: currentCard.id });
           await supabase.from('profiles').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);
           
           // VIP 提示可以更轻一点，甚至不提示，这里为了反馈感保留一个小提示
           // alert("👑 VIP 自动解锁成功！"); 
           // 甚至连这个alert也可以去掉，直接滑走，老板体验更爽
           
           checkProfile(session.user.id);
           setCurrentIndex(curr => curr + 1);
           return;
        }

        // 2. 如果是普通老板，走原来的扣费逻辑
        const cost = calculateCost(currentCard);
        const confirmUnlock = window.confirm(`经验：${currentCard.experience || '入门'}，解锁需扣 ${cost} 币。\n余额：${userProfile.credits || 0}\n确认解锁？`);
        
        if (!confirmUnlock) return; 

        if ((userProfile.credits || 0) < cost) {
          alert("❌ 余额不足，请充值或开通 VIP 无限刷！");
          return;
        }

        const { error: creditError } = await supabase.from('profiles').update({ credits: userProfile.credits - cost }).eq('id', session.user.id);
        if (creditError) return alert("交易失败");

        await supabase.from('contacts').insert({ boss_id: session.user.id, worker_id: currentCard.id });
        await supabase.from('profiles').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);

        alert("🔓 解锁成功！请去个人中心查看详情。");
        checkProfile(session.user.id);
        setCurrentIndex(curr => curr + 1);
      }
    }
  };

  const EmergencyLogout = () => (
    <button onClick={handleLogout} className="fixed top-20 right-4 z-50 bg-red-100 text-red-500 text-xs px-2 py-1 rounded border border-red-200 opacity-50 hover:opacity-100">强制登出</button>
  );

  if (loadingSession) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!session) return <Login />;
  if (!userProfile) return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;
  if (showPostJob) return <PostJob session={session} onClose={() => setShowPostJob(false)} onPostSuccess={fetchData} />;
  if (showProfile) return <Profile session={session} userProfile={userProfile} onClose={() => setShowProfile(false)} onLogout={handleLogout} onProfileUpdate={() => checkProfile(session.user.id)} />;

  const currentCard = cards[currentIndex];

  if (loadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (!currentCard) {
    return (
      <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <EmergencyLogout />
        <Header onOpenProfile={() => setShowProfile(true)} />
        <CheckCircle2 size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">刷完了</h2>
        <p className="text-gray-500 mt-2 mb-6">暂时没有更多匹配。</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => { setCurrentIndex(0); fetchData(); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200">
            刷新看看
          </button>
          <button onClick={() => setShowProfile(true)} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">
            进入个人中心
          </button>
        </div>

        {userProfile.role === 'boss' && (
           <button onClick={() => setShowPostJob(true)} className="mt-8 flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-6 py-3 rounded-xl">
             <Plus size={20} /> 发布新招工
           </button>
        )}
      </div>
    );
  }

  const isViewingJob = userProfile.role === 'worker';
  const displayTitle = isViewingJob ? (currentCard.title || "招工") : (currentCard.intro?.split(' ')?.[0] || "工友");
  const displaySub = isViewingJob ? "招聘方" : (currentCard.name || "匿名");
  const displayPrice = isViewingJob ? (currentCard.wage || "面议") : (currentCard.intro?.split(' ')?.[1] || "面议");
  const displayTags = currentCard.tags || (currentCard.experience ? [currentCard.experience] : []);
  const popularity = currentCard.popularity || 0;
  
  // VIP 状态检查
  const userIsVip = isVip();

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 relative font-sans overflow-hidden">
      <EmergencyLogout />
      <Header onOpenProfile={() => setShowProfile(true)} />

      <div className="px-4 mt-[60px] h-[calc(100vh-160px)] flex flex-col justify-center">
        <div style={cardStyle}>
          <div className="h-3/5 relative bg-gray-200">
            <Avatar type={isViewingJob ? 'boss' : 'worker'} />
            {!isViewingJob && (
               <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                 {userIsVip ? (
                   <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 animate-pulse">
                     <Crown size={16} fill="currentColor" /> VIP 免扣费查看
                   </div>
                 ) : (
                   <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm flex gap-1">
                     <Lock size={14} /> 联系方式已隐藏
                   </div>
                 )}
               </div>
            )}
            {currentCard.location && (
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <MapPin size={12} /> {currentCard.location}
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-orange-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
               <Flame size={12} fill="white" /> {popularity} 人感兴趣
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{displayTitle}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-lg font-medium">{displaySub}</p>
                  {currentCard.is_verified ? <ShieldCheck size={16} className="text-green-500" /> : null}
                </div>
              </div>
              <div className="text-blue-600 font-bold text-2xl tracking-tight">{displayPrice}</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {displayTags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="mt-auto pt-4 flex items-center text-gray-400 text-sm">
               <p>{isViewingJob ? '右滑发送意向 (无弹窗)' : userIsVip ? '👑 VIP 右滑直接查看' : '右滑解锁联系方式'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-10 flex items-center justify-between z-10">
        <button onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-red-500">
          <X size={32} />
        </button>
        <button onClick={() => handleSwipe('right')} className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white ${userIsVip && !isViewingJob ? 'bg-yellow-500 shadow-yellow-200' : 'bg-blue-600 shadow-blue-200'}`}>
          {isViewingJob ? <Heart size={32} fill="white" /> : userIsVip ? <Crown size={32} fill="white" /> : <DollarSign size={32} />}
        </button>
      </div>

      {userProfile.role === 'boss' && (
        <button onClick={() => setShowPostJob(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-105 transition-transform">
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

export default App;
