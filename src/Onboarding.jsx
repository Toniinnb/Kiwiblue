import React, { useState } from 'react';
import { supabase } from './supabase';
import { User, Building2, Hammer, Loader2, Gift, ArrowLeft } from 'lucide-react';
import AvatarUpload from './AvatarUpload'; 
import { useConfig } from './ConfigContext'; // 引入 Hook

export default function Onboarding({ session, onComplete }) {
  const config = useConfig(); // 获取配置
  const [step, setStep] = useState(1); 
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
    phone: '',
    wechat: '',
    jobType: '', rate: '', experience: '', orgType: 'employer', referralCode: ''
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert("称呼和手机号必填！");
    if (role === 'worker' && (!formData.jobType || !formData.rate)) return alert("请补全信息");

    setLoading(true);

    const updates = {
      id: session.user.id,
      role: role,
      name: formData.name,
      avatar_url: formData.avatar_url,
      phone: formData.phone,
      wechat: formData.wechat,
      org_type: role === 'boss' ? formData.orgType : null,
      intro: role === 'worker' ? `${formData.jobType} ${formData.rate}/hr` : null, 
      experience: role === 'worker' ? formData.experience : null,
      is_verified: false,
      updated_at: new Date(),
      swipes_used_today: 0,
      swipe_quota_extra: 0,
      last_active_date: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) { alert('保存失败: ' + error.message); setLoading(false); return; }

    if (formData.referralCode) {
      await supabase.rpc('apply_referral', {
        referrer_phone: formData.referralCode,
        new_user_role: role,
        new_user_id: session.user.id
      });
    } else {
        // 尝试从 localStorage 拿
        const storedRef = localStorage.getItem('kiwi_referral_code');
        if (storedRef) {
             await supabase.rpc('apply_referral', {
                referrer_phone: storedRef,
                new_user_role: role,
                new_user_id: session.user.id
             });
             localStorage.removeItem('kiwi_referral_code'); // 用完即焚
        }
    }

    onComplete(); 
    setLoading(false);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">您是来...</h2>
        <p className="text-gray-500 mb-8">请选择您的身份以开始</p>
        <div className="grid gap-6 w-full max-w-sm">
          {/* === 动态角色名 === */}
          <button onClick={() => handleRoleSelect('worker')} className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all flex items-center gap-4 text-left group">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Hammer size={32} /></div>
            <div><h3 className="text-xl font-bold text-gray-900">我是{config.role_worker_label}</h3><p className="text-sm text-gray-500 mt-1">{config.role_worker_desc}</p></div>
          </button>
          <button onClick={() => handleRoleSelect('boss')} className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all flex items-center gap-4 text-left group">
            <div className="p-4 rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Building2 size={32} /></div>
            <div><h3 className="text-xl font-bold text-gray-900">我是{config.role_boss_label}</h3><p className="text-sm text-gray-500 mt-1">{config.role_boss_desc}</p></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-10 animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-bold text-gray-900">完善资料</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center mb-6"><AvatarUpload url={formData.avatar_url} onUpload={(url) => setFormData({...formData, avatar_url: url})} role={role} size={100} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">怎么称呼您？</label><input type="text" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>

          {role === 'worker' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">工种</label><input type="text" required placeholder="如：木工" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">期望时薪</label><input type="number" required placeholder="35" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">工作经验</label><input type="text" required placeholder="如：5年" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} /></div>
            </>
          )}

          {role === 'boss' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份类型</label>
              <div className="grid grid-cols-3 gap-2">
                {['employer', 'agency', 'individual'].map((type) => (
                  <button key={type} type="button" onClick={() => setFormData({...formData, orgType: type})} className={`py-2 px-1 text-sm rounded-lg border ${formData.orgType === type ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'}`}>{type === 'employer' && '企业直招'}{type === 'agency' && '人力中介'}{type === 'individual' && '个人房东'}</button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4"></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">手机号 <span className="text-red-500">*</span></label><input type="tel" required placeholder="必填" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">微信号 <span className="text-gray-400 font-normal">(选填)</span></label><input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none" value={formData.wechat} onChange={e => setFormData({...formData, wechat: e.target.value})} /></div>

          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
             <label className="block text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2"><Gift size={16}/> 邀请人手机号 (选填)</label>
             <input type="tel" placeholder={role === 'boss' ? `填邀请人，立得 10 ${config.currency_name}` : "填邀请人，立得额外机会"} className="w-full px-4 py-2 rounded-lg bg-white border border-yellow-200 outline-none text-sm" value={formData.referralCode} onChange={e => setFormData({...formData, referralCode: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 mt-6 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all flex justify-center items-center shadow-lg shadow-blue-500/30">
            {loading ? <Loader2 className="animate-spin mr-2" /> : '完成入驻'}
          </button>
        </form>
      </div>
    </div>
  );
}
