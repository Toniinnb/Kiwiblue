import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { X, Lock, Phone, Loader2, ShieldAlert, ChevronRight, Gift, Copy, Crown } from 'lucide-react';

export default function Profile({ session, userProfile, onClose, onLogout, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('info'); 
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // 🔴 您的客服微信号 (请在这里修改)
  const CUSTOMER_SERVICE_WECHAT = "Thismour";

  useEffect(() => {
    if (userProfile.role === 'boss') fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    const { data: relations } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
    if (relations && relations.length > 0) {
      const workerIds = relations.map(r => r.worker_id);
      const { data: workers } = await supabase.from('profiles').select('*').in('id', workerIds);
      setContacts(workers || []);
    } else setContacts([]);
    setLoadingContacts(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("密码至少6位");
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    alert(error ? error.message : "修改成功");
    if (!error) setNewPassword('');
    setPassLoading(false);
  };

  // 复制微信号逻辑
  const handleContactSupport = () => {
    alert(`请添加客服微信开通 VIP：\n\n${CUSTOMER_SERVICE_WECHAT}\n\n(点击确定自动复制)`);
    navigator.clipboard.writeText(CUSTOMER_SERVICE_WECHAT);
  };

  if (selectedWorker) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slide-in-right">
        <div className="px-6 py-4 flex items-center gap-4 shadow-sm bg-white">
          <button onClick={() => setSelectedWorker(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight className="rotate-180" size={24} /></button>
          <h2 className="text-xl font-bold text-gray-900">工友详情</h2>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center mb-6">
             <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">{selectedWorker.name?.[0]}</div>
             <h3 className="text-2xl font-bold text-gray-900">{selectedWorker.name}</h3>
             <p className="text-gray-500 mt-1">{selectedWorker.intro}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
             <div><label className="text-xs text-gray-400">手机号码</label><div className="text-xl font-bold text-gray-900 flex items-center justify-between">{selectedWorker.phone}<a href={`tel:${selectedWorker.phone}`} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">拨打</a></div></div>
             {selectedWorker.wechat && <div className="pt-4 border-t border-gray-100"><label className="text-xs text-gray-400">微信号</label><div className="text-lg font-medium text-gray-900">{selectedWorker.wechat}</div></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-slide-in-right">
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">个人中心</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center relative">
          <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-2xl font-bold mb-3">{userProfile?.name?.[0]}</div>
          <h3 className="text-xl font-bold text-gray-900">{userProfile?.name}</h3>
          <p className="text-gray-500 text-sm mt-1 mb-2">{userProfile?.role === 'boss' ? '老板 / 雇主' : '工友 / 求职者'}</p>
          
          {userProfile?.role === 'boss' && (
             <div className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
               余额: {userProfile.credits || 0} 币
             </div>
          )}

          {/* === 新增：VIP 购买按钮 === */}
          {userProfile?.role === 'boss' && (
             <div className="mb-6">
               <button 
                 onClick={handleContactSupport}
                 className="bg-gray-900 text-yellow-400 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-gray-300 flex items-center gap-2 mx-auto animate-pulse active:scale-95 transition-transform"
               >
                 <Crown size={16} /> 开通 VIP 无限刷
               </button>
             </div>
          )}
          
          {/* 邀请奖励卡片 */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2"><Gift size={18} /> 邀请赚奖励</div>
            <p className="text-xs text-yellow-700 mb-3">
              让朋友注册时填您的手机号，双方都有奖！
              <br/>
              {userProfile.role === 'boss' ? '• 您得 20 币，他得 10 币' : '• 您得 5 次机会，他得 5 次'}
            </p>
            <div className="bg-white/80 p-2 rounded-lg flex justify-between items-center border border-yellow-200">
              <span className="font-mono font-bold text-gray-600 ml-1">{userProfile.phone}</span>
              <button onClick={() => {navigator.clipboard.writeText(userProfile.phone); alert("已复制邀请码！");}} className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-bold flex items-center gap-1"><Copy size={12}/> 复制</button>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
          <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'info' ? 'bg-white shadow' : 'text-gray-500'}`}>资料</button>
          {userProfile?.role === 'boss' && <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'contacts' ? 'bg-white shadow' : 'text-gray-500'}`}>已解锁</button>}
          <button onClick={() => setActiveTab('password')} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === 'password' ? 'bg-white shadow' : 'text-gray-500'}`}>安全</button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-xl shadow-sm"><div className="text-xs text-gray-400 mb-1">手机号</div><div className="text-gray-900 font-medium">{userProfile?.phone}</div></div>
             {userProfile.role === 'worker' && (
               <div className="bg-white p-4 rounded-xl shadow-sm">
                 <div className="text-xs text-gray-400 mb-1">今日查看额度</div>
                 <div className="flex justify-between items-center">
                   <div className="font-bold text-blue-600 text-lg">{userProfile.swipes_used_today || 0} / {20 + (userProfile.swipe_quota_extra || 0)}</div>
                   <div className="text-xs text-gray-400">去邀请朋友增加额度</div>
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-3">
            {contacts.map(worker => (
                <div key={worker.id} onClick={() => setSelectedWorker(worker)} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer">
                  <div className="font-bold text-gray-900">{worker.name}</div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
            ))}
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <input type="password" placeholder="新密码" className="w-full px-4 py-3 bg-gray-50 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button onClick={handleUpdatePassword} disabled={passLoading} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">修改</button>
          </div>
        )}

        <button onClick={onLogout} className="w-full mt-10 py-3 text-red-500 font-bold bg-white border border-red-100 rounded-xl">退出登录</button>
      </div>
    </div>
  );
}
