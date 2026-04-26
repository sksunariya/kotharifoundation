import { createContext, useContext, useEffect, useState } from 'react';
import { configAPI } from '../api/endpoints';

const SiteConfigContext = createContext(null);

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    configAPI.getPublic()
      .then(res => setConfig(res.data.config))
      .catch(() => {});
  }, []);

  // Apply favicon dynamically whenever faviconUrl changes
  useEffect(() => {
    if (!config?.faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.faviconUrl;
  }, [config?.faviconUrl]);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
