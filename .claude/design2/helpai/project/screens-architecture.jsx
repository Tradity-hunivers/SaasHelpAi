/* Architecture screen — 5 pillars + orchestrator + detail panels */

const PILLARS = {
  offre: {
    key: "offre",
    label: "Offre",
    icon: "target",
    color: "oklch(0.72 0.16 300)",
    colorSoft: "oklch(0.72 0.16 300 / 0.12)",
    tagline: "On ne peut pas scaler une offre mal positionnée.",
    why: "On a construit 4 automations autour de l'Offre parce que tout le reste — acquisition, ventes, delivery — dépend de ce qu'on vend et à quel prix. Un CPL qui baisse ne sert à rien si le panier moyen stagne. On a donc d'abord travaillé le positionnement et le pricing avant d'injecter du volume.",
    problems: [
      { t: "Prix à l'instinct", d: "Aucune donnée concurrentielle → sur-price sur le monosplit, sous-price sur le gainable" },
      { t: "Mix produit déséquilibré", d: "85% monosplit (panier 3 300€) alors que le gainable (12 000€) était techniquement vendable" },
      { t: "Opportunités réglementaires ratées", d: "CEE, MaPrimeRénov' : aides en retard de 2 à 3 semaines vs la concurrence" },
      { t: "Marge sacrifiée sans le savoir", d: "En période de forte demande (canicule), les tarifs ne bougeaient pas alors que le marché le permettait" },
    ],
    impact: [
      { label: "Panier moyen", from: "3 300 €", to: "5 818 €" },
      { label: "Part gainable (CA)", from: "8 %", to: "45 %" },
      { label: "Marge brute Q1", from: "—", to: "+12 %" },
      { label: "Opportunités réglementaires", from: "0 suivi", to: "3 détectées & actionnées" },
    ],
    automations: [
      { name: "Veille concurrentielle", desc: "Scraping prix concurrents + rapport hebdomadaire avec recommandations", result: "12 rapports générés", freq: "Hebdo", details: [
        "Ne jamais surpricer ni sous-pricer : chaque devis est ancré sur la réalité du marché local, pas sur l'instinct",
        "Détecter immédiatement quand un concurrent sort une promo agressive — et préparer la réponse avant que les leads le mentionnent",
        "Identifier les créneaux laissés libres par la concurrence (segment gainable sous-exploité par exemple) et s'y positionner en premier",
        "Transformer l'information marché en brief commercial actionnable, distribué à toute l'équipe en 24h",
      ]},
      { name: "Pricing dynamique", desc: "Ajustement tarifs monosplit/multisplit/gainable selon demande et saison", result: "+12% marge brute Q1", freq: "Quotidien", details: [
        "Profiter des pics de demande (canicule, primes) sans choquer : ajustements progressifs pilotés par la donnée",
        "Baisser intelligemment sur les segments en perte de vitesse pour ne pas porter du stock invendable",
        "Protéger la marge en période creuse : refuser les devis trop bas au lieu d'accepter à perte",
        "Donner aux commerciaux une grille à jour chaque matin, plus de devis hors-sol",
      ]},
      { name: "Détection opportunités", desc: "Veille réglementaire (CEE, MaPrimeRénov') + alertes nouvelles aides", result: "3 opportunités détectées", freq: "Temps réel", details: [
        "Être le premier à proposer les nouvelles aides — pendant 2-3 semaines, la concurrence ne les connaît même pas encore",
        "Transformer chaque évolution réglementaire en argument commercial activable immédiatement",
        "Éviter les pénalités : suivre la conformité des offres en continu, pas une fois par trimestre",
        "Détecter les niches émergentes (PAC air-eau subventionnée par exemple) avant qu'elles ne deviennent saturées",
      ]},
      { name: "Analyse mix produit", desc: "Suivi répartition monosplit/multisplit/gainable + recommandations upsell", result: "Gainable : 8% → 45%", freq: "Hebdo", details: [
        "Identifier mois après mois les leads qui auraient pu basculer sur du gainable — et outiller les commerciaux pour les détecter à l'avenir",
        "Éviter la dérive vers le monosplit par facilité : les commerciaux reprennent la main sur le produit vendu",
        "Mesurer l'effort de formation commerciale sur le gainable et son retour exact en marge",
        "Visualiser le potentiel restant du portefeuille : combien de clients mono pourraient passer multi ou gainable",
      ]},
    ],
  },
  acquisition: {
    key: "acquisition",
    label: "Acquisition",
    icon: "acquisition",
    color: "oklch(0.74 0.155 55)",
    colorSoft: "oklch(0.74 0.155 55 / 0.12)",
    tagline: "On génère du volume seulement quand le coût par lead est sous contrôle.",
    why: "On a construit 6 automations parce que l'acquisition est un système, pas une campagne. Les créas, les audiences, le budget, les landing pages et la réputation locale sont interdépendants. Améliorer l'un sans les autres donne des résultats limités. On a tout branché ensemble pour que chaque levier se renforce.",
    problems: [
      { t: "CPL à 78 €", d: "Trop élevé pour être rentable à l'échelle — chaque lead coûtait presque 2 deals potentiels" },
      { t: "Fatigue créative non détectée", d: "Mêmes visuels pendant des semaines → CTR qui chute, CPL qui monte, sans alerte" },
      { t: "Audiences jamais nettoyées", d: "Budget gaspillé sur les profils non-acheteurs, sans exclusion des audiences épuisées" },
      { t: "Note Google 3,2/5", d: "Premier filtre des prospects avant d'appeler — une mauvaise note bloque la conversion organique et referral" },
    ],
    impact: [
      { label: "CPL", from: "78 €", to: "40 €" },
      { label: "ROAS mensuel", from: "2,8x", to: "7,9x" },
      { label: "Leads générés / mois", from: "117", to: "1 067" },
      { label: "Note Google", from: "3,2 ★ (35 avis)", to: "4,8 ★ (312 avis)" },
    ],
    automations: [
      { name: "Génération créas Meta", desc: "Création variations visuels + copies pour campagnes Meta Ads", result: "186 créas générées", freq: "Hebdo", details: [
        "Ne jamais laisser une audience se fatiguer : nouvelles créas prêtes avant que le CTR ne chute",
        "Tester 10x plus de variantes à coût fixe — le volume d'apprentissage de Meta explose",
        "Transformer les meilleures créas en templates réutilisables sur d'autres offres",
        "Réduire le goulot d'étranglement créatif : plus besoin d'attendre un graphiste externe",
      ]},
      { name: "Optimisation audiences", desc: "Analyse performance audiences + recommandations scaling/exclusions", result: "CPL : 78€ → 40€", freq: "Quotidien", details: [
        "Exclure automatiquement les audiences épuisées avant qu'elles ne ruinent le ROAS",
        "Détecter les audiences émergentes rentables et y allouer du budget sans attendre",
        "Empêcher le chevauchement entre campagnes qui font monter le CPM artificiellement",
        "Aligner la stratégie d'audience sur la saisonnalité du métier, pas sur des intuitions",
      ]},
      { name: "A/B testing auto", desc: "Rotation automatique des créas et copies selon performance", result: "CTR moyen +42%", freq: "Continu", details: [
        "Mettre en pause les mauvaises créas dans les 24h au lieu de 7 jours",
        "Promouvoir les gagnantes sans intervention humaine — scaling immédiat",
        "Accumuler un historique structuré des gains par type de créa (UGC, motion, statique)",
        "Protéger le budget en évitant les \"sunk cost\" sur des créas qui ne performent plus",
      ]},
      { name: "Rédaction landing pages", desc: "Pages de capture optimisées par type de service (mono/multi/gainable)", result: "8 pages actives", freq: "Mensuel", details: [
        "Faire matcher le message de l'ad et de la page — plus de drop à la page de capture",
        "Spécialiser une page par typologie de projet, au lieu d'une page générique qui convertit mal",
        "Itérer les pages sur la donnée réelle plutôt que sur les goûts de l'agence",
        "Déployer une nouvelle offre en 48h avec sa page dédiée, pas en 3 semaines",
      ]},
      { name: "Budget pacing", desc: "Répartition automatique du budget entre campagnes selon ROAS", result: "ROAS : 2,8x → 7,9x", freq: "Quotidien", details: [
        "Arbitrer le budget en temps réel entre campagnes, plus besoin d'un media buyer dédié",
        "Protéger les campagnes qui scalent, limiter celles qui saturent",
        "Éviter les fins de mois catastrophiques où le budget a brûlé sans ROI",
        "Rendre les arbitrages traçables : on sait exactement pourquoi telle campagne a reçu plus",
      ]},
      { name: "Gestion Google My Business", desc: "Réponses avis + posts optimisés + photos chantier", result: "4,8 ★ (312 avis)", freq: "Quotidien", details: [
        "Chaque avis Google reçoit une réponse professionnelle et personnalisée en moins de 2h — signal de sérieux que les prospects voient en premier",
        "Générer en continu de nouveaux avis 5 étoiles sans processus manuel : l'invitation part automatiquement après chaque intervention",
        "La note Google est le premier filtre qu'un prospect applique avant d'appeler — passer de 3,2 à 4,8 c'est une conversion doublée à budget constant",
        "312 avis collectés en 12 mois sans qu'un humain passe une seule minute à les solliciter manuellement",
      ]},
    ],
  },
  ventes: {
    key: "ventes",
    label: "Ventes",
    icon: "sales",
    color: "oklch(0.78 0.13 155)",
    colorSoft: "oklch(0.78 0.13 155 / 0.12)",
    tagline: "Des leads sans process commercial, c'est un seau percé.",
    why: "On a construit 7 automations sur ce pilier parce que c'est là que se jouent directement les revenus. Chaque point de closing gagné vaut des dizaines de milliers d'euros à l'échelle. On a structuré le pilier en 3 niveaux : qualifier avant le contact, optimiser pendant l'appel, relancer intelligemment après.",
    problems: [
      { t: "No-show rate à 35 %", d: "Un tiers des RDV ne se présentent pas — temps commercial et créneau technicien perdus" },
      { t: "Leads non qualifiés", d: "Commerciaux rappelant des locataires sans budget, pendant 20 min par appel inutile" },
      { t: "Closing à 8 % sur RDV effectif", d: "Aucun feedback sur les appels, pas de formation continue, chaque commercial dans sa bulle" },
      { t: "Devis en 45 min / unité", d: "Au volume actuel de 56 deals/mois, ça représentait 42 heures de production manuelle de devis" },
    ],
    impact: [
      { label: "No-show rate", from: "35 %", to: "18 %" },
      { label: "Taux de closing (RDV effectif)", from: "8 %", to: "13 %" },
      { label: "Taux de contact leads", from: "~45 %", to: "89 %" },
      { label: "Panier moyen", from: "3 300 €", to: "5 818 €" },
    ],
    automations: [
      { name: "Qualification leads IA", desc: "Scoring automatique budget/urgence/surface + priorisation pipeline", result: "1 067 leads scorés/mois", freq: "Temps réel", details: [
        "Les commerciaux passent leur temps uniquement sur les leads qui ont le budget, l'urgence et la configuration — fini les appels de 20 minutes pour un locataire sans budget",
        "Pipeline propre + prévisions de CA fiables : quand chaque deal a un score, Thomas sait exactement ce qu'il va facturer dans 30 jours",
        "Identifier et prioriser automatiquement les leads gainable à fort panier — les meilleurs leads remontent en haut de la liste chaque matin",
        "Taux de contact utile de 89% : sur 1 067 leads scorés par mois, l'équipe sait exactement sur qui concentrer l'énergie",
      ]},
      { name: "Setting automatisé", desc: "SMS + email + WhatsApp conversationnel pour prise de RDV", result: "Taux contact : 89%", freq: "Temps réel", details: [
        "Joindre chaque lead dans les 90 secondes — le taux de conversion chute de 80% après 5 minutes d'attente",
        "Multi-canal : relancer par SMS celui qui n'a pas répondu à l'email, par WhatsApp celui qui préfère ce canal",
        "Libérer les commerciaux du travail de setter : 100% de leur temps sur le closing, 0% sur la chasse",
        "Traçabilité complète de chaque conversation, plus de \"je croyais qu'on s'était parlé\"",
      ]},
      { name: "Analyse appels closing", desc: "Transcription + scoring commercial + recommandations personnalisées", result: "342 appels analysés", freq: "Post-appel", details: [
        "Chaque commercial reçoit un feedback structuré après chaque appel — amélioration mesurable semaine après semaine",
        "Détecter les objections récurrentes et construire des scripts de réponse qui augmentent le closing",
        "Identifier les meilleurs commerciaux et comprendre précisément ce qu'ils font différemment",
        "Onboarder un nouveau commercial en 2 semaines au lieu de 2 mois en lui donnant les patterns des top performers",
      ]},
      { name: "Relances intelligentes", desc: "Séquences personnalisées par profil et stade du pipeline", result: "+18% taux closing", freq: "Automatique", details: [
        "Aucun deal n'est oublié : chaque prospect est relancé au bon moment avec le bon message",
        "Segmentation fine : un prospect chaud et un prospect froid ne reçoivent pas la même séquence",
        "Arrêter intelligemment les relances quand c'est mort — respecter le prospect et protéger la marque",
        "Réactiver automatiquement les deals \"perdus\" qui reviennent sur le marché 6 mois plus tard",
      ]},
      { name: "Génération devis", desc: "Devis auto-générés (mono/multi/gainable) selon qualification", result: "102 devis en pipeline", freq: "Temps réel", details: [
        "Réduire le temps de production d'un devis de 45 min à 3 min — 42h/mois récupérées au volume actuel",
        "Zéro erreur de pricing : les grilles à jour sont appliquées automatiquement, pas de calcul à la main",
        "Devis envoyé dans l'heure après le RDV, quand le prospect est encore chaud",
        "Homogénéité totale : tous les devis ont la même qualité, peu importe qui les produit",
      ]},
      { name: "Prédiction closing", desc: "Score probabilité de signature par deal + alerte deals chauds", result: "Précision : 74%", freq: "Quotidien", details: [
        "Concentrer les efforts sur les deals qui vont vraiment signer, pas ceux qui ont juste l'air prometteurs",
        "Alerter le manager sur les deals à fort potentiel qui perdent de la vitesse — action avant qu'il ne soit trop tard",
        "Prévoir le CA des 30 prochains jours avec 74% de précision, donc piloter recrutement et achats en confiance",
        "Identifier les deals zombies qui pourrissent le pipeline et doivent être fermés proprement",
      ]},
      { name: "Upsell automatique", desc: "Détection opportunités upgrade mono→multi ou multi→gainable", result: "Panier +34% en 12 mois", freq: "Par devis", details: [
        "Proposer systématiquement l'upgrade pertinent — plus de deals mono quand le gainable était possible",
        "Fournir au commercial les arguments exacts pour justifier l'upgrade : aides, ROI, confort",
        "Augmenter le panier moyen sans augmenter le coût d'acquisition — levier le plus rentable",
        "Mesurer précisément la conversion d'upsell pour investir dans la formation sur les bons angles",
      ]},
    ],
  },
  delivery: {
    key: "delivery",
    label: "Delivery",
    icon: "check",
    color: "oklch(0.70 0.14 280)",
    colorSoft: "oklch(0.70 0.14 280 / 0.12)",
    tagline: "La croissance se construit sur des clients qui reviennent et qui recommandent.",
    why: "On a construit 6 automations sur la Delivery parce que la croissance sans rétention est une illusion. Chaque client livré est un actif : un contrat maintenance, une recommandation, un avis Google potentiel. On a systématisé tout ce qui permettait de transformer un chantier one-shot en relation long terme.",
    problems: [
      { t: "Planning techniciens non optimisé", d: "40% du temps de déplacement en heures perdues — capacité de facturation bridée sans recruter" },
      { t: "Dossiers CEE à 61% d'acceptation", d: "39% de rejets = primes perdues, re-travail, image de sérieux dégradée auprès des organismes" },
      { t: "Zéro suivi satisfaction", d: "Les clients mécontents partaient sans qu'on le sache — les avis négatifs s'accumulaient silencieusement" },
      { t: "Contrats maintenance = 0", d: "Aucun revenu récurrent, 100% de la facturation dépendait de nouveaux chantiers chaque mois" },
    ],
    impact: [
      { label: "Temps trajet techniciens", from: "base", to: "-22 %" },
      { label: "Taux acceptation CEE", from: "61 %", to: "94 %" },
      { label: "Contrats maintenance actifs", from: "0", to: "78" },
      { label: "Note Google", from: "3,2 ★", to: "4,8 ★ (312 avis)" },
    ],
    automations: [
      { name: "Onboarding client auto", desc: "Séquence bienvenue + récap devis + planning technicien", result: "56 onboardings/mois", freq: "Par signature", details: [
        "Aucun blanc entre la signature et l'intervention — le client se sent suivi dès le premier jour",
        "Préparer le terrain pour les avis et les recommandations dès le début de la relation",
        "Éliminer les appels \"où en est mon dossier ?\" qui saturent le support",
        "Activer un client vers le contrat maintenance dès l'onboarding, pas 12 mois plus tard",
      ]},
      { name: "Planning interventions", desc: "Optimisation planning techniciens par zone géographique", result: "-22% temps trajet", freq: "Quotidien", details: [
        "-22% de temps de trajet = +22% de capacité de facturation sur la même équipe, sans recruter",
        "Les techniciens font plus d'interventions par jour sans rouler davantage — productivité augmentée, fatigue réduite, turnover maîtrisé",
        "Chaque soir, le planning du lendemain est optimisé par zone géographique et type d'intervention — plus de Lyon-Nord le matin et Lyon-Sud l'après-midi pour le même technicien",
        "Scalabilité immédiate : ajouter un nouveau technicien ne crée pas de chaos dans le planning, l'IA l'intègre automatiquement",
      ]},
      { name: "Suivi satisfaction", desc: "Enquête auto post-intervention + demande avis Google", result: "4,8 ★ (312 avis)", freq: "Post-chantier", details: [
        "Détecter les clients mécontents en 24h au lieu de lire un avis négatif 2 semaines plus tard",
        "Capitaliser sur les clients satisfaits : demande d'avis systématique au pic d'enthousiasme",
        "Alimenter le référencement local en continu — chaque avis est un signal pour Google",
        "Transformer une intervention ratée en opportunité de fidélisation grâce à la détection précoce",
      ]},
      { name: "Support client IA", desc: "Chatbot FAQ technique + escalade intelligente vers technicien", result: "62% résolu sans humain", freq: "Temps réel", details: [
        "Les questions récurrentes (notice, utilisation, facturation) sont traitées 24/7 sans mobiliser de technicien",
        "Escalade intelligente : seuls les vrais problèmes techniques remontent, avec le contexte déjà préparé",
        "Réduire le coût support tout en améliorant le temps de réponse perçu par le client",
        "Capturer les motifs d'appel pour améliorer la documentation produit et les offres futures",
      ]},
      { name: "Rappels maintenance", desc: "Notifications entretien annuel + re-travail contrat", result: "78 contrats actifs", freq: "Automatique", details: [
        "Transformer un chantier one-shot en revenu récurrent — 78 contrats actifs partis de zéro",
        "Proposer le contrat au bon moment : après une intervention réussie, pas par email froid",
        "Stabiliser le cash-flow avec du revenu récurrent prévisible, moins de dépendance aux pics d'acquisition",
        "Augmenter la valeur vie client de 20% sans augmenter le coût d'acquisition",
      ]},
      { name: "Dossier CEE automatisé", desc: "Pré-remplissage dossiers CEE pour chaque installation éligible", result: "94% taux acceptation", freq: "Par chantier", details: [
        "94% d'acceptation = primes réellement touchées, crédibilité renforcée auprès des organismes",
        "Le client touche sa prime sans paperasse — argument commercial différenciant au moment du devis",
        "Zéro dossier oublié : tous les chantiers éligibles sont traités, plus de perte d'argent silencieuse",
        "Réduire le temps de back-office de 3h à 20 min par dossier, technicien concentré sur le terrain",
      ]},
    ],
  },
  reporting: {
    key: "reporting",
    label: "Reporting",
    icon: "overview",
    color: "oklch(0.72 0.13 220)",
    colorSoft: "oklch(0.72 0.13 220 / 0.12)",
    tagline: "On ne pilote pas une machine à 325 000€/mois à l'instinct.",
    why: "On a construit 5 automations de Reporting parce que le Reporting est le système nerveux de l'infrastructure entière. Sans données fraîches, les 4 autres piliers pilotent à l'aveugle. On a conçu chaque couche — alertes temps réel, rapports hebdos, forecast CA — pour que chaque décision, qu'elle soit opérationnelle ou stratégique, repose sur de l'information vérifiée.",
    problems: [
      { t: "Données vieilles de 3 à 5 jours", d: "Les anomalies (CPL qui monte, leads qui chutent) détectées en retard = jours de budget gaspillés" },
      { t: "Aucun système d'alerte", d: "Une semaine de fatigue créative ou d'audience épuisée pouvait durer des semaines sans être vu" },
      { t: "Prévisions = intuition", d: "Thomas ne pouvait pas planifier ses recrutements ni ses achats de matériel sur des bases solides" },
      { t: "Valeur agence non documentée", d: "Sans rapport mensuel clair, la relation commerciale reposait sur la confiance, pas sur les preuves" },
    ],
    impact: [
      { label: "Anomalies détectées & traitées", from: "0 (pas de suivi)", to: "23 en 12 mois" },
      { label: "Précision forecast CA", from: "—", to: "± 8 %" },
      { label: "Rapports hebdos envoyés", from: "0 (manuel)", to: "52 automatiques" },
      { label: "Temps décision vs anomalie", from: "3-5 jours", to: "< 4 heures" },
    ],
    automations: [
      { name: "Dashboard temps réel", desc: "Agrégation Meta Ads + GHL + données terrain dans un dashboard unifié", result: "Mis à jour en continu", freq: "Temps réel", details: [
        "Une source de vérité unique : plus de data qui diverge entre Meta, le CRM et les techniciens",
        "Tout le monde regarde les mêmes chiffres au même moment — fini les réunions à débattre des chiffres",
        "Détecter instantanément une anomalie dans l'un des piliers — alerter avant que ça dégénère",
        "Réduire le temps de préparation des comités de pilotage de 4h à 20 min",
      ]},
      { name: "Rapport hebdo client", desc: "Envoi automatique récapitulatif performance au gérant", result: "52 rapports envoyés", freq: "Hebdo", details: [
        "Le client voit la valeur chaque semaine, sans avoir à la demander — fin du \"je ne sais pas ce qu'ils font pour moi\"",
        "Chaque chiffre contextualisé : variation vs semaine précédente, vs objectif, vs benchmark saison",
        "Préparer la réunion mensuelle en 10 min au lieu de 2h — le rapport résume déjà tout",
        "Protéger le contrat : un client qui voit sa valeur chaque semaine ne résilie pas sur un coup de tête",
      ]},
      { name: "Alertes anomalies", desc: "Détection hausse CPL, chute leads, baisse conversion, fatigue créa", result: "23 alertes traitées", freq: "Temps réel", details: [
        "Intervenir en 4 heures sur une anomalie au lieu de la découvrir 4 jours plus tard lors du point hebdo — l'écart de coût entre les deux peut atteindre plusieurs milliers d'euros",
        "Stopper un problème de fatigue créative avant qu'il ne coûte des semaines de budget mal optimisé — le seuil de fréquence est surveillé en continu",
        "Protéger le budget ads contre les dérives silencieuses : un CPL qui monte de 40€ à 62€ en 48h est détecté et corrigé avant de devenir la nouvelle norme",
        "Dormir sereinement : le système surveille 24h/7 tous les seuils de performance définis — aucune anomalie ne passe inaperçue le week-end",
      ]},
      { name: "Prévisions CA", desc: "Forecast 30/60/90 jours basé sur pipeline + saisonnalité", result: "Précision ± 8%", freq: "Quotidien", details: [
        "Planifier recrutements, achats matériel et trésorerie sur des chiffres fiables — plus de surprises fin de mois",
        "Identifier 60 jours à l'avance un creux de CA et activer les leviers nécessaires",
        "Donner au banquier/investisseur des projections défendables avec méthodologie documentée",
        "Mesurer l'écart forecast vs réel mois après mois pour améliorer continuellement le modèle",
      ]},
      { name: "Rapport mensuel agence", desc: "Récapitulatif complet avec rev share, ROI, recommandations", result: "13 rapports générés", freq: "Mensuel", details: [
        "Documenter noir sur blanc la valeur créée chaque mois — aucune ambiguïté sur le ROI agence",
        "Transformer chaque rapport en levier de renégociation ou d'upsell de scope",
        "Capitaliser la connaissance : 12 mois de rapports = playbook éprouvé pour les prochains clients",
        "Donner au gérant un artefact qu'il peut partager à son board, ses associés ou son banquier",
      ]},
    ],
  },
};

