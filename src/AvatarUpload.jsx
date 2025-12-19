import React, { useState } from 'react';
import { supabase } from './supabase';
import { Camera, Loader2, User, Building2 } from 'lucide-react';

export default function AvatarUpload({ url, onUpload, role, size = 150 }) {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('请选择图片');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公开链接
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onUpload(data.publicUrl);
      
    } catch (error) {
      alert("上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group mx-auto" style={{ width: size, height: size }}>
      {url ? (
        <img
          src={url}
          alt="Avatar"
          className="rounded-full object-cover w-full h-full border-4 border-white shadow-lg"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg text-gray-400">
          {role === 'boss' ? <Building2 size={size/2} /> : <User size={size/2} />}
        </div>
      )}

      {/* 上传遮罩 */}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <label className="cursor-pointer flex flex-col items-center text-white text-xs font-bold">
           {uploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
           <span className="mt-1">{uploading ? '上传中' : '更换'}</span>
           <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </label>
      </div>

      {/* 手机端提示 (总是显示一个小相机图标，因为手机没有hover) */}
      <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-md border-2 border-white sm:hidden pointer-events-none">
         <Camera size={14} />
      </div>
    </div>
  );
}
