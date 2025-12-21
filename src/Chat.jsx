import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Send, ChevronLeft, Loader2 } from 'lucide-react';

export default function Chat({ session, otherUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel(`chat:${session.user.id}-${otherUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${otherUser.id}`, 
      }, (payload) => {
        if (payload.new.receiver_id === session.user.id) {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
    setLoading(false);
    scrollToBottom();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const content = newMessage;
    setNewMessage(''); 

    // 1. 乐观更新 UI (先显示出来)
    const tempMsg = {
      id: Math.random(),
      sender_id: session.user.id,
      receiver_id: otherUser.id,
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    // 2. 发送给数据库
    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: otherUser.id,
      content: content
    });

    if (error) {
      alert("发送失败");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id)); // 撤回
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // === 在线状态逻辑 ===
  // 如果数据库里记录的最后活跃日期是今天，就认为在线
  const today = new Date().toISOString().split('T')[0];
  const isOnline = otherUser.last_active_date === today;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-100 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {otherUser.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{otherUser.name?.[0]}</div>}
        </div>
        <div>
          <div className="font-bold text-gray-900">{otherUser.name}</div>
          <div className="text-xs flex items-center gap-1">
            {/* 在线状态指示器 */}
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className={isOnline ? 'text-green-600' : 'text-gray-400'}>
              {isOnline ? '在线' : '离线'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-300 mt-20 text-sm">暂无消息，打个招呼吧</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === session.user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white p-3 border-t border-gray-100 flex gap-2 items-center safe-area-bottom">
        <input 
          type="text" 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="输入消息..." 
          className="flex-1 bg-gray-100 rounded-full px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 active:scale-95 transition-all">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
