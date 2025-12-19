import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Loader2 } from 'lucide-react';

const ConfigContext = createContext();

const defaultConfig = {
  app_name: 'KiwiBlue',
  app_slogan: '建筑招工神器',
  logo_url: '',
  role_worker_label: '工友',
  role_boss_label: '老板',
  role_worker_desc: '找活、接单',
  role_boss_desc: '招人、发帖',
  currency_name: '币',
  vip_label: 'VIP',
  service_wechat: 'Kiwi_Admin_001'
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await supabase.from('app_config').select('*');
        if (data && data.length > 0) {
          const configMap = data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          setConfig({ ...defaultConfig, ...configMap });
        }
      } catch (e) {
        console.error("加载配置失败:", e);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
