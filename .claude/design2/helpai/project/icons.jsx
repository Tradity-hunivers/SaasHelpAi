/* Icons — thin 1.5 stroke, minimal, custom */
const Icon = ({ name, size = 16, className = "" }) => {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    acquisition: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    sales: <><path d="M3 7h18M3 12h12M3 17h6"/></>,
    pipeline: <><path d="M4 5h16l-6 8v6l-4-2v-4z"/></>,
    ai: <><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></>,
    customers: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6"/><circle cx="17" cy="6" r="2.5"/><path d="M15 12.5c2.5 0 5 1.5 6 4.5"/></>,
    automations: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><rect x="8" y="8" width="8" height="8" rx="2"/></>,
    integrations: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/></>,
    team: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c.5-3 2.8-5 6-5s5.5 2 6 5M14 20c.5-2 2-3 4-3s3.5 1 4 3"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16z"/><path d="M10 20c.5 1 1.2 1.5 2 1.5s1.5-.5 2-1.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chev: <><path d="m9 6 6 6-6 6"/></>,
    chevDown: <><path d="m6 9 6 6 6-6"/></>,
    filter: <><path d="M4 5h16l-6 8v6l-4-2v-4z"/></>,
    download: <><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/></>,
    share: <><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/></>,
    more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    up: <><path d="m6 15 6-6 6 6"/></>,
    check: <><path d="m5 12 5 5 9-12"/></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
    external: <><path d="M10 4H5v15h15v-5M15 3h6v6M21 3 10 14"/></>,
    sparkles: <><path d="M12 3v4M12 17v4M5 12H1M23 12h-4M7 7 4.5 4.5M19.5 19.5 17 17M17 7l2.5-2.5M4.5 19.5 7 17"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>,
    moon: <><path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    zap: <><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></>,
    inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2M5 4h14l3 8v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7z"/></>,
    play: <><path d="M6 4v16l14-8z"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
};

window.Icon = Icon;
