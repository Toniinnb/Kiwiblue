import React, { useState } from 'react';
import { Hammer, Loader2 } from 'lucide-react';
import { supabase } from './supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusText, setStatusText] = useState('登录 / 注册');

  const handleSmartAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("请填写账号和密码");
    
    setLoading(true);
    setStatusText('正在处理...');

    // 1. 先尝试注册
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // 2. 如果报错说“用户已存在”，自动转去登录
      if (signUpError.message.includes("already registered") || signUpError.status === 400 || signUpError.status === 422) {
        setStatusText('检测到老友，正在登录...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          alert("登录失败：密码错误，或者请检查邮箱");
          setStatusText('登录 / 注册');
        }
      } else {
        alert("注册失败：" + signUpError.message);
        setStatusText('登录 / 注册');
      }
    } else {
      alert("新账号注册成功！正在进入...");
    }
    
    setLoading(false);
  };

  return (
    /* 关键修复：
       1. min-h-screen: 强制高度至少为屏幕高度
       2. w-screen: 强制宽度为屏幕宽度
       3. fixed inset-0: 像钉子一样钉在屏幕四角，防止滑动
    */
    <div className="fixed inset-0 min-h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* 背景图 */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* 登录框主体 */}
      <div className="z-10 w-full max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/50">
            <Hammer size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          KiwiBlue 工友
        </h2>
        <p className="text-gray-300 text-center mb-8 text-sm">
          自动识别注册或登录
        </p>

        <form onSubmit={handleSmartAuth} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="手机号 / 邮箱"
              className="w-full px-4 py-3.5 rounded-xl bg-white/20 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              className="w-full px-4 py-3.5 rounded-xl bg-white/20 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg hover:from-blue-700 hover:to-blue-600 active:scale-95 transition-all flex justify-center items-center shadow-lg shadow-blue-500/30"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {statusText}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            点击按钮即代表同意 <span className="underline">服务条款</span>
          </p>
        </div>
      </div>
    </div>
  );
}
