import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Send, X, Loader2 } from 'lucide-react';

export default function Chat({ session, otherUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // 加载历史消息并开启监听
  useEffect(() => {
    fetchMessages();

    // 开启实时订阅
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // 如果新消息是属于我们当前对话的
        const msg = payload.new;
        if (
          (msg.sender_id === session.user.id && msg.receiver_id === otherUser.id) ||
          (msg.sender_id === otherUser.id && msg.receiver_id === session.user.id)
        ) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: true });
    
    // 客户端再过滤一次，确保只显示和当前 otherUser 的对话
    // (也可以在 SQL 里写复杂 OR，但这里简单处理)
    const chatHistory = data ? data.filter(m => 
      (m.sender_id === session.user.id && m.receiver_id === otherUser.id) ||
      (m.sender_id === otherUser.id && m.receiver_id === session.user.id)
    ) : [];

    setMessages(chatHistory);
    setLoading(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage(''); // 乐观更新 UI (虽然我们主要靠 real-time 回调，但清空输入框要快)

    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: otherUser.id,
      content: text
    });

    if (error) alert("发送失败: " + error.message);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-slide-up sm:max-w-md sm:mx-auto sm:border-x">
      {/* Header */}
      <div className="px-4 py-3 bg-white shadow-sm flex justify-between items-center border-b z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
             {otherUser.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-gray-400 font-bold">{otherUser.name?.[0]}</div>}
          </div>
          <div>
            <div className="font-bold text-gray-900">{otherUser.name}</div>
            <div className="text-xs text-green-500 flex items-center gap-1">● 在线</div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">开始和 {otherUser.name} 聊天吧！</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === session.user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            placeholder="输入消息..." 
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
