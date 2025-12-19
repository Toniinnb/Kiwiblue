import React, { useState } from 'react';
import { Hammer, Loader2 } from 'lucide-react';
import { supabase } from './supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // 切换 登录/注册 模式

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // 注册逻辑
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) alert(error.message);
      else alert("注册成功！请直接登录。");
    } else {
      // 登录逻辑
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 背景图效果 */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <div className="z-10 w-full max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-blue-600 text-white">
            <Hammer size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isSignUp ? '加入 KiwiBlue' : '欢迎回来'}
        </h2>
        <p className="text-gray-300 text-center mb-8 text-sm">
          新西兰华人工友直聘平台
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="请输入邮箱 / 手机号(假)"
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all flex justify-center items-center shadow-lg shadow-blue-500/30"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? '立即注册' : '登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-300 hover:text-white transition-colors"
          >
            {isSignUp ? '已有账号？去登录' : '还没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
