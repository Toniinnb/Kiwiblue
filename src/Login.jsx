import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Loader2, Sparkles, Gift } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // 新增：邀请码状态
  const [referralCode, setReferralCode] = useState('');

  // 1. 自动从 URL 获取邀请码 (例如: app.com/?ref=188xxxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsSignUp(true); // 如果有邀请码，大概率是新用户，自动切到注册页
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // === 注册流程 ===
      // 1. 注册账号
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 把邀请码先存到用户元数据里，或者存到 localStorage 留给 Onboarding 用
          data: { referral_code: referralCode } 
        }
      });
      
      if (error) {
        alert(error.message);
      } else {
        alert("注册成功！请检查邮箱完成验证，或直接登录（如果是测试环境）。");
        // 为了确保 Onboarding 能拿到邀请码，我们存个 localStorage
        if (referralCode) localStorage.setItem('kiwi_referral_code', referralCode);
      }
    } else {
      // === 登录流程 ===
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-blue-500 shadow-lg mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">KiwiBlue</h1>
          <p className="text-blue-100">新西兰建筑招工神器</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-blue-200 ml-1">邮箱</label>
            <input 
              type="email" 
              required 
              className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:border-white/50 outline-none transition-all mt-1"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-blue-200 ml-1">密码</label>
            <input 
              type="password" 
              required 
              className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:border-white/50 outline-none transition-all mt-1"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* 新增：邀请码输入框 (仅注册时显示) */}
          {isSignUp && (
            <div className="animate-fade-in">
              <label className="text-sm font-medium text-yellow-300 ml-1 flex items-center gap-1">
                <Gift size={14}/> 邀请码 (选填)
              </label>
              <input 
                type="text" 
                className="w-full px-5 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 focus:bg-yellow-500/20 outline-none transition-all mt-1 text-yellow-100 placeholder-yellow-200/50"
                placeholder="填写朋友的手机号"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
              />
            </div>
          )}

          {isSignUp && (
             <div className="flex items-start gap-2 mt-4 opacity-80">
               <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               <label htmlFor="terms" className="text-xs text-blue-100">
                 我已年满 18 岁，并同意 KiwiBlue 的<a href="#" className="underline font-bold hover:text-white">服务条款</a>与<a href="#" className="underline font-bold hover:text-white">隐私政策</a>。
               </label>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-6 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? '立即注册' : '登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
          >
            {isSignUp ? '已有账号？点此登录' : '没有账号？免费注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
