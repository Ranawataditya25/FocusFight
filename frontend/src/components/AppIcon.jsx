import React from 'react';
import { 
  SiSnapchat, SiInstagram, SiYoutube, SiFacebook,
  SiSpotify, SiNetflix, SiDiscord, SiTelegram, 
  SiPinterest, SiReddit, SiThreads, SiGooglechrome, SiWhatsapp 
} from 'react-icons/si';
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { FiSmartphone } from 'react-icons/fi';

export const appOptions = [
  'Snapchat', 'Instagram', 'YouTube', 'Facebook', 'LinkedIn',
  'Threads', 'WhatsApp', 'Chrome', 'X', 'Reddit', 'Pinterest', 'Telegram', 'Discord', 'Netflix', 'Spotify'
];

export function RealAppIcon({ appName }) {
  const normalized = appName.toLowerCase();
  
  // Charcoal color in Light mode, crisp white in Dark mode
  const styleClasses = "w-6 h-6 transition-colors duration-200 text-slate-800 dark:text-slate-100";

  switch (normalized) {
    case 'snapchat': return <SiSnapchat className={styleClasses} style={{ color: '#FFFC00' }} />;
    case 'instagram': return <SiInstagram className={styleClasses} />;
    case 'youtube': return <SiYoutube className={styleClasses} style={{ color: '#FF0000' }} />;
    case 'facebook': return <SiFacebook className={styleClasses} style={{ color: '#1877F2' }} />;
    case 'linkedin': return <FaLinkedinIn className={styleClasses} style={{ color: '#0A66C2' }} />;
    case 'spotify': return <SiSpotify className={styleClasses} style={{ color: '#1ED760' }} />;
    case 'netflix': return <SiNetflix className={styleClasses} style={{ color: '#E50914' }} />;
    case 'discord': return <SiDiscord className={styleClasses} style={{ color: '#5865F2' }} />;
    case 'telegram': return <SiTelegram className={styleClasses} style={{ color: '#26A5E4' }} />;
    case 'pinterest': return <SiPinterest className={styleClasses} style={{ color: '#BD081C' }} />;
    case 'reddit': return <SiReddit className={styleClasses} style={{ color: '#FF4500' }} />;
    case 'threads': return <SiThreads className={styleClasses} />;
    case 'x': 
    case 'twitter': return <FaXTwitter className={styleClasses} />;
    case 'chrome': return <SiGooglechrome className={styleClasses} />;
    case 'whatsapp': return <SiWhatsapp className={styleClasses} style={{ color: '#25D366' }} />;
    default: return <FiSmartphone className={styleClasses} />;
  }
}
