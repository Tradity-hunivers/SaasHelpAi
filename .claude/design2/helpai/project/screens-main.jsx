/* Main screens: Overview, Acquisition, Sales, Pipeline, AI Activity, Customers, Automations, Integrations, Team */

const C = CHART_COLORS;

/* ============ Overview ============ */
function ScreenOverview() {
  const [range, setRange] = React.useState("12m");
  return (
    <div className="stack-lg fade-up">
      <div className="hero-panel">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <span className="tag accent">Copilote IA</span>
            <span className="small muted">Résumé quotidien — 24 avr. 2026</span>
          </div>
          <div className="hp-title">3 signaux forts aujourd'hui. Ton CA a dépassé l'objectif mensuel de +5.2%.</div>
          <div className="hp-sub">Le canal Meta Ads performe +38% vs la moyenne. 2 devis à relancer avant 18h. Thomas a 4 RDV à confirmer.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn"><Icon name="eye" size={14}/> Voir détails</button>
          <button className="btn primary"><Icon name="zap" size={14}/> Appliquer les 3</button>
        </div>
      </div>

      <div className="row between">
        <div className="chips">
          {["7j","30j","3m","12m","YTD"].map(r => (
            <button key={r} className={"chip " + (range === r ? "active" : "")} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="chip"><Icon name="filter" size={12}/> Tous canaux</button>
          <button className="chip">Toutes équipes</button>
        </div>
      </div>

      <div className="kpi-grid">
        {KPIS.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">
              <span>{k.label}</span>
              <span className={"trend " + k.dir}>{k.trend}</span>
            </div>
            <div className="kpi-value">
              <span className="mono">{k.value}</span>
              {k.unit && <span className="unit">{k.unit}</span>}
            </div>
            <div className="spark"><Sparkline data={k.spark} /></div>
          </div>
        ))}
      </div>

      <div className="grid g-2-1">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Évolution du chiffre d'affaires</div>
              <div className="card-sub">CA réalisé vs objectif · budget publicitaire</div>
            </div>
            <div className="chart-legend">
              <span className="lg" style={{ color: "var(--accent)" }}><span className="sw"/> CA</span>
              <span className="lg" style={{ color: "var(--accent-2)" }}><span className="sw"/> Budget</span>
              <span className="lg" style={{ color: "var(--text-3)" }}><span className="sw" style={{opacity: 0.5}}/> Objectif</span>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <LineChart
              data={REVENUE_DATA}
              height={320}
              series={[
                { key: "ca", label: "CA", color: "var(--accent)", fmt: v => Math.round(v/1000) + "k €" },
                { key: "goal", label: "Objectif", color: "var(--text-3)", dashed: true, fmt: v => Math.round(v/1000) + "k €" },
                { key: "ads", label: "Budget Ads", color: "var(--accent-2)", fmt: v => Math.round(v/1000) + "k €" },
              ]}
              xLabels={MONTHS}
              yFormat={v => (v/1000).toFixed(0) + "k"}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Résumé IA</div>
            <span className="tag accent"><Icon name="sparkles" size={10}/> Live</span>
          </div>
          <div className="card-body stack-md">
            {[
              { icon: "up", tone: "var(--success)", title: "Meta Ads performe +38%", body: "CPL descendu à 39€, en-dessous de l'objectif (47€)." },
              { icon: "zap", tone: "var(--accent)", title: "2 devis à relancer", body: "Dubois SAS et Café Central n'ont pas répondu à J+3." },
              { icon: "target", tone: "var(--info)", title: "Objectif Mars atteint à 105%", body: "Dépassé hier à 16h32. Reste 6j pour battre Fév." },
              { icon: "check", tone: "var(--success)", title: "8 547 tâches IA", body: "Équivalent à 14j de travail humain économisé ce mois." },
            ].map((s, i) => (
              <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start", paddingBottom: 14, borderBottom: i < 3 ? "1px solid var(--border-soft)" : "0" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "var(--surface-2)", color: s.tone,
                  display: "grid", placeItems: "center", flexShrink: 0
                }}>
                  <Icon name={s.icon} size={15}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.title}</div>
                  <div className="small muted">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {KPIS_B.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">
              <span>{k.label}</span>
              <span className={"trend " + k.dir}>{k.trend}</span>
            </div>
            <div className="kpi-value">
              <span className="mono">{k.value}</span>
              {k.unit && <span className="unit">{k.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Leads par mois</div>
            <div className="chart-legend">
              <span className="lg" style={{ color: "var(--accent)" }}><span className="sw"/> Ads</span>
              <span className="lg" style={{ color: "var(--success)" }}><span className="sw"/> Organique</span>
              <span className="lg" style={{ color: "var(--info)" }}><span className="sw"/> Referral</span>
            </div>
          </div>
          <div className="card-body">
            <BarChart
              data={LEADS_DATA} height={260} xLabels={MONTHS}
              series={[
                { key: "ads", color: "var(--accent)" },
                { key: "organic", color: "var(--success)" },
                { key: "referral", color: "var(--info)" },
              ]}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">ROAS & CPL</div>
            <div className="chart-legend">
              <span className="lg" style={{ color: "var(--success)" }}><span className="sw"/> ROAS</span>
              <span className="lg" style={{ color: "var(--accent)" }}><span className="sw"/> CPL (€)</span>
            </div>
          </div>
          <div className="card-body">
            <LineChart
              data={ROAS_DATA} height={260} xLabels={MONTHS}
              yFormat={v => v.toFixed(1) + "x"}
              dualAxis
              series={[
                { key: "roas", label: "ROAS", color: "var(--success)", fmt: v => v.toFixed(2) + "x" },
                { key: "cpl", label: "CPL", color: "var(--accent)", rightAxis: true, dashed: true, fmt: v => Math.round(v) + " €", rightFormat: v => Math.round(v) + "€" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid g-2-1">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Activité temps réel</div>
            <span className="pill live"><span className="dot"/> Live</span>
          </div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="act-row">
                <div className="act-dot" style={{ background: a.tag === "IA" ? "var(--accent)" : "var(--info)" }}/>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--text)" }}>{a.what}</div>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    <span className="tag" style={{ fontSize: 10, padding: "1px 6px" }}>{a.tag}</span>
                    <span style={{ marginLeft: 6 }}>{a.who}</span>
                  </div>
                </div>
                <div className="act-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Répartition des leads</div>
            <div className="card-sub">Mar 2026</div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative" }}>
              <DonutChart data={CHANNELS} size={180} thickness={20}/>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>6 632</div>
                <div className="small muted">leads</div>
              </div>
            </div>
            <div className="stack-sm" style={{ width: "100%" }}>
              {CHANNELS.map((c, i) => (
                <div key={i} className="row between" style={{ fontSize: 12 }}>
                  <span className="row" style={{ gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }}/>
                    {c.name}
                  </span>
                  <span className="mono muted">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Acquisition ============ */
function ScreenAcquisition() {
  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Budget total" value="82 700" unit="€" trend="+8.2%" dir="up"/>
        <KpiCard label="Leads générés" value="6 632" trend="+22.1%" dir="up"/>
        <KpiCard label="CPL moyen" value="39" unit="€" trend="-18.4%" dir="up"/>
        <KpiCard label="Conv. lead → deal" value="5.89" unit="%" trend="+0.8pt" dir="up"/>
      </div>

      {/* MAIN CHART */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Volume de leads par canal</div>
            <div className="card-sub">12 derniers mois · cumul mensuel</div>
          </div>
          <div className="chart-legend">
            <span className="lg" style={{ color: "var(--accent)" }}><span className="sw"/> Meta Ads</span>
            <span className="lg" style={{ color: "var(--accent-2)" }}><span className="sw"/> Google Ads</span>
            <span className="lg" style={{ color: "var(--success)" }}><span className="sw"/> Organique</span>
            <span className="lg" style={{ color: "var(--info)" }}><span className="sw"/> Referral</span>
          </div>
        </div>
        <div className="card-body">
          <BarChart
            data={INBOUND_BY_MONTH} height={300} xLabels={MONTHS}
            series={[
              { key: "meta", color: "var(--accent)" },
              { key: "google", color: "var(--accent-2)" },
              { key: "organic", color: "var(--success)" },
              { key: "referral", color: "var(--info)" },
            ]}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Performance par canal</div>
          <div className="chips">
            <button className="chip active">Leads <span className="count">6632</span></button>
            <button className="chip">Budget</button>
            <button className="chip">CPL</button>
            <button className="chip">ROAS</button>
          </div>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Leads</th>
                <th style={{ width: "25%" }}>Part du mix</th>
                <th>Dépense</th>
                <th>CPL</th>
                <th>Conv.</th>
                <th>ROAS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((c, i) => {
                const cpl = c.spend === "0 €" ? "—" : Math.round(parseInt(c.spend) / c.leads || 0) + " €";
                const roas = (6 - i * 0.8).toFixed(2) + "x";
                return (
                  <tr key={i}>
                    <td>
                      <span className="row" style={{ gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }}/>
                        <strong>{c.name}</strong>
                      </span>
                    </td>
                    <td className="mono">{c.leads.toLocaleString("fr")}</td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="progress" style={{ flex: 1, maxWidth: 200 }}>
                          <div className="p-accent" style={{ width: c.value + "%" }}/>
                        </div>
                        <span className="mono small">{c.value}%</span>
                      </div>
                    </td>
                    <td className="mono">{c.spend}</td>
                    <td className="mono">{cpl}</td>
                    <td className="mono">{(4.2 + i * 0.3).toFixed(2)}%</td>
                    <td className="mono" style={{ color: "var(--success)", fontWeight: 600 }}>{roas}</td>
                    <td><button className="btn icon ghost"><Icon name="more" size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Campagnes actives</div>
            <button className="btn"><Icon name="plus" size={14}/> Nouvelle</button>
          </div>
          <div className="card-body stack-md">
            {[
              { name: "Spring Boost — Meta", budget: 18000, spent: 12400, leads: 284, roas: 6.2 },
              { name: "Google Search — France", budget: 12000, spent: 8800, leads: 192, roas: 4.8 },
              { name: "Retargeting carrousel", budget: 6000, spent: 4100, leads: 98, roas: 5.4 },
              { name: "Meta — Lookalike clients", budget: 9000, spent: 6200, leads: 142, roas: 5.1 },
            ].map((c, i) => (
              <div key={i} className="stack-sm">
                <div className="row between">
                  <strong style={{ fontSize: 13 }}>{c.name}</strong>
                  <span className="mono small" style={{ color: c.roas > 5 ? "var(--success)" : "var(--text-2)" }}>
                    {c.roas}x ROAS
                  </span>
                </div>
                <div className="row between small muted">
                  <span>{c.leads} leads · {c.spent.toLocaleString("fr")} / {c.budget.toLocaleString("fr")} €</span>
                  <span className="mono">{Math.round(c.spent / c.budget * 100)}%</span>
                </div>
                <div className="progress">
                  <div className="p-accent" style={{ width: (c.spent / c.budget * 100) + "%" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Entonnoir d'acquisition</div>
            <span className="tag">12 derniers mois</span>
          </div>
          <div className="card-body stack-md">
            {[
              { step: "Impressions", value: 2840000, pct: 100 },
              { step: "Clics", value: 142000, pct: 5.0 },
              { step: "Visites site", value: 98400, pct: 3.46 },
              { step: "Leads qualifiés", value: 6632, pct: 0.23 },
              { step: "RDV planifiés", value: 1240, pct: 0.044 },
              { step: "Deals signés", value: 320, pct: 0.011 },
            ].map((s, i, arr) => {
              const w = Math.max(8, (Math.log(s.value) / Math.log(arr[0].value)) * 100);
              return (
                <div key={i} className="row" style={{ gap: 12 }}>
                  <div style={{ width: 110, fontSize: 12.5 }}>{s.step}</div>
                  <div style={{ flex: 1, height: 28, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                    <div style={{
                      width: w + "%", height: "100%",
                      background: `linear-gradient(90deg, var(--accent), var(--accent-2))`,
                      opacity: 0.25 + (i / arr.length) * 0.5,
                      borderRadius: 6
                    }}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 10px" }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{s.value.toLocaleString("fr")}</span>
                      <span className="mono small muted" style={{ marginLeft: "auto" }}>{s.pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, unit, trend, dir }) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        <EditableText value={label} tag="span"/>
        <span className={"trend " + dir}>{trend}</span>
      </div>
      <div className="kpi-value">
        <EditableText value={value} tag="span" className="mono"/>
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
}

window.ScreenOverview = ScreenOverview;
window.ScreenAcquisition = ScreenAcquisition;
window.KpiCard = KpiCard;
