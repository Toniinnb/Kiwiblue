import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Onboarding from './Onboarding';
import PostJob from './PostJob'; 
import Profile from './Profile'; 
import { MapPin, Hammer, CheckCircle2, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2, Plus, Lock, Flame, Crown } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const Header = ({ onOpenProfile }) => (
  <div style={{height: '56px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid #eee', padding: '0 16px', maxWidth: '450px', left: '50%', transform: 'translateX(-50%)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
      <div style={{padding: '6px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex'}}>
        <Hammer size={18} />
      </div>
      <span style={{fontSize: '18px', fontWeight: 'bold', color: '#111'}}>KiwiBlue</span>
    </div>
    <button onClick={onOpenProfile} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"><User size={20} /></button>
  </div>
);

// === 可拖拽卡片组件 ===
const DraggableCard = ({ data, userRole, isVip, onSwipe, index }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]); 
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const borderColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#ffffff', userRole === 'worker' ? '#22c55e' : '#eab308']);
  
  const handleDragEnd = (event, info) => {
    const threshold = 100; 
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const isJob = userRole === 'worker';
  const displayTitle = isJob ? (data.title || "招工") : (data.intro?.split(' ')?.[0] || "工友");
  const displaySub = isJob ? "招聘方" : (data.name || "匿名");
  const displayPrice = isJob ? (data.wage || "面议") : (data.intro?.split(' ')?.[1] || "面议");
  const displayTags = data.tags || (data.experience ? [data.experience] : []);

  return (
    <motion.div
      drag="x" 
      dragSnapToOrigin={true} 
      dragElastic={0.7} 
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }} 
      style={{ x, rotate, opacity, position: 'absolute', width: '100%', height: '100%', zIndex: 100 - index }}
      exit={{ x: x.get() < 0 ? -1000 : 1000, opacity: 0, transition: { duration: 0.4 } }}
      onDragEnd={handleDragEnd}
      // === 修改点 1: 卡片容器样式 ===
      // max-w-[340px]: 限制最大宽度，防止太大
      // h-full: 高度由父容器控制，不再自己撑满
      className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 w-full max-w-[340px]" 
    >
      <motion.div style={{ borderColor }} className="absolute inset-0 border-[4px] rounded-[1.5rem] pointer-events-none z-50 transition-colors" />
      
      <div className="h-3/5 relative bg-gray-200 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 flex justify-center items-center text-gray-400">
           {isJob ? <Building2 size={80} /> : <User size={80} />}
        </div>
        
        {/* === 修改点 2: VIP 移到左上角 === */}
        {!isJob && (
            <div className="absolute top-4 left-4 z-20">
              {isVip ? (
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                  <Crown size={14} fill="currentColor" /> VIP 免扣费
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm flex items-center gap-1">
                  <Lock size={12} /> 号码隐藏
                </div>
              )}
            </div>
        )}

        {/* === 修改点 3: 地点移到右上角 (避免重叠) === */}
        {data.location && (
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <MapPin size={12} /> {data.location}
          </div>
        )}
        
        {/* 热度保持右下角 */}
        <div className="absolute bottom-4 right-4 bg-orange-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
           <Flame size={12} fill="white" /> {data.popularity || 0}
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col pointer-events-none bg-white">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{displayTitle}</h2>
            <div className="flex items-center gap-2"><p className="text-gray-500 text-sm font-medium">{displaySub}</p>{data.is_verified ? <ShieldCheck size={14} className="text-green-500" /> : null}</div>
          </div>
          <div className="text-blue-600 font-bold text-xl tracking-tight">{displayPrice}</div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">{displayTags.slice(0,3).map((tag, i) => (<span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">{tag}</span>))}</div>
        {/* 底部提示语简化 */}
        <div className="mt-auto pt-2 flex items-center justify-center text-gray-300 text-xs">
           <p>左右滑动 或 点击下方按钮</p>
        </div>
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

  const CUSTOMER_SERVICE_WECHAT = "Kiwi_Admin_001";

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
          alert(`查看次数已达上限！请邀请工友增加额度。`);
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
        
        if (!confirmUnlock) return; // 按钮模式下，取消就直接不动，不用刷新

        if ((userProfile.credits || 0) < cost) {
          alert("❌ 余额不足，请充值！");
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
          
          {userProfile.role === 'boss' && (
            <button onClick={handleContactSupport} className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
              <Crown size={20} fill="white" /> 开通 VIP 无限刷
            </button>
          )}

          <button onClick={() => setShowProfile(true)} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">进入个人中心</button>
        </div>
        
        {userProfile.role === 'boss' && (
          <button onClick={() => setShowPostJob(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-[999] hover:scale-105 transition-transform"><Plus size={28} /></button>
        )}
      </div>
    );
  }

  const isJob = userProfile.role === 'worker';
  const isUserVip = isVip();

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 relative font-sans overflow-hidden">
      <Header onOpenProfile={() => setShowProfile(true)} />
      
      {/* === 修改点 1: 卡片容器高度减小，居中，留出上下空间 === */}
      {/* h-[60vh] 意味着卡片只占屏幕 60% 高度，上下留白 */}
      <div className="w-full flex flex-col justify-center items-center relative px-4" style={{ height: 'calc(100vh - 160px)', marginTop: '60px' }}>
        <AnimatePresence>
          {cards.slice(currentIndex, currentIndex + 2).reverse().map((card, i) => {
             return (
               <DraggableCard 
                  key={card.id} 
                  data={card} 
                  userRole={userProfile.role} 
                  isVip={isUserVip} 
                  onSwipe={handleSwipe} 
                  index={i}
               />
             );
          })}
        </AnimatePresence>
      </div>

      {/* === 修改点 4: 底部按钮回归 (点赞/点叉) === */}
      <div className="fixed bottom-8 left-0 right-0 max-w-md mx-auto px-12 flex items-center justify-between z-20 pointer-events-auto">
        {/* 左边的 Pass 按钮 */}
        <button 
          onClick={() => handleSwipe('left')} 
          className="w-16 h-16 rounded-full bg-white shadow-xl border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
        >
          <X size={32} />
        </button>

        {/* 右边的 Like/Unlock 按钮 */}
        <button 
          onClick={() => handleSwipe('right')} 
          className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white active:scale-95 transition-all ${isUserVip && !isJob ? 'bg-yellow-500 shadow-yellow-200' : 'bg-blue-600 shadow-blue-200'}`}
        >
          {isJob ? <Heart size={30} fill="white" /> : isUserVip ? <Crown size={30} fill="white" /> : <DollarSign size={30} />}
        </button>
      </div>

      {userProfile.role === 'boss' && (
        <button onClick={() => setShowPostJob(true)} className="fixed bottom-28 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-[999] hover:scale-105 transition-transform"><Plus size={28} /></button>
      )}
    </div>
  );
}

export default App;
