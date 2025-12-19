import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Onboarding from './Onboarding';
import PostJob from './PostJob'; 
import Profile from './Profile'; 
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2, Plus, Lock, Flame, Crown } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const Header = ({ onOpenProfile }) => (
  <div style={{height: '56px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 40, borderBottom: '1px solid #eee', padding: '0 16px', maxWidth: '450px', left: '50%', transform: 'translateX(-50%)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
      <div style={{padding: '6px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex'}}>
        <Hammer size={18} />
      </div>
      <span style={{fontSize: '18px', fontWeight: 'bold', color: '#111'}}>KiwiBlue</span>
    </div>
    <button onClick={onOpenProfile} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"><User size={20} /></button>
  </div>
);

const DraggableCard = ({ data, userRole, isVip, onSwipe, index }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]); 
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const borderColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#ffffff', userRole === 'worker' ? '#22c55e' : '#eab308']);
  
  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  const isJob = userRole === 'worker';
  const displayTitle = isJob ? (data.title || "招工") : (data.intro?.split(' ')?.[0] || "工友");
  const displaySub = isJob ? "招聘方" : (data.name || "匿名");
  const displayPrice = isJob ? (data.wage || "面议") : (data.intro?.split(' ')?.[1] || "面议");
  const displayTags = data.tags || (data.experience ? [data.experience] : []);

  return (
    <motion.div
      drag="x" 
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity, position: 'absolute', top: 0, width: '100%', height: '100%', zIndex: 100 - index }}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col h-[65vh] border-4"
    >
      <motion.div style={{ borderColor }} className="absolute inset-0 border-4 rounded-[1.5rem] pointer-events-none z-50 transition-colors" />
      <div className="h-3/5 relative bg-gray-200 pointer-events-none">
        <div className="w-full h-full bg-[#f3f4f6] flex justify-center items-center text-gray-400">
           {isJob ? <Building2 size={80} /> : <User size={80} />}
        </div>
        {!isJob && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              {isVip ? (
                <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 animate-pulse"><Crown size={16} fill="currentColor" /> VIP 免扣费</div>
              ) : (
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm flex gap-1"><Lock size={14} /> 联系方式已隐藏</div>
              )}
            </div>
        )}
        {data.location && <div className="absolute top-4 left-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><MapPin size={12} /> {data.location}</div>}
        <div className="absolute bottom-4 right-4 bg-orange-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><Flame size={12} fill="white" /> {data.popularity || 0} 热度</div>
      </div>

      <div className="flex-1 p-5 flex flex-col pointer-events-none bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{displayTitle}</h2>
            <div className="flex items-center gap-2"><p className="text-gray-500 text-lg font-medium">{displaySub}</p>{data.is_verified ? <ShieldCheck size={16} className="text-green-500" /> : null}</div>
          </div>
          <div className="text-blue-600 font-bold text-2xl tracking-tight">{displayPrice}</div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">{displayTags.map((tag, i) => (<span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md">{tag}</span>))}</div>
        <div className="mt-auto pt-4 flex items-center text-gray-400 text-sm"><p>{isJob ? '右滑发送意向' : isVip ? '👑 VIP 右滑直开' : '右滑解锁'}</p></div>
      </div>
    </motion.div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [showPostJob, setShowPostJob] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 🔴 您的客服微信号 (请在这里修改)
  const CUSTOMER_SERVICE_WECHAT = "Thismour";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      const today = new Date().toISOString().split('T')[0];
      if (data.last_active_date !== today) {
        await supabase.from('profiles').update({ swipes_used_today: 0, last_active_date: today }).eq('id', userId);
        data.swipes_used_today = 0;
      }
      setUserProfile(data);
    }
    setLoading(false);
  }

  const fetchData = async () => {
    if (!session || !userProfile) return;
    try {
      if (userProfile.role === 'worker') {
        const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        setCards(data || []);
      } else {
        const { data: unlocked } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
        const unlockedIds = unlocked ? unlocked.map(u => u.worker_id) : [];
        let query = supabase.from('profiles').select('*').eq('role', 'worker').neq('status', 'busy').order('updated_at', { ascending: false });
        if (unlockedIds.length > 0) query = query.not('id', 'in', `(${unlockedIds.join(',')})`);
        const { data } = await query;
        setCards(data || []);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, [userProfile]);

  const isVip = () => userProfile?.vip_expiry && new Date(userProfile.vip_expiry) > new Date();

  // 复制微信号逻辑
  const handleContactSupport = () => {
    alert(`请添加客服微信充值/开通VIP：\n\n${CUSTOMER_SERVICE_WECHAT}\n\n(点击确定自动复制)`);
    navigator.clipboard.writeText(CUSTOMER_SERVICE_WECHAT);
  };

  const handleSwipe = async (direction) => {
    const currentCard = cards[currentIndex];
    
    if (direction === 'left') {
      setCurrentIndex(curr => curr + 1);
      return;
    }

    if (direction === 'right') {
      if (userProfile.role === 'worker') {
        const limit = 20 + (userProfile.swipe_quota_extra || 0);
        const used = userProfile.swipes_used_today || 0;

        if (used >= limit) {
          alert(`今天查看次数已达上限 (${limit}次)！\n\n💡 邀请工友注册，每人奖励 5 次机会！\n\n您的邀请码是您的手机号。`);
          window.location.reload(); 
          return;
        }

        await supabase.from('profiles').update({ swipes_used_today: used + 1 }).eq('id', session.user.id);
        await supabase.from('jobs').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);
        
        setUserProfile(prev => ({...prev, swipes_used_today: used + 1}));
        setCurrentIndex(curr => curr + 1);
        return;
      } 
      else if (userProfile.role === 'boss') {
        if (isVip()) {
           await supabase.from('contacts').insert({ boss_id: session.user.id, worker_id: currentCard.id });
           await supabase.from('profiles').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);
           checkProfile(session.user.id);
           setCurrentIndex(curr => curr + 1);
           return;
        }

        const cost = calculateCost(currentCard);
        const confirmUnlock = window.confirm(`解锁需扣 ${cost} 币，确认？`);
        
        if (!confirmUnlock) {
          window.location.reload();
          return;
        }

        if ((userProfile.credits || 0) < cost) {
          alert("❌ 余额不足，请充值或开通 VIP 无限刷！");
          window.location.reload();
          return;
        }

        const { error } = await supabase.from('profiles').update({ credits: userProfile.credits - cost }).eq('id', session.user.id);
        if (!error) {
           await supabase.from('contacts').insert({ boss_id: session.user.id, worker_id: currentCard.id });
           await supabase.from('profiles').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id);
           alert("解锁成功！");
           checkProfile(session.user.id);
           setCurrentIndex(curr => curr + 1);
        }
      }
    }
  };

  const calculateCost = (card) => {
    if (!card.experience) return 1; 
    const match = card.experience.match(/(\d+)/); 
    return match ? Math.min(Math.max(parseInt(match[0], 10), 1), 10) : 1; 
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!session) return <Login />;
  if (!userProfile) return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;
  if (showPostJob) return <PostJob session={session} onClose={() => setShowPostJob(false)} onPostSuccess={fetchData} />;
  if (showProfile) return <Profile session={session} userProfile={userProfile} onClose={() => setShowProfile(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.reload(); }} onProfileUpdate={() => checkProfile(session.user.id)} />;

  if (currentIndex >= cards.length) {
    return (
      <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Header onOpenProfile={() => setShowProfile(true)} />
        <CheckCircle2 size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">刷完了</h2>
        <p className="text-gray-500 mt-2 mb-6">暂时没有更多匹配。</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => { setCurrentIndex(0); fetchData(); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200">刷新看看</button>
          
          {/* === 新增：VIP 充值按钮 === */}
          {userProfile.role === 'boss' && (
            <button onClick={handleContactSupport} className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
              <Crown size={20} fill="white" /> 开通 VIP 无限刷
            </button>
          )}

          <button onClick={() => setShowProfile(true)} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">进入个人中心</button>
        </div>
        {userProfile.role === 'boss' && <button onClick={() => setShowPostJob(true)} className="mt-8 flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-6 py-3 rounded-xl"><Plus size={20} /> 发布新招工</button>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 relative font-sans overflow-hidden">
      <Header onOpenProfile={() => setShowProfile(true)} />
      
      <div className="px-4 mt-[60px] h-[calc(100vh-160px)] flex flex-col justify-center relative">
        {cards.slice(currentIndex, currentIndex + 2).reverse().map((card, i) => {
           const realIndex = currentIndex + (cards.slice(currentIndex, currentIndex + 2).length - 1 - i);
           return (
             <DraggableCard 
                key={card.id} 
                data={card} 
                userRole={userProfile.role} 
                isVip={isVip()} 
                onSwipe={handleSwipe} 
                index={i}
             />
           );
        })}
      </div>

      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-10 flex items-center justify-between z-10 pointer-events-none">
        <div className="text-gray-400 text-xs w-full text-center">
          {userProfile.role === 'worker' ? 
            `今日剩余查看: ${Math.max(0, (20 + (userProfile.swipe_quota_extra||0)) - (userProfile.swipes_used_today||0))} 次` : 
            '按住卡片 左右拖拽'}
        </div>
      </div>
      
      {userProfile.role === 'boss' && (
        <button onClick={() => setShowPostJob(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-30 hover:scale-105 transition-transform"><Plus size={28} /></button>
      )}
    </div>
  );
}

export default App;
