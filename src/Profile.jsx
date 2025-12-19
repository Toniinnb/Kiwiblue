import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { X, LogOut, Lock, Phone, Loader2, ShieldAlert, ChevronRight, User } from 'lucide-react';

export default function Profile({ session, userProfile, onClose, onLogout, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('info'); 
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // 通讯录数据
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  // 新增：选中的联系人详情
  const [selectedWorker, setSelectedWorker] = useState(null);

  // === 修复：一打开 Profile 就加载通讯录，确保数字准确 ===
  useEffect(() => {
    if (userProfile.role === 'boss') {
      fetchContacts();
    }
  }, []);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    const { data: relations } = await supabase.from('contacts').select('worker_id').eq('boss_id', session.user.id);
    
    if (relations && relations.length > 0) {
      const workerIds = relations.map(r => r.worker_id);
      const { data: workers } = await supabase.from('profiles').select('*').in('id', workerIds);
      setContacts(workers || []);
    } else {
      setContacts([]);
    }
    setLoadingContacts(false);
  };

  // ... (状态切换和密码修改逻辑保持不变，为节省篇幅省略，请直接用下方完整代码) ...
  const handleToggleStatus = async () => {
    setStatusLoading(true);
    const newStatus = userProfile.status === 'busy' ? 'active' : 'busy';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', session.user.id);
    if (!error) await onProfileUpdate(); 
    setStatusLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert("密码至少需要6位");
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("修改失败: " + error.message);
    else { alert("密码修改成功！"); setNewPassword(''); }
    setPassLoading(false);
  };

  // === 如果选中了某个工友，显示详情页 ===
  if (selectedWorker) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slide-in-right">
        <div className="px-6 py-4 flex items-center gap-4 shadow-sm bg-white">
          <button onClick={() => setSelectedWorker(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">工友详情</h2>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center mb-6">
             <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
               {selectedWorker.name?.[0]}
             </div>
             <h3 className="text-2xl font-bold text-gray-900">{selectedWorker.name}</h3>
             <p className="text-gray-500 mt-1">{selectedWorker.intro || '未填写简介'}</p>
             <div className="mt-4 flex justify-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg">{selectedWorker.experience || '经验未知'}</span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-lg">人气 {selectedWorker.popularity || 0}</span>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
             <div>
               <label className="text-xs text-gray-400">手机号码</label>
               <div className="text-xl font-bold text-gray-900 flex items-center justify-between">
                 {selectedWorker.phone}
                 <a href={`tel:${selectedWorker.phone}`} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg shadow-green-200">一键拨打</a>
               </div>
             </div>
             {selectedWorker.wechat && (
               <div className="pt-4 border-t border-gray-100">
                 <label className="text-xs text-gray-400">微信号</label>
                 <div className="text-lg font-medium text-gray-900">{selectedWorker.wechat}</div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-slide-in-right">
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">个人中心</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 头部卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center relative">
          <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-2xl font-bold mb-3">
            {userProfile?.name?.[0] || "我"}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{userProfile?.name}</h3>
          <p className="text-gray-500 text-sm mt-1">
            {userProfile?.role === 'boss' ? '老板 / 雇主' : '工友 / 求职者'}
          </p>
          {userProfile?.role === 'boss' && (
             <div className="mt-3 inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
               余额: {userProfile.credits || 0} 币
             </div>
          )}
          {!userProfile?.is_verified && (
            <div className="mt-4 bg-orange-50 text-orange-600 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-2">
              <ShieldAlert size={14} /> <span>账号未认证</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
          <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>资料</button>
          {userProfile?.role === 'boss' && (
            <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'contacts' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              已解锁 ({contacts.length})
            </button>
          )}
          <button onClick={() => setActiveTab('password')} className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>安全</button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-gray-400 mb-1">手机号</div>
              <div className="text-gray-900 font-medium">{userProfile?.phone}</div>
            </div>
            {userProfile?.role === 'worker' && (
              <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                   <div className="text-xs text-gray-400 mb-1">求职状态</div>
                   <div className={`font-bold ${userProfile?.status === 'busy' ? 'text-gray-500' : 'text-green-600'}`}>{userProfile?.status === 'busy' ? '🚫 已忙碌' : '✅ 找活中'}</div>
                </div>
                <button onClick={handleToggleStatus} disabled={statusLoading} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">{statusLoading ? <Loader2 size={14} className="animate-spin"/> : '切换'}</button>
              </div>
            )}
          </div>
        )}

        {/* 修复：已解锁列表支持点击 */}
        {activeTab === 'contacts' && (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">还没有解锁过工友</div>
            ) : (
              contacts.map(worker => (
                <div 
                  key={worker.id} 
                  onClick={() => setSelectedWorker(worker)} // 点击进入详情
                  className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">{worker.name?.[0]}</div>
                    <div>
                      <div className="font-bold text-gray-900">{worker.name}</div>
                      <div className="text-xs text-gray-500">{worker.intro?.split(' ')[0] || '工友'}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <input type="password" placeholder="新密码" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button onClick={handleUpdatePassword} disabled={passLoading} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">{passLoading ? '...' : '修改'}</button>
          </div>
        )}

        <button onClick={onLogout} className="w-full mt-10 py-3 text-red-500 font-bold bg-white border border-red-100 rounded-xl">退出登录</button>
      </div>
    </div>
  );
}
