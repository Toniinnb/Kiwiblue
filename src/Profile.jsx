import React, { useState } from 'react';
import { supabase } from './supabase';
import { X, LogOut, Lock, UserCog, ShieldAlert, Loader2 } from 'lucide-react';

export default function Profile({ session, userProfile, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('info'); // info 或 password
  
  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert("密码至少需要6位");
    setPassLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) alert("修改失败: " + error.message);
    else {
      alert("密码修改成功！下次请用新密码登录。");
      setNewPassword('');
    }
    setPassLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-slide-in-right">
      {/* 顶部导航 */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">个人中心</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 个人信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-2xl font-bold mb-3">
            {userProfile?.name?.[0] || "我"}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{userProfile?.name}</h3>
          <p className="text-gray-500 text-sm mt-1">
            {userProfile?.role === 'boss' ? '老板 / 雇主' : '工友 / 求职者'}
          </p>
          <p className="text-gray-400 text-xs mt-1">{session.user.email}</p>
          
          {/* 认证状态提示 */}
          {!userProfile?.is_verified && (
            <div className="mt-4 bg-orange-50 text-orange-600 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-2">
              <ShieldAlert size={14} />
              <span>账号未认证 (发布受限)</span>
            </div>
          )}
        </div>

        {/* 菜单切换 */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            基本资料
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            安全设置
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'info' ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-gray-400 mb-1">手机号</div>
              <div className="text-gray-900 font-medium">{userProfile?.phone}</div>
            </div>
            
            {userProfile?.role === 'worker' && (
              <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">求职状态</div>
                  <div className="text-gray-900 font-medium">
                    {userProfile?.status === 'busy' ? '🚫 已忙碌 (不接单)' : '✅ 找活中 (可接单)'}
                  </div>
                </div>
                {/* 状态切换按钮 (未来对接API) */}
                <button className="text-blue-600 text-sm font-bold">切换</button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Lock size={18} /> 修改登录密码
            </h4>
            <div>
              <input 
                type="password" 
                placeholder="请输入新密码 (至少6位)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <button 
              onClick={handleUpdatePassword}
              disabled={passLoading}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 flex justify-center"
            >
              {passLoading ? <Loader2 className="animate-spin" /> : '确认修改'}
            </button>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="w-full mt-10 py-3 text-red-500 font-bold bg-white border border-red-100 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> 退出登录
        </button>
      </div>
    </div>
  );
}
