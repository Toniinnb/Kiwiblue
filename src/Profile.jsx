import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
// 👇 引入了 Edit3 (编辑图标) 和 Save (保存图标)
import { X, Loader2, ChevronRight, Gift, Copy, Crown, MessageCircle, User, Building2, Edit3, Save } from 'lucide-react';
import AvatarUpload from './AvatarUpload'; 
import Chat from './Chat'; 
import { useConfig } from './ConfigContext';

export default function Profile({ session, userProfile, onClose, onLogout, onProfileUpdate }) {
  const config = useConfig();
  const [activeTab, setActiveTab] = useState('info'); 
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  
  const [contacts, setContacts] = useState([]); 
  const [conversations, setConversations] = useState([]); 
  const [loadingData, setLoadingData] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null); 
  const [chatUser, setChatUser] = useState(null); 

  // === 新增：编辑模式状态 ===
  const [isEditing, setIsEditing] = useState(false);
  // 表单数据初始化
  const [editForm, setEditForm] = useState({
    name: userProfile.name || '',
    phone: userProfile.phone || '',
    wechat: userProfile.wechat || '',
    intro: userProfile.intro || '',
    experience: userProfile.experience || ''
  });

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'contacts' && userProfile.role === 'boss') fetchContacts();
    if (activeTab === 'messages') fetchConversations();
  }, [activeTab]);

  // === 1. 保存资料逻辑 (新增) ===
  const handleSaveProfile = async () => {
    if (!editForm.name || !editForm.phone) return alert("称呼和手机号不能为空");

    setLoadingData(true);
    const { error } = await supabase.from('profiles').update({
      name: editForm.name,
      phone: editForm.phone,
      wechat: editForm.wechat,
      intro: editForm.intro,
      experience: editForm.experience,
    }).eq('id', session.user.id);

    if (error) {
      alert("保存失败: " + error.message);
    } else {
      await onProfileUpdate(); // 通知父组件刷新数据
      setIsEditing(false);     // 退出编辑模式
      alert("资料已更新！");
    }
    setLoadingData(false);
  };

  // === 2. 获取已解锁联系人 ===
  const fetchContacts = async () => {
    setLoadingData(true);
    const { data: relations } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
    if (relations && relations.length > 0) {
      const workerIds = relations.map(r => r.worker_id);
      const { data: workers } = await supabase.from('profiles').select('*').in('id', workerIds);
      setContacts(workers || []);
    } else setContacts([]);
    setLoadingData(false);
  };

  // === 3. 获取消息列表 (带未读红点) ===
  const fetchConversations = async () => {
    setLoadingData(true);
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        setConversations([]);
        setLoadingData(false);
        return;
      }

      const otherUserIds = new Set();
      messages.forEach(msg => {
        if (msg.sender_id !== session.user.id) otherUserIds.add(msg.sender_id);
        if (msg.receiver_id !== session.user.id) otherUserIds.add(msg.receiver_id);
      });

      if (otherUserIds.size === 0) {
        setConversations([]);
        setLoadingData(false);
        return;
      }

      const { data: users } = await supabase.from('profiles').select('*').in('id', Array.from(otherUserIds));
      
      const conversationList = users.map(user => {
        const userMsgs = messages.filter(m => m.sender_id === user.id || m.receiver_id === user.id);
        const lastMsg = userMsgs[0];
        // 计算未读数：发送者是对方，接收者是我，且未读
        const unreadCount = userMsgs.filter(m => m.sender_id === user.id && m.receiver_id === session.user.id && !m.is_read).length;

        return { 
          ...user, 
          last_msg: lastMsg?.content || '', 
          last_time: lastMsg?.created_at,
          unread_count: unreadCount 
        };
      });
      
      conversationList.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
      setConversations(conversationList);
    } catch (error) {
      console.error("获取消息列表失败", error);
    }
    setLoadingData(false);
  };

  // === 4. 打开聊天并标记已读 ===
  const openChat = async (user) => {
    setChatUser(user);
    // 立即把对方发给我的消息标为已读
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', user.id).eq('receiver_id', session.user.id);
  };

  const handleAvatarUpdate = async (newUrl) => {
    const { error } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', session.user.id);
    if (error) alert("头像更新失败");
    else await onProfileUpdate(); 
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("密码至少6位");
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    alert(error ? error.message : "修改成功");
    if (!error) setNewPassword('');
    setPassLoading(false);
  };

  const handleContactSupport = () => {
    alert(`请添加客服微信开通 VIP：\n\n${config.service_wechat}\n\n(点击确定自动复制)`);
    navigator.clipboard.writeText(config.service_wechat);
  };

  const inviteLink = `${window.location.origin}/?ref=${userProfile.phone}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`;

  // === 渲染：聊天窗口 ===
  if (chatUser) {
    return <Chat session={session} otherUser={chatUser} onClose={() => { setChatUser(null); fetchConversations(); }} />;
  }

  // === 渲染：查看他人详情 (老板视角) ===
  if (selectedWorker) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slide-in-right">
        <div className="px-6 py-4 flex items-center gap-4 shadow-sm bg-white">
          <button onClick={() => setSelectedWorker(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight className="rotate-180" size={24} /></button>
          <h2 className="text-xl font-bold text-gray-900">{config.role_worker_label}详情</h2>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center mb-6">
             <div className="w-24 h-24 mx-auto mb-4">
               {selectedWorker.avatar_url ? (
                 <img src={selectedWorker.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-gray-50 shadow-md" />
               ) : (
                 <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl">{selectedWorker.name?.[0]}</div>
               )}
             </div>
             <h3 className="text-2xl font-bold text-gray-900">{selectedWorker.name}</h3>
             <p className="text-gray-500 mt-1">{selectedWorker.intro}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
             <div><label className="text-xs text-gray-400">手机号码</label><div className="text-xl font-bold text-gray-900 flex items-center justify-between">{selectedWorker.phone}<a href={`tel:${selectedWorker.phone}`} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">拨打</a></div></div>
             <div className="pt-4 border-t border-gray-100">
               <button onClick={() => openChat(selectedWorker)} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"><MessageCircle size={20} /> 发送消息</button>
             </div>
             {selectedWorker.wechat && <div className="pt-4 border-t border-gray-100"><label className="text-xs text-gray-400">微信号</label><div className="text-lg font-medium text-gray-900">{selectedWorker.wechat}</div></div>}
          </div>
        </div>
      </div>
    );
  }

  // === 渲染：个人中心主入口 ===
  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-slide-in-right">
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">个人中心</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 顶部概览卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center relative">
          <div className="mb-3 flex justify-center">
            <AvatarUpload url={userProfile.avatar_url} onUpload={handleAvatarUpdate} role={userProfile.role} size={80} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{userProfile?.name}</h3>
          <p className="text-gray-500 text-sm mt-1 mb-2">{userProfile?.role === 'boss' ? `${config.role_boss_label}` : `${config.role_worker_label}`}</p>
          
          {userProfile?.role === 'boss' && <div className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">余额: {userProfile.credits || 0} {config.currency_name}</div>}
          {userProfile?.role === 'boss' && (
             <div className="mb-6"><button onClick={handleContactSupport} className="bg-gray-900 text-yellow-400 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-gray-300 flex items-center gap-2 mx-auto animate-pulse active:scale-95 transition-transform"><Crown size={16} /> 开通 {config.vip_label}</button></div>
          )}
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-4 text-left">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2"><Gift size={18} /> 邀请有奖</div>
                <p className="text-xs text-yellow-700 mb-3 leading-relaxed">分享链接，双方有奖！</p>
                <button onClick={() => {navigator.clipboard.writeText(inviteLink); alert("链接已复制！");}} className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm"><Copy size={12}/> 复制链接</button>
              </div>
              <div className="w-20 h-20 bg-white p-1 rounded-lg shadow-sm border border-yellow-200"><img src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" /></div>
            </div>
          </div>
        </div>

        {/* 导航 Tab */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
          <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'info' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>资料</button>
          <button onClick={() => setActiveTab('messages')} className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 ${activeTab === 'messages' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>消息</button>
          {userProfile?.role === 'boss' && <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'contacts' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>已解锁</button>}
          <button onClick={() => setActiveTab('password')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>安全</button>
        </div>

        {/* === Tab: 资料 (含编辑功能) === */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-fade-in">
             {/* 编辑切换按钮 */}
             <div className="flex justify-end mb-2">
               {isEditing ? (
                 <button onClick={handleSaveProfile} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition-all">
                   <Save size={16} /> 保存资料
                 </button>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 bg-white text-blue-600 border border-blue-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-all">
                   <Edit3 size={16} /> 修改资料
                 </button>
               )}
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm">
               <div className="text-xs text-gray-400 mb-1">怎么称呼</div>
               {isEditing ? (
                 <input type="text" className="w-full border-b border-gray-200 py-1 outline-none font-medium focus:border-blue-500 transition-colors" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
               ) : (
                 <div className="text-gray-900 font-medium">{userProfile.name}</div>
               )}
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm">
               <div className="text-xs text-gray-400 mb-1">手机号</div>
               {isEditing ? (
                 <input type="tel" className="w-full border-b border-gray-200 py-1 outline-none font-medium focus:border-blue-500 transition-colors" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
               ) : (
                 <div className="text-gray-900 font-medium">{userProfile.phone}</div>
               )}
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm">
               <div className="text-xs text-gray-400 mb-1">微信号 (选填)</div>
               {isEditing ? (
                 <input type="text" className="w-full border-b border-gray-200 py-1 outline-none font-medium focus:border-blue-500 transition-colors" value={editForm.wechat} onChange={e => setEditForm({...editForm, wechat: e.target.value})} />
               ) : (
                 <div className="text-gray-900 font-medium">{userProfile.wechat || '未填写'}</div>
               )}
             </div>

             {/* 工友专属字段 */}
             {userProfile.role === 'worker' && (
               <>
                 <div className="bg-white p-4 rounded-xl shadow-sm">
                   <div className="text-xs text-gray-400 mb-1">我的简介 / 工种薪资</div>
                   {isEditing ? (
                     <input type="text" placeholder="例如：木工 35/hr" className="w-full border-b border-gray-200 py-1 outline-none font-medium focus:border-blue-500 transition-colors" value={editForm.intro} onChange={e => setEditForm({...editForm, intro: e.target.value})} />
                   ) : (
                     <div className="text-gray-900 font-medium">{userProfile.intro}</div>
                   )}
                 </div>

                 <div className="bg-white p-4 rounded-xl shadow-sm">
                   <div className="text-xs text-gray-400 mb-1">工作经验</div>
                   {isEditing ? (
                     <input type="text" placeholder="例如：5年本地经验" className="w-full border-b border-gray-200 py-1 outline-none font-medium focus:border-blue-500 transition-colors" value={editForm.experience} onChange={e => setEditForm({...editForm, experience: e.target.value})} />
                   ) : (
                     <div className="text-gray-900 font-medium">{userProfile.experience || '未填写'}</div>
                   )}
                 </div>

                 {/* 额度 */}
                 <div className="bg-white p-4 rounded-xl shadow-sm mt-4 opacity-80">
                   <div className="text-xs text-gray-400 mb-1">今日查看额度</div>
                   <div className="flex justify-between items-center">
                     <div className="font-bold text-blue-600 text-lg">{userProfile.swipes_used_today || 0} / {20 + (userProfile.swipe_quota_extra || 0)}</div>
                     <div className="text-xs text-gray-400">去邀请朋友增加额度</div>
                   </div>
                 </div>
               </>
             )}
          </div>
        )}

        {/* === Tab: 消息列表 (带红点) === */}
        {activeTab === 'messages' && (
          <div className="space-y-3 animate-fade-in">
            {loadingData ? (
               <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400"/></div>
            ) : conversations.length === 0 ? (
               <div className="text-center py-10 text-gray-400">
                  <MessageCircle size={48} className="mx-auto mb-2 opacity-20"/>
                  <p>暂无消息</p>
               </div>
            ) : (
              conversations.map(user => (
                <div key={user.id} onClick={() => openChat(user)} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer active:scale-95 transition-transform relative">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                       {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{user.name?.[0]}</div>}
                    </div>
                    {/* 列表红点 */}
                    {user.unread_count > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{user.unread_count}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-[10px] text-gray-400">{new Date(user.last_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div className="text-sm text-gray-500 truncate">{user.last_msg}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* === Tab: 已解锁 (仅老板) === */}
        {activeTab === 'contacts' && (
          <div className="space-y-3 animate-fade-in">
            {loadingData ? <div className="flex justify-center py-4"><Loader2 className="animate-spin"/></div> : contacts.map(worker => (
                <div key={worker.id} onClick={() => setSelectedWorker(worker)} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                       {worker.avatar_url ? <img src={worker.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{worker.name?.[0]}</div>}
                     </div>
                     <div className="font-bold text-gray-900">{worker.name}</div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
            ))}
          </div>
        )}

        {/* === Tab: 安全 === */}
        {activeTab === 'password' && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 animate-fade-in">
            <input type="password" placeholder="新密码" className="w-full px-4 py-3 bg-gray-50 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button onClick={handleUpdatePassword} disabled={passLoading} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">修改</button>
          </div>
        )}

        <button onClick={onLogout} className="w-full mt-10 py-3 text-red-500 font-bold bg-white border border-red-100 rounded-xl">退出登录</button>
      </div>
    </div>
  );
}
