import React, { useState } from 'react';
import { supabase } from './supabase';
import { X, Loader2, MapPin, DollarSign } from 'lucide-react';

export default function PostJob({ session, onClose, onPostSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    wage: '',
    location: '',
    tags: [] // 选中的标签
  });

  // 预设标签供老板快速选择
  const PRESET_TAGS = ["长期", "短期/日结", "包接送", "可现金", "需有车", "提供午餐"];

  const toggleTag = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else {
      if (formData.tags.length >= 3) return alert("最多选3个标签");
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.wage || !formData.location) return alert("请补全信息");

    setLoading(true);

    const { error } = await supabase.from('jobs').insert({
      boss_id: session.user.id,
      title: formData.title,
      wage: formData.wage.includes('$') ? formData.wage : `$${formData.wage}/hr`, // 自动补全格式
      location: formData.location,
      tags: formData.tags
    });

    if (error) {
      alert('发布失败: ' + error.message);
    } else {
      alert('发布成功！工友们马上就能看到。');
      onPostSuccess(); // 通知父组件刷新
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
        
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">发布招工</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">招工标题</label>
            <input
              type="text"
              placeholder="如：北岸工地招熟手木工"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时薪 ($/hr)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  placeholder="35"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                  value={formData.wage}
                  onChange={e => setFormData({...formData, wage: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工地位置</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="如: Albany"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">福利标签 (选填, 最多3个)</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : '立即发布'}
          </button>
        </form>
      </div>
    </div>
  );
}
