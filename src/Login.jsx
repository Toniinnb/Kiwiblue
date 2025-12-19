import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Loader2, Sparkles, Gift } from 'lucide-react';
import { useConfig } from './ConfigContext'; // 引入 Hook

export default function Login() {
  const config = useConfig(); // 获取配置
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsSignUp(true);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { referral_code: referralCode } }
      });
      if (error) alert(error.message);
      else {
        alert("注册成功！请检查邮箱或直接登录。");
        if (referralCode) localStorage.setItem('kiwi_referral_code', referralCode);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          {/* === 动态 Logo === */}
          {config.logo_url ? (
            <img src={config.logo_url} className="h-16 mx-auto mb-4 rounded-xl shadow-lg" alt="Logo"/>
          ) : (
            <div className="inline-block p-4 rounded-2xl bg-blue-500 shadow-lg mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
          )}
          
          {/* === 动态文字 === */}
          <h1 className="text-3xl font-bold mb-2">{config.app_name}</h1>
          <p className="text-blue-100">{config.app_slogan}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-blue-200 ml-1">邮箱</label>
            <input type="email" required className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 outline-none transition-all mt-1" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-blue-200 ml-1">密码</label>
            <input type="password" required className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 outline-none transition-all mt-1" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {isSignUp && (
            <div className="animate-fade-in">
              <label className="text-sm font-medium text-yellow-300 ml-1 flex items-center gap-1"><Gift size={14}/> 邀请码 (选填)</label>
              <input type="text" className="w-full px-5 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 outline-none transition-all mt-1 text-yellow-100" placeholder="填写朋友的手机号" value={referralCode} onChange={e => setReferralCode(e.target.value)} />
            </div>
          )}

          {isSignUp && (
             <div className="flex items-start gap-2 mt-4 opacity-80">
               <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-gray-300" />
               <label htmlFor="terms" className="text-xs text-blue-100">我已年满 18 岁，并同意 {config.app_name} 的服务条款。</label>
             </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-4 mt-6 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? '立即注册' : '登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-200 hover:text-white text-sm font-medium transition-colors">
            {isSignUp ? '已有账号？点此登录' : '没有账号？免费注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
