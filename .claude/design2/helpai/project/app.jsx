/* App shell + sidebar + routing */

/* NAV is built dynamically per workspace (Client / Agence) */
function buildNav(workspace) {
  const nav = [
    { group: "Tableau de bord", items: [
      { id: "overview", label: "Vue d'ensemble", icon: "overview" },
      { id: "acquisition", label: "Acquisition", icon: "acquisition", badge: "24" },
      { id: "sales", label: "Ventes", icon: "sales" },
    ]},
    { group: "Intelligence", items: [
      { id: "ai", label: "Activité IA", icon: "ai", badge: "Live" },
    ]},
    { group: "Infrastructure", items: [
      { id: "architecture", label: "Architecture", icon: "integrations" },
    ]},
    { group: "Écosystème", items: [
      { id: "customers", label: "CRM", icon: "customers", badge: "156" },
      { id: "integrations", label: "Intégrations", icon: "integrations" },
    ]},
  ];
  if (workspace === "agency") {
    // Automations visible uniquement dans la vue Agence
    nav[1].items.push({ id: "automations", label: "Automations", icon: "automations", badge: "24" });
  }
  return nav;
}

const SCREEN_META = {
  overview: { title: "Vue d'ensemble", sub: "Performance globale · Avr 2025 → Mar 2026", breadcrumb: "Tableau de bord" },
  acquisition: { title: "Acquisition", sub: "Leads, canaux, campagnes et funnel", breadcrumb: "Tableau de bord" },
  sales: { title: "Ventes", sub: "Performance commerciale et CA signé", breadcrumb: "Tableau de bord" },
  ai: { title: "Activité IA", sub: "Agent HelpAi · 8 547 tâches ce mois", breadcrumb: "Intelligence" },
  automations: { title: "Automations", sub: "Workflows et déclencheurs", breadcrumb: "Intelligence" },
  customers: { title: "CRM", sub: "Leads entrants, prospects et clients", breadcrumb: "Écosystème" },
  architecture: { title: "Architecture", sub: "Infrastructure HelpAi — 5 piliers, 28 automations", breadcrumb: "Infrastructure" },
  integrations: { title: "Intégrations", sub: "9 services connectés", breadcrumb: "Écosystème" },
};

/* Tweakable defaults */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accentHue": 55,
  "density": "normal",
  "workspace": "client",
  "editMode": false
}/*EDITMODE-END*/;

/* EditContext lets any field opt into manual editing in Vue Agence.
   Must live on window so editable.jsx (separate Babel scope) sees the same context object.
   Namespaced to avoid collision with the native browser EditContext API. */
const EditContext = window.__HelpAi_EditContext || React.createContext({ editing: false });
window.__HelpAi_EditContext = EditContext;

