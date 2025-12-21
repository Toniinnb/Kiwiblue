import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Onboarding from './Onboarding';
import PostJob from './PostJob'; 
import Profile from './Profile'; 
import { MapPin, Hammer, X, Heart, User, Building2, ShieldCheck, DollarSign, Loader2, Plus, Lock, Flame, Crown, Megaphone, Bell, RefreshCw, WifiOff } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useConfig } from './ConfigContext';

// --- Header 组件 (只增加了余额显示，其他UI没动) ---
const Header = ({ onOpenProfile, unreadCount, credits }) => {
  const config = useConfig();
  return (
    <div style={{height: '56px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid #eee', padding: '0 16px', maxWidth: '450px', left: '50%', transform: 'translateX(-50%)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <div style={{padding: '6px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex'}}>
          {config.logo_url ? <img src={config.logo_url} className="w-[18px] h-[18px] object-cover"/> : <Hammer size={18} />}
        </div>
        <span style={{fontSize: '18px', fontWeight: 'bold', color: '#111'}}>{config.app_name}</span>
      </div>
      <div className="flex items-center gap-3">
        {/* 新增：显示余额 (仅当 credits 存在时显示) */}
        {credits !== undefined && (
          <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
             <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">$</div>
             <span className="text-xs font-bold text-amber-800">{credits}</span>
          </div>
        )}
        <button onClick={onOpenProfile} className="relative p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
          <User size={20} />
          {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
        </button>
      </div>
    </div>
  );
}

// ... (DraggableCard 保持原样) ...
const DraggableCard = ({ data, userRole, isVip, onSwipe, level, isInterested }) => {
  const config = useConfig();
  const x = useMotionValue(0);
  const dragRotate = useTransform(x, [-200, 200], [-15, 15]); 
  const borderColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#ffffff', userRole === 'worker' ? '#22c55e' : '#eab308']);
  
  const handleDragEnd = (event, info) => {
    const threshold = 100; 
    if (info.offset.x > threshold) onSwipe('right');
    else if (info.offset.x < -threshold) onSwipe('left');
  };

  const isJob = userRole === 'worker';
  const displayTitle = isJob ? (data.title || "招工") : (data.intro?.split(' ')?.[0] || config.role_worker_label);
  const displaySub = isJob ? "招聘方" : (data.name || "匿名");
  const displayPrice = isJob ? (data.wage || "面议") : (data.intro?.split(' ')?.[1] || "面议");
  const displayTags = data.tags || (data.experience ? [data.experience + "年经验"] : []); 
  const isTop = level === 0;

  return (
    <motion.div
      drag={isTop ? "x" : false} 
      dragSnapToOrigin={true} 
      dragElastic={0.7} 
      whileDrag={{ cursor: 'grabbing' }} 
      animate={{ scale: 1 - level * 0.04, y: level * 12, opacity: 1 - level * 0.1, zIndex: 100 - level, rotate: isTop ? 0 : (level % 2 === 0 ? 2 : -2) }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ x: isTop ? x : 0, rotate: isTop ? dragRotate : 0, position: 'absolute', width: '100%', height: '100%' }}
      exit={{ x: x.get() < 0 ? -1000 : 1000, opacity: 0, transition: { duration: 0.4 } }}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 w-full max-w-[340px]" 
    >
      <motion.div style={{ borderColor }} className="absolute inset-0 border-[4px] rounded-[1.5rem] pointer-events-none z-50 transition-colors" />
      <div className="h-[40%] relative bg-gray-200 pointer-events-none overflow-hidden">
        {data.avatar_url ? <img src={data.avatar_url} className="w-full h-full object-cover" alt="avatar"/> : <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 flex justify-center items-center text-gray-400"> {isJob ? <Building2 size={64} /> : <User size={64} />} </div>}
        {isInterested && <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center text-xs font-bold py-1 z-30 animate-pulse">🔥 对方发来了意向</div>}
        {!isJob && <div className="absolute top-4 left-4 z-20"> {isVip ? <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse"><Crown size={14} fill="currentColor" /> {config.vip_label}</div> : <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm flex items-center gap-1"><Lock size={12} /> 号码隐藏</div>} </div>}
        {data.location && <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><MapPin size={12} /> {data.location}</div>}
        <div className="absolute bottom-4 right-4 bg-orange-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><Flame size={12} fill="white" /> {data.popularity || 0}</div>
      </div>
      <div className="flex-1 p-6 flex flex-col pointer-events-none bg-white">
        <div className="flex justify-between items-start mb-2">
          <div><h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{displayTitle}</h2><div className="flex items-center gap-2"><p className="text-gray-500 text-sm font-medium">{displaySub}</p>{data.is_verified ? <ShieldCheck size={14} className="text-green-500" /> : null}</div></div>
          <div className="text-blue-600 font-bold text-xl tracking-tight">{displayPrice}</div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">{displayTags.slice(0,3).map((tag, i) => (<span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">{tag}</span>))}</div>
        <div className="mt-auto pt-2 flex items-center justify-center text-gray-300 text-xs"><p>左右滑动 或 点击下方按钮</p></div>
      </div>
    </motion.div>
  );
};

// ... (Toast 保持原样) ...
const Toast = ({ notification, onClose, onClick }) => (
  <div onClick={onClick} className="fixed top-4 left-4 right-4 z-[100] bg-white border-l-4 border-blue-500 shadow-xl rounded-lg p-4 flex items-center justify-between animate-slide-down cursor-pointer active:scale-95 transition-transform">
    <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-full text-blue-600"><Bell size={18} /></div><div><p className="font-bold text-gray-800 text-sm">收到新消息</p><p className="text-gray-500 text-xs truncate max-w-[200px]">{notification.content}</p></div></div>
    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
  </div>
);

// === 主逻辑 ===
function App() {
  const config = useConfig();
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [showPostJob, setShowPostJob] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [processingSwipe, setProcessingSwipe] = useState(false); // 状态锁，防止手滑连点
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [directChatId, setDirectChatId] = useState(null); 
  const [fetchError, setFetchError] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);

  // === 第 1 层：核心身份认证 (保持原样) ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setFetchError(false);
        setProfileNotFound(false);
        checkProfile(session.user.id);
      } else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // === 第 2 层：消息系统 (保持修复后的严谨版) ===
  useEffect(() => {
    if (!session?.user?.id || !userProfile || profileNotFound) return;

    fetchUnreadCount(session.user.id);

    const channel = supabase.channel('global_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${session.user.id}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.receiver_id === session.user.id) {
             setNotification({ content: payload.new.content, sender_id: payload.new.sender_id });
             setTimeout(() => setNotification(null), 3000);
          }
          fetchUnreadCount(session.user.id);
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.id, userProfile]);

  // === 第 3 层：数据拉取 (保持原样) ===
  useEffect(() => { 
    if (userProfile) fetchData(); 
  }, [userProfile]);

  // === 辅助函数 ===
  const fetchUnreadCount = async (userId) => {
    try {
      const { data } = await supabase.from('conversations').select('unread_count').eq('user_id', userId);
      const total = data ? data.reduce((sum, i) => sum + i.unread_count, 0) : 0;
      setUnreadCount(total);
    } catch (e) {}
  };

  async function checkProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) { setFetchError(true); setLoading(false); return; }

      if (data && data.role) {
         const today = new Date().toISOString().split('T')[0];
         if (data.last_active_date !== today) {
           await supabase.from('profiles').update({ swipes_used_today: 0, last_active_date: today }).eq('id', userId);
           data.swipes_used_today = 0;
         }
         setUserProfile(data);
      } else {
         setProfileNotFound(true);
         setUserProfile(null); 
      }
    } catch (e) { setFetchError(true); } finally { setLoading(false); }
  }

  const fetchData = async () => {
    try {
      let newData = [];
      if (userProfile.role === 'worker') {
        const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (!error && data) newData = data;
      } else {
        const { data: unlocked } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
        const unlockedIds = unlocked ? unlocked.map(u => u.worker_id) : [];
        
        let interestedIds = [];
        try {
          const { data: applicants } = await supabase.from('applications').select('worker_id').eq('boss_id', session.user.id);
          interestedIds = applicants ? applicants.map(a => a.worker_id) : [];
        } catch (e) {}

        let query = supabase.from('profiles').select('*').eq('role', 'worker').neq('status', 'busy').order('updated_at', { ascending: false });
        if (unlockedIds.length > 0) query = query.not('id', 'in', `(${unlockedIds.join(',')})`);
        
        const { data: allWorkers, error } = await query;
        if (!error && allWorkers) {
           const interested = allWorkers.filter(w => interestedIds.includes(w.id));
           interested.forEach(w => w.is_interested = true);
           const others = allWorkers.filter(w => !interestedIds.includes(w.id));
           newData = [...interested, ...others];
        }
      }
      setCards(newData);
    } catch (error) { console.error("Card fetch error:", error); }
  };

  const isVip = () => userProfile?.vip_expiry && new Date(userProfile.vip_expiry) > new Date();

  // === 核心修改：动态计算价格 ===
  const calculateUnlockCost = (cardExperience) => {
    // 1. VIP 免费：返回 0，这会直接跳过扣费检查
    if (isVip()) return 0;

    // 2. 解析经验值
    const exp = parseInt(cardExperience) || 0;

    // 3. 0-1年 -> 1币
    if (exp <= 1) return 1;

    // 4. >1年 -> 几年扣几币，封顶10
    return Math.min(exp, 10);
  };

  const handleSwipe = async (direction) => {
    if (currentIndex >= cards.length || processingSwipe) return;
    const currentCard = cards[currentIndex];
    
    // 左滑 (Pass)
    if (direction === 'left') {
      setCurrentIndex(curr => curr + 1);
      return;
    }

    // 右滑 (Like / Unlock)
    if (direction === 'right') {
      setProcessingSwipe(true); // 加锁

      // A. 工人找工作逻辑 (保持完整不变)
      if (userProfile.role === 'worker') {
        const limit = 20 + (userProfile.swipe_quota_extra || 0);
        const used = userProfile.swipes_used_today || 0;
        if (used >= limit) {
          alert(`查看次数已达上限！`);
          window.location.reload(); 
          return;
        }
        await supabase.from('profiles').update({ swipes_used_today: used + 1 }).eq('id', session.user.id);
        try { if (currentCard.boss_id) await supabase.from('applications').insert({ worker_id: session.user.id, job_id: currentCard.id, boss_id: currentCard.boss_id }); } catch(e){}
        try { await supabase.from('jobs').update({ popularity: (currentCard.popularity || 0) + 1 }).eq('id', currentCard.id); } catch(e){}
        setUserProfile(prev => ({...prev, swipes_used_today: used + 1}));
        setCurrentIndex(curr => curr + 1);
        setProcessingSwipe(false);
      
      // B. 老板找工人逻辑 (核心修改：工龄定价 + 安全扣费)
      } else if (userProfile.role === 'boss') {
        try {
          const cost = calculateUnlockCost(currentCard.experience); // 算钱
          const currentCredits = userProfile.credits || 0;

          // 1. 余额检查 (cost为0时不检查，VIP直接过)
          if (cost > 0 && currentCredits < cost) {
            const expText = currentCard.experience ? `${currentCard.experience}年` : '未知';
            alert(`余额不足！\n\n该工友经验：${expText}\n解锁价格：${cost} 金币\n您的余额：${currentCredits} 金币`);
            setProcessingSwipe(false);
            window.location.reload(); // 简单回弹
            return; 
          }

          // 2. 扣费 (仅当 cost > 0 时执行)
          if (cost > 0) {
            const { error: deductError } = await supabase
              .from('profiles')
              .update({ credits: currentCredits - cost })
              .eq('id', session.user.id);
            
            if (deductError) throw new Error("Deduct failed");
            
            // UI 先更新给用户看
            setUserProfile(prev => ({...prev, credits: currentCredits - cost}));
          }

          // 3. 解锁
          const { error: unlockError } = await supabase
            .from('contacts')
            .insert({ boss_id: session.user.id, worker_id: currentCard.id });

          // 4. 回滚机制：如果解锁失败，把钱退回去
          if (unlockError) {
             if (cost > 0) {
                await supabase.from('profiles').update({ credits: currentCredits }).eq('id', session.user.id);
                setUserProfile(prev => ({...prev, credits: currentCredits})); 
                alert("解锁失败，金币已自动退回。");
             }
             setProcessingSwipe(false);
             return;
          }

          checkProfile(session.user.id);
          setCurrentIndex(curr => curr + 1);

        } catch (e) {
          console.error("Unlock failed", e);
          alert("操作失败，请重试");
        } finally {
          setProcessingSwipe(false);
        }
      }
    }
  };

  const handleNotificationClick = () => {
    if (notification) {
      setDirectChatId(notification.sender_id);
      setShowProfile(true);
      setNotification(null);
    }
  };
  
  const handleContactSupport = () => {
    alert(`请添加客服微信充值/开通VIP：\n\n${config.service_wechat}\n\n(点击确定自动复制)`);
    navigator.clipboard.writeText(config.service_wechat);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (fetchError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-6 text-center">
      <WifiOff size={48} className="text-gray-300"/>
      <h3 className="text-xl font-bold text-gray-800">网络连接异常</h3>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-xl">重新加载</button>
    </div>
  );

  if (!session) return <Login />;
  if (profileNotFound) return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;
  if (!userProfile) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (showPostJob) return <PostJob session={session} onClose={() => setShowPostJob(false)} onPostSuccess={fetchData} />;
  
  if (showProfile) return (
    <Profile 
      session={session} 
      userProfile={userProfile} 
      onClose={() => {setShowProfile(false); fetchUnreadCount(session.user.id);}} 
      onLogout={async () => { await supabase.auth.signOut(); window.location.reload(); }} 
      onProfileUpdate={() => checkProfile(session.user.id)} 
      directChatId={directChatId} 
      onDirectChatHandled={() => setDirectChatId(null)} 
    />
  );

  if (currentIndex >= cards.length) {
    return (
      <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Header onOpenProfile={() => setShowProfile(true)} unreadCount={unreadCount} credits={userProfile.credits} />
        <Hammer size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">刷完了</h2>
        <p className="text-gray-500 mt-2 mb-6">暂时没有更多匹配。</p>
        <button onClick={() => { setCurrentIndex(0); fetchData(); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200">刷新看看</button>
        {userProfile.role === 'boss' && <button onClick={handleContactSupport} className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2"><Crown size={20} fill="white" /> {config.vip_label}</button>}
      </div>
    );
  }

  const isJob = userProfile.role === 'worker';
  const isUserVip = isVip();
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 relative font-sans overflow-hidden">
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} onClick={handleNotificationClick} />}
      <Header onOpenProfile={() => setShowProfile(true)} unreadCount={unreadCount} credits={userProfile.credits} />
      
      <div className="w-full flex flex-col justify-center items-center relative px-4" style={{ height: '55vh', marginTop: '80px' }}>
        <AnimatePresence>
          {visibleCards.map((card, i) => (
             <DraggableCard key={card.id} data={card} userRole={userProfile.role} isVip={isUserVip} onSwipe={handleSwipe} level={visibleCards.length - 1 - i} index={i} isInterested={card.is_interested} />
          ))}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-[140px] left-0 right-0 max-w-md mx-auto px-6 flex items-center justify-center gap-8 z-20 pointer-events-auto">
        <button onClick={() => handleSwipe('left')} className="w-14 h-14 rounded-full bg-white shadow-xl border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"><X size={28} /></button>
        {userProfile.role === 'boss' && <button onClick={() => setShowPostJob(true)} className="w-14 h-14 rounded-full bg-gray-900 text-white shadow-xl flex items-center justify-center hover:bg-black active:scale-95 transition-all"><Plus size={28} /></button>}
        <button onClick={() => handleSwipe('right')} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white active:scale-95 transition-all ${isUserVip && !isJob ? 'bg-yellow-500 shadow-yellow-200' : 'bg-blue-600 shadow-blue-200'}`}>{isJob ? <Heart size={28} fill="white" /> : isUserVip ? <Crown size={28} fill="white" /> : <DollarSign size={28} />}</button>
      </div>

      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto h-28 bg-gray-200 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 z-10">
        <Megaphone size={28} className="mb-1" />
        <span className="text-xs font-medium">黄金广告位招租</span>
      </div>
    </div>
  );
}

export default App;