function ScreenArchitecture() {
  const [active, setActive] = React.useState("acquisition");
  const [openAuto, setOpenAuto] = React.useState(null);
  const pillar = PILLARS[active];
  const orderedKeys = ["offre", "acquisition", "ventes", "delivery", "reporting"];

  React.useEffect(() => { setOpenAuto(null); }, [active]);

  return (
    <div className="stack-lg fade-up" style={{ paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
        <div className="small" style={{ color: "var(--accent)", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 12 }}>
          INFRASTRUCTURE
        </div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: "0 0 10px",
          color: "var(--text)"
        }}>
          Ce que tu <span style={{ color: pillar.color }}>déploies</span>.
        </h2>
        <div className="small muted" style={{ fontSize: 13.5 }}>
          Clique sur un pilier pour voir les automations et leur impact mesuré sur 12 mois.
        </div>
      </div>

      {/* Top nodes */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative" }}>
        <div style={{
          padding: "8px 16px", borderRadius: 99,
          border: "1px solid var(--border)", background: "var(--surface)",
          fontSize: 12.5, fontWeight: 500
        }}>
          Dashboard client
        </div>
        <div style={{ width: 1, height: 14, background: "var(--border)" }}/>
        <div style={{
          padding: "8px 16px", borderRadius: 99,
          border: "1px solid var(--border)", background: "var(--surface)",
          fontSize: 12.5, fontWeight: 500
        }}>
          Telegram / WhatsApp
        </div>
        <div style={{ width: 1, height: 14, background: "var(--border)" }}/>
        <div style={{
          padding: "10px 22px", borderRadius: 99,
          border: "1.5px solid " + pillar.color,
          background: pillar.colorSoft,
          color: pillar.color,
          fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
          boxShadow: `0 0 0 6px ${pillar.colorSoft}`,
        }}>
          ORCHESTRATEUR IA
        </div>
      </div>

      {/* Connector lines + pillars */}
      <div style={{ position: "relative" }}>
        <svg width="100%" height="32" style={{ display: "block", marginBottom: -4 }} preserveAspectRatio="none" viewBox="0 0 1000 32">
          <path d="M 500 0 L 500 14 L 100 14 L 100 32" stroke="var(--border)" fill="none"/>
          <path d="M 500 14 L 300 14 L 300 32" stroke="var(--border)" fill="none"/>
          <path d="M 500 14 L 500 32" stroke="var(--border)" fill="none"/>
          <path d="M 500 14 L 700 14 L 700 32" stroke="var(--border)" fill="none"/>
          <path d="M 500 14 L 900 14 L 900 32" stroke="var(--border)" fill="none"/>
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {orderedKeys.map(k => {
            const p = PILLARS[k];
            const isActive = k === active;
            return (
              <button
                key={k}
                onClick={() => setActive(k)}
                style={{
                  border: "1px solid " + (isActive ? p.color : "var(--border-soft)"),
                  borderRadius: 14,
                  padding: "18px 16px",
                  background: isActive
                    ? `linear-gradient(180deg, ${p.colorSoft}, transparent 80%), var(--surface)`
                    : "var(--surface)",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  boxShadow: isActive ? `0 0 0 3px ${p.colorSoft}` : "var(--shadow-1)",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: p.colorSoft, color: p.color,
                  display: "grid", placeItems: "center",
                  margin: "0 auto 10px",
                }}>
                  <Icon name={p.icon} size={18}/>
                </div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                  marginBottom: 6
                }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", minHeight: 48, lineHeight: 1.5 }}>
                  {p.tagline.split(".")[0].length < 50 ? p.tagline : {
                    offre: "Positionnement, pricing dynamique, veille concurrentielle.",
                    acquisition: "Leads qualifiés en continu via Ads et organique.",
                    ventes: "Transformer les leads en clients signés.",
                    delivery: "Livraison, satisfaction client, avis Google.",
                    reporting: "KPIs temps réel, alertes, preuves de ROI.",
                  }[k]}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", minHeight: 20 }}>
                  {{
                    offre: ["Veille", "Pricing"],
                    acquisition: ["Content", "Ads"],
                    ventes: ["Setting", "Closing"],
                    delivery: ["Onboard", "Support"],
                    reporting: ["KPIs", "Alertes"],
                  }[k].map(chip => (
                    <span key={chip} style={{
                      fontSize: 10.5, padding: "2px 7px", borderRadius: 99,
                      background: isActive ? p.color : "var(--surface-2)",
                      color: isActive ? "var(--accent-ink)" : "var(--text-3)",
                      fontWeight: 500,
                    }}>{chip}</span>
                  ))}
                </div>
                <div style={{
                  marginTop: 12,
                  fontSize: 11, color: isActive ? p.color : "var(--text-3)",
                  padding: "4px 10px",
                  border: "1px solid " + (isActive ? p.color : "var(--border-soft)"),
                  borderRadius: 99, display: "inline-block",
                  fontWeight: 600,
                }}>
                  {p.automations.length} automations
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{
        border: "1px solid " + pillar.color,
        borderRadius: 16,
        background: `linear-gradient(180deg, ${pillar.colorSoft}, transparent 30%), var(--surface)`,
        padding: 28,
      }}>
        <div className="row between" style={{ alignItems: "flex-start", marginBottom: 24, gap: 24 }}>
          <div style={{ flex: 1 }}>
            <span className="tag" style={{
              background: pillar.colorSoft,
              color: pillar.color,
              borderColor: pillar.color,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              padding: "3px 10px",
            }}>
              <Icon name={pillar.icon} size={10}/> {pillar.label}
            </span>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 17, fontWeight: 600,
              marginTop: 10, fontStyle: "italic",
              color: "var(--text)"
            }}>
              {pillar.tagline}
            </div>
          </div>
          <div style={{
            textAlign: "center",
            border: "1px solid " + pillar.color,
            borderRadius: 12,
            padding: "14px 20px",
            background: pillar.colorSoft,
            minWidth: 140,
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 32, fontWeight: 800,
              color: pillar.color, lineHeight: 1,
            }}>
              {pillar.automations.length}
            </div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: pillar.color, marginTop: 6, fontWeight: 600 }}>
              Automations actives
            </div>
          </div>
        </div>

        <div className="grid g-2" style={{ gap: 28, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, marginBottom: 14 }}>
              Problèmes identifiés
            </div>
            <div className="stack-md">
              {pillar.problems.map((p, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pillar.color, marginTop: 7, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{p.t}</div>
                    <div className="small muted" style={{ lineHeight: 1.5 }}>{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, marginBottom: 14 }}>
              Pourquoi on a construit ça comme ça
            </div>
            <div style={{
              padding: 16,
              border: "1px solid var(--border-soft)",
              borderRadius: 10,
              background: "var(--bg-2)",
              fontSize: 12.5, lineHeight: 1.65, color: "var(--text-2)",
            }}>
              {pillar.why}
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, margin: "20px 0 12px" }}>
              Impact mesuré sur 12 mois
            </div>
            <div className="grid g-2" style={{ gap: 10 }}>
              {pillar.impact.map((im, i) => (
                <div key={i} style={{
                  padding: 12,
                  border: "1px solid var(--border-soft)",
                  borderRadius: 10,
                  background: "var(--bg-2)",
                }}>
                  <div className="small muted" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                    {im.label}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "var(--text)" }}>
                    <span className="muted">{im.from}</span>
                    <span style={{ margin: "0 6px", color: pillar.color }}>→</span>
                    <strong style={{ color: pillar.color }}>{im.to}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Automations grid */}
        <div>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: pillar.color }}>
              <Icon name={pillar.icon} size={12}/> Les {pillar.automations.length} automations du pilier {pillar.label}
            </div>
            <div className="small muted">Clique sur une automation pour voir ses avantages client</div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {pillar.automations.map((a, i) => (
              <button
                key={i}
                onClick={() => setOpenAuto(openAuto === i ? null : i)}
                style={{
                  textAlign: "left",
                  padding: 14,
                  border: "1px solid " + (openAuto === i ? pillar.color : "var(--border-soft)"),
                  borderRadius: 12,
                  background: openAuto === i ? pillar.colorSoft : "var(--bg-2)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>{a.name}</div>
                <div className="small muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 10, minHeight: 36 }}>{a.desc}</div>
                <div className="mono" style={{ fontSize: 12, color: pillar.color, fontWeight: 600, marginBottom: 10 }}>
                  {a.result}
                </div>
                <div className="row between">
                  <span className="tag" style={{ fontSize: 10, padding: "1px 8px" }}>{a.freq}</span>
                  <span className="small" style={{ fontSize: 10.5, color: "var(--success)" }}>● Actif</span>
                </div>
                <div className="small" style={{
                  marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-soft)",
                  color: openAuto === i ? pillar.color : "var(--text-3)",
                  fontSize: 11, textAlign: "right", fontWeight: 500,
                }}>
                  {openAuto === i ? "▲ Masquer" : "Voir les avantages ▼"}
                </div>
              </button>
            ))}
          </div>

          {openAuto !== null && (
            <div className="fade-up" style={{
              marginTop: 18,
              padding: 22,
              border: "1px solid " + pillar.color,
              borderRadius: 14,
              background: pillar.colorSoft,
            }}>
              <div className="row between" style={{ marginBottom: 14, alignItems: "flex-start", gap: 20 }}>
                <div>
                  <span className="tag" style={{
                    background: pillar.color, color: "var(--accent-ink)", borderColor: "transparent",
                    fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700
                  }}>
                    <Icon name={pillar.icon} size={10}/> {pillar.label}
                  </span>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
                    marginTop: 8, letterSpacing: "-0.01em", color: "var(--text)"
                  }}>
                    {pillar.automations[openAuto].name}
                  </div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {pillar.automations[openAuto].desc} · <strong style={{ color: pillar.color }}>{pillar.automations[openAuto].freq}</strong>
                  </div>
                </div>
                <div style={{
                  textAlign: "right",
                  border: "1px solid " + pillar.color,
                  borderRadius: 10, padding: "10px 16px",
                  background: "var(--bg-2)", minWidth: 140,
                }}>
                  <div className="small" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: pillar.color, fontWeight: 700, marginBottom: 4 }}>
                    Résultat mesuré
                  </div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: pillar.color }}>
                    {pillar.automations[openAuto].result}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 700, marginBottom: 12 }}>
                Ce que cette automation change concrètement pour le client
              </div>
              <div className="grid g-2" style={{ gap: 10 }}>
                {pillar.automations[openAuto].details.map((d, i) => (
                  <div key={i} style={{
                    padding: 14,
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    background: "var(--bg-2)",
                    fontSize: 12.5, lineHeight: 1.55, color: "var(--text-2)",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: pillar.color, marginTop: 7, flexShrink: 0
                    }}/>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ScreenArchitecture = ScreenArchitecture;