function App() {
  const [tw, setTw] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState("overview");

  // Apply theme + accent hue
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", tw.theme);
    document.documentElement.style.setProperty("--accent", `oklch(${tw.theme === "dark" ? "0.74" : "0.62"} 0.155 ${tw.accentHue})`);
    document.documentElement.style.setProperty("--accent-2", `oklch(${tw.theme === "dark" ? "0.80" : "0.70"} 0.120 ${tw.accentHue + 5})`);
    document.documentElement.style.setProperty("--accent-soft", `oklch(${tw.theme === "dark" ? "0.74" : "0.62"} 0.155 ${tw.accentHue} / 0.12)`);
    document.documentElement.style.setProperty("--accent-border", `oklch(${tw.theme === "dark" ? "0.74" : "0.62"} 0.155 ${tw.accentHue} / 0.35)`);
  }, [tw.theme, tw.accentHue]);

  const meta = SCREEN_META[screen];

  // If user is on a screen no longer available (e.g. switched workspace away from automations)
  React.useEffect(() => {
    if (tw.workspace === "client" && screen === "automations") setScreen("overview");
  }, [tw.workspace, screen]);

  const isAgency = tw.workspace === "agency";
  const editing = isAgency && tw.editMode;

  const renderScreen = () => {
    switch (screen) {
      case "overview": return <ScreenOverview/>;
      case "acquisition": return <ScreenAcquisition/>;
      case "sales": return <ScreenSales/>;
      case "ai": return <ScreenAI/>;
      case "automations": return isAgency ? <ScreenAutomations/> : <ScreenOverview/>;
      case "customers": return <ScreenCustomers/>;
      case "architecture": return <ScreenArchitecture/>;
      case "integrations": return <ScreenIntegrations/>;
      default: return <ScreenOverview/>;
    }
  };

  const NAV = buildNav(tw.workspace);

  return (
    <>
      <div className="app">
        {/* ============ SIDEBAR ============ */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <img src={(window.__resources && window.__resources.logoImg) || "assets/logo.png"} alt="HelpAi"/>
            </div>
            <div>
              <div className="brand-name">HelpAi</div>
              <div className="brand-sub">Business Copilot</div>
            </div>
          </div>

          <div className="workspace-switch">
            <div className="workspace-avatar">MN</div>
            <div className="workspace-info">
              <EditableText value="Maison Noir" tag="div" className="workspace-name" editing={editing}/>
              <div className="workspace-role">{isAgency ? "Agence · Premium" : "Espace client"}</div>
            </div>
            <Icon name="chevDown" size={14} className="workspace-chev"/>
          </div>

          <div className="seg">
            <button className={tw.workspace === "client" ? "active" : ""} onClick={() => setTw("workspace", "client")}>Vue Client</button>
            <button className={tw.workspace === "agency" ? "active" : ""} onClick={() => setTw("workspace", "agency")}>Vue Agence</button>
          </div>

          <div className="stack-md" style={{ flex: 1, overflow: "auto" }}>
            {NAV.map((g, gi) => (
              <div key={gi} className="nav-group">
                <div className="nav-label">{g.group}</div>
                {g.items.map(it => (
                  <div
                    key={it.id}
                    className={"nav-item " + (screen === it.id ? "active" : "")}
                    onClick={() => setScreen(it.id)}
                  >
                    <Icon name={it.icon} size={16} className="nav-icon"/>
                    <span>{it.label}</span>
                    {it.badge && <span className="nav-badge">{it.badge}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="plan-usage">
              <span>Plan Pro · Tâches IA</span>
              <span className="mono">8 547 / 15 000</span>
            </div>
            <div className="usage-bar"><div style={{ width: "57%" }}/></div>
            <div className="small muted" style={{ marginTop: 8, fontSize: 10.5 }}>
              Renouvelé dans 6 jours
            </div>
          </div>
        </aside>

        {/* ============ MAIN ============ */}
        <div className="main">
          <div className="topbar">
            <div className="crumbs">
              <span>{meta.breadcrumb}</span>
              <span className="crumb-sep">/</span>
              <strong>{meta.title}</strong>
            </div>
            <div className="spacer"/>
            <div className="search">
              <Icon name="search" size={14}/>
              <span>Chercher un deal, un client, une tâche…</span>
              <kbd>⌘K</kbd>
            </div>
            <button className="btn"><Icon name="calendar" size={14}/> Mar 2026</button>
            {isAgency && (
              <button
                className={"btn " + (tw.editMode ? "primary" : "")}
                onClick={() => setTw("editMode", !tw.editMode)}
                title="Activer l'édition manuelle"
              >
                <Icon name={tw.editMode ? "check" : "edit"} size={13}/>
                {tw.editMode ? "Terminer l'édition" : "Modifier"}
              </button>
            )}
            <button className="btn icon ghost" onClick={() => setTw("theme", tw.theme === "dark" ? "light" : "dark")}>
              <Icon name={tw.theme === "dark" ? "sun" : "moon"} size={14}/>
            </button>
            <button className="btn icon ghost"><Icon name="bell" size={14}/></button>
            <span className={"av md av-colors-3"}>MN</span>
          </div>

          {editing && (
            <div className="edit-banner">
              <Icon name="edit" size={13}/>
              <span><strong>Mode édition activé.</strong> Cliquez sur n'importe quelle valeur, KPI, nom ou description pour la modifier directement.</span>
              <button className="btn small ghost" onClick={() => setTw("editMode", false)}>Quitter</button>
            </div>
          )}
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">{meta.title}</h1>
                <div className="page-sub">{meta.sub}</div>
              </div>
              <div className="page-actions">
                <button className="btn"><Icon name="refresh" size={13}/> Actualiser</button>
                <button className="btn"><Icon name="share" size={13}/> Partager</button>
                <button className="btn"><Icon name="download" size={13}/> Exporter</button>
                <button className="btn primary"><Icon name="sparkles" size={13}/> Demander à l'IA</button>
              </div>
            </div>
            <EditContext.Provider value={{ editing }}>
              {renderScreen()}
            </EditContext.Provider>
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks HelpAi">
        <TweakSection title="Apparence">
          <TweakRadio
            label="Thème"
            value={tw.theme}
            options={[{ value: "dark", label: "Sombre" }, { value: "light", label: "Clair" }]}
            onChange={v => setTw("theme", v)}
          />
          <TweakSlider
            label="Teinte d'accent"
            value={tw.accentHue}
            min={0} max={360} step={1}
            onChange={v => setTw("accentHue", v)}
          />
        </TweakSection>
        <TweakSection title="Navigation">
          <TweakRadio
            label="Workspace"
            value={tw.workspace}
            options={[{ value: "client", label: "Client" }, { value: "agency", label: "Agence" }]}
            onChange={v => setTw("workspace", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
