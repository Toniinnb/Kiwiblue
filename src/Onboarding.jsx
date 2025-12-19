import React, { useState } from 'react';
import { supabase } from './supabase';
import { User, Building2, Hammer, Briefcase, Loader2 } from 'lucide-react';

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(1); // 1: 选身份, 2: 填资料
  const [role, setRole] = useState(null); // 'worker' 或 'boss'
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wechat: '',
    // 工友特有
    jobType: '', // 工种
    rate: '',    // 期望薪资
    experience: '', // 工作经验
    // 老板特有
    orgType: 'employer', // 默认企业直招
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert("称呼和手机号必填！");
    if (role === 'worker' && (!formData.jobType || !formData.rate)) return alert("请补全求职信息");

    setLoading(true);

    const updates = {
      id: session.user.id,
      role: role,
      name: formData.name,
      phone: formData.phone,
      wechat: formData.wechat,
      // 只有老板才存 org_type, 只有工人才存工种/薪资/经验
      // 我们统一把工种等信息存进 jsonb 字段或者专用字段，这里简单起见，如果是老板，jobType 为空
      org_type: role === 'boss' ? formData.orgType : null,
      intro: role === 'worker' ? `${formData.jobType} | ${formData.experience}` : null, 
      // 注意：数据库里暂时没专门开 jobType 字段，我们借用 intro 或 tags，或者为了省事，MVP阶段先不存那么细，
      // 只要把 core profile 存进去就行。下面是关键字段：
      experience: role === 'worker' ? formData.experience : null,
      is_verified: false, // 老板默认未认证
      updated_at: new Date(),
    };

    // 如果是工人，我们把工种和薪资拼接到 tags 里，或者存入 intro，方便显示
    // 修正：为了让 App.jsx 能读到，我们把工种存入 intro (简介) 字段
    if (role === 'worker') {
        updates.intro = `${formData.jobType} ${formData.rate}/hr`;
    }

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert('保存失败: ' + error.message);
    } else {
      // 成功！通知 App.jsx 刷新
      onComplete();
    }
    setLoading(false);
  };

  // === 界面 1: 身份二选一 ===
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">您是来...</h2>
        <p className="text-gray-500 mb-8">请选择您的身份以开始</p>

        <div className="grid gap-6 w-full max-w-sm">
          {/* 工友卡片 */}
          <button 
            onClick={() => handleRoleSelect('worker')}
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all flex items-center gap-4 text-left group"
          >
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Hammer size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">我是工友</h3>
              <p className="text-sm text-gray-500 mt-1">找活、接单、看工地</p>
            </div>
          </button>

          {/* 老板卡片 */}
          <button 
            onClick={() => handleRoleSelect('boss')}
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all flex items-center gap-4 text-left group"
          >
            <div className="p-4 rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Building2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">我是老板</h3>
              <p className="text-sm text-gray-500 mt-1">招人、发帖、赶工期</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // === 界面 2: 填写资料 ===
  return (
    <div className="min-h-screen bg-white px-6 py-10 animate-slide-up">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          完善{role === 'worker' ? '求职' : '招工'}资料
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. 称呼 (通用) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">怎么称呼您？</label>
            <input
              type="text"
              required
              placeholder={role === 'worker' ? "如：老王、Alex" : "如：张总、李经理"}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* 工友专属字段 */}
          {role === 'worker' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工种</label>
                  <input
                    type="text"
                    required
                    placeholder="如：木工"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                    value={formData.jobType}
                    onChange={e => setFormData({...formData, jobType: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">期望时薪</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      required
                      placeholder="35"
                      className="w-full pl-7 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                      value={formData.rate}
                      onChange={e => setFormData({...formData, rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工作经验</label>
                <input
                  type="text"
                  required
                  placeholder="如：5年、新手、大师傅"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                  value={formData.experience}
                  onChange={e => setFormData({...formData, experience: e.target.value})}
                />
              </div>
            </>
          )}

          {/* 老板专属字段 */}
          {role === 'boss' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份类型</label>
              <div className="grid grid-cols-3 gap-2">
                {['employer', 'agency', 'individual'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, orgType: type})}
                    className={`py-2 px-1 text-sm rounded-lg border ${
                      formData.orgType === type 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' 
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {type === 'employer' && '企业直招'}
                    {type === 'agency' && '人力中介'}
                    {type === 'individual' && '个人房东'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4"></div>

          {/* 联系方式 (通用) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号 <span className="text-red-500">*</span></label>
            <input
              type="tel"
              required
              placeholder="必填，方便联系"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">微信号 <span className="text-gray-400 font-normal">(选填，推荐)</span></label>
            <input
              type="text"
              placeholder="方便大家加微信"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              value={formData.wechat}
              onChange={e => setFormData({...formData, wechat: e.target.value})}
            />
          </div>

          {role === 'boss' && (
             <p className="text-xs text-orange-500 bg-orange-50 p-2 rounded mt-2">
               ⚠️ 注意：完成入驻后默认为“未认证”状态。建议稍后联系客服进行企业认证，以获得更多工友信任。
             </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center shadow-lg shadow-blue-500/30"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : '完成入驻'}
          </button>
        </form>
      </div>
    </div>
  );
}
