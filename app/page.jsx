'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  // Estados originales
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [view, setView] = useState('analyze');
  const [analysis, setAnalysis] = useState(null);
  const [hooksData, setHooksData] = useState(null);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [selectedHook, setSelectedHook] = useState(null);
  const [postData, setPostData] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(null);
  const [expandedPost, setExpandedPost] = useState(false);
  const [error, setError] = useState(null);

  // Estados para Feature 1: Auto-Discovery
  const [trends, setTrends] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Estados para Feature 2: Content Tracker
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [newPost, setNewPost] = useState({ titulo: '', pilar: '', fecha: '' });
  const [trackerSuggestion, setTrackerSuggestion] = useState(null);
  const [isLoadingTracker, setIsLoadingTracker] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await supabase
        .from('analyses')
        .select('query, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setHistory(data);
    } catch (e) {
      console.log('History fetch skipped');
    }
  };

  const handleAnalyze = async (q) => {
    const searchQuery = q || keyword;
    if (!searchQuery.trim()) return;
    setKeyword(searchQuery);
    setLoading(true);
    setError(null);
    setLoadingMsg('Buscando tendencias reales con Perplexity Sonar...');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setView('analyze');
      setHooksData(null);
      setPostData(null);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHooks = async (trend) => {
    setLoading(true);
    setError(null);
    setSelectedTrend(trend);
    setLoadingMsg('Generando hooks con Gemini Flash...');
    try {
      const res = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trend, query: keyword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHooksData(data);
      setView('hooks');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePost = async (hook) => {
    setLoading(true);
    setError(null);
    setSelectedHook(hook);
    setLoadingMsg('Escribiendo post completo con Gemini Flash...');
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook, trend: selectedTrend }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPostData(data);
      setView('post');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
// FUNCIÓN: handleDiscover actualizada
// Ubicación: dentro del componente Home, junto con las otras funciones handle
// ========================================

const handleDiscover = async () => {
  // Usar el análisis existente o el keyword como perfil
  const profileData = analysis 
    ? `Nicho: ${keyword}\nTendencias actuales: ${analysis.trends.map(t => t.title).join(', ')}\nContexto: ${analysis.summary}`
    : keyword;

  if (!profileData.trim()) {
    setError("Primero analiza una keyword o ingresa tu nicho profesional");
    return;
  }

  setIsDiscovering(true);
  setError(null);
  setLoadingMsg('Descubriendo tendencias relevantes...');

  try {
    const response = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: profileData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al descubrir tendencias");
    }

    const data = await response.json();
    
    if (!data.trends || !Array.isArray(data.trends)) {
      throw new Error("Formato de respuesta inválido");
    }

    setTrends(data.trends);
    setView('discover'); // Cambiar a la vista de tendencias
  } catch (err) {
    console.error('Error en discover:', err);
    setError(err.message);
  } finally {
    setIsDiscovering(false);
    setLoadingMsg('');
  }
};

  // Feature 2: Content Tracker
  const handleAddPost = () => {
    if (!newPost.titulo || !newPost.pilar || !newPost.fecha) return;
    setPublishedPosts([...publishedPosts, { ...newPost, id: Date.now() }]);
    setNewPost({ titulo: '', pilar: '', fecha: '' });
  };

  const handleRemovePost = (id) => {
    setPublishedPosts(publishedPosts.filter((p) => p.id !== id));
  };

  const handleGetSuggestion = async () => {
    if (publishedPosts.length === 0) {
      setError('Agrega al menos un post publicado para obtener sugerencias');
      return;
    }

    setIsLoadingTracker(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishedPosts,
          profile: analysis?.profile_summary || keyword,
        }),
      });

      if (!response.ok) throw new Error('Error al obtener sugerencia');

      const data = await response.json();
      setTrackerSuggestion(data.suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingTracker(false);
    }
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const pillarColors = {
    DigestIA: { bg: '#EBF5FF', text: '#0A66C2', border: '#0A66C2' },
    LegalTech: { bg: '#E8F5E9', text: '#057642', border: '#057642' },
    IA_gobierno: { bg: '#FBE9E7', text: '#B24020', border: '#B24020' },
    Aprendizaje: { bg: '#F3E8FF', text: '#7C3AED', border: '#7C3AED' },
    Personal: { bg: '#FFF8E1', text: '#92400E', border: '#92400E' },
  };

  const formulaIcons = {
    contraintuitivo: '🔄',
    numero: '🔢',
    pregunta: '❓',
    historia: '📖',
    controversial: '⚡',
    lista: '📋',
  };

  const engagementColors = {
    low: { bg: '#FEE2E2', text: '#991B1B' },
    medium: { bg: '#FEF9C3', text: '#854D0E' },
    high: { bg: '#DCFCE7', text: '#166534' },
    viral: { bg: '#F3E8FF', text: '#7C3AED' },
  };

  const tags = ['LegalTech Argentina', 'IA gobierno municipal', 'chatbot legal', 'transformación digital', 'vibe coding'];

  // ==================== RENDER ====================

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0B1931', borderBottom: '1px solid #1a2a4a', color: 'white', padding: '12px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #0A66C2, #00C17A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>LI</div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, margin: 0, lineHeight: 1.2 }}>TREND ANALYZER</h1>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: '#00C17A', margin: 0 }}>LUCAS VEGA INTELLIGENCE</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Lucas Vega</p>
              <p style={{ fontSize: 9, color: '#00C17A', fontWeight: 700, letterSpacing: 1, margin: 0 }}>LEGAL TECH LEAD</p>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#00C17A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, border: '2px solid rgba(255,255,255,0.2)' }}>LV</div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: '0 24px', position: 'sticky', top: 61, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32 }}>
          {[
            { id: 'analyze', label: '🔍 Analizar', always: true },
            { id: 'hooks', label: '🎯 Hooks', always: false },
            { id: 'post', label: '✍️ Post', always: false },
            { id: 'discover', label: '🔥 Descubrir', always: true },
          ].map((tab) => {
            const active = view === tab.id;
            const disabled = !tab.always && ((tab.id === 'hooks' && !hooksData) || (tab.id === 'post' && !postData));
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setView(tab.id)}
                style={{
                  padding: '12px 0',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderBottom: active ? '3px solid #0A66C2' : '3px solid transparent',
                  color: disabled ? '#CCC' : active ? '#0A66C2' : '#666',
                  background: 'none',
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* LEFT COLUMN */}
          <div>
            {/* SEARCH BAR - Solo en vista analyze */}
            {view === 'analyze' && (
              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Ej: LegalTech Argentina, IA gobierno municipal..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 15, outline: 'none' }}
                  />
                  <button
                    onClick={() => handleAnalyze()}
                    disabled={loading || !keyword.trim()}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 14,
                      background: loading ? '#999' : '#0A66C2',
                      color: 'white',
                      cursor: loading ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {loading && view === 'analyze' ? '⏳ Analizando...' : '🔍 Analizar'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setKeyword(tag);
                        handleAnalyze(tag);
                      }}
                      style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #E0E0E0', background: '#F9FAFB', fontSize: 12, cursor: 'pointer', color: '#666' }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <p style={{ color: '#991B1B', fontWeight: 600, margin: 0 }}>⚠️ Error: {error}</p>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 64, textAlign: 'center' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: '4px solid #0A66C2',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                ></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{loadingMsg}</h3>
                <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Perplexity busca datos reales → Gemini los analiza para vos</p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !analysis && !error && view === 'analyze' && (
              <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.4 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                <p style={{ fontWeight: 700, color: '#999', fontSize: 16 }}>Ingresá una keyword para analizar tendencias reales</p>
                <p style={{ color: '#BBB', fontSize: 13, marginTop: 8 }}>Perplexity busca en internet → Gemini analiza para tu perfil</p>
              </div>
            )}

            {/* ========== VIEW: ANALYZE ========== */}
            {!loading && analysis && view === 'analyze' && (
              <div>
                {/* TRENDS */}
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  📊 Tendencias Detectadas
                  <span style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 12, background: '#EBF5FF', color: '#0A66C2', fontSize: 12 }}>{keyword}</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(analysis.trends || []).map((t, i) => {
                    const pc = pillarColors[t.suggested_pillar] || pillarColors.LegalTech;
                    const satColors = {
                      low: { bg: '#DCFCE7', t: '#166534' },
                      medium: { bg: '#FEF9C3', t: '#854D0E' },
                      high: { bg: '#FEE2E2', t: '#991B1B' },
                    };
                    const sc = satColors[t.saturation] || satColors.medium;
                    return (
                      <div key={i} style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, flex: 1 }}>{t.title}</h3>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: pc.bg, color: pc.text }}>
                              {t.suggested_pillar}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.t }}>
                              Sat: {t.saturation}
                            </span>
                          </div>
                        </div>
                        <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>{t.description}</p>

                        {/* Relevance bar */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: '#999' }}>Relevancia</span>
                            <span
                              style={{
                                fontWeight: 700,
                                color: t.relevance_score >= 8 ? '#166534' : t.relevance_score >= 5 ? '#854D0E' : '#991B1B',
                              }}
                            >
                              {t.relevance_score}/10
                            </span>
                          </div>
                          <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 3,
                                width: `${t.relevance_score * 10}%`,
                                background: t.relevance_score >= 8 ? '#22C55E' : t.relevance_score >= 5 ? '#EAB308' : '#EF4444',
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Lucas angle */}
                        <div style={{ background: '#EBF5FF', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <p style={{ margin: 0, fontSize: 13, color: '#004182' }}>
                            💡 <strong>Tu ángulo:</strong> {t.lucas_angle}
                          </p>
                        </div>

                        {/* Source + CTA */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {t.source_url && (
                            <a href={t.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none' }}>
                              🔗 Ver fuente real →
                            </a>
                          )}
                          <button
                            onClick={() => handleGenerateHooks(t)}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 8,
                              border: 'none',
                              background: '#0A66C2',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            Generar Hooks →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* UNIQUE ANGLES */}
                {analysis.unique_angles && analysis.unique_angles.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🎯 Ángulos Únicos (solo vos)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.unique_angles.map((a, i) => (
                        <div key={i} style={{ background: 'white', borderLeft: '4px solid #00C17A', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{a.angle}</h4>
                          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{a.why_only_lucas}</p>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: 8,
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 600,
                              background: engagementColors[a.potential_virality]?.bg || '#F3F4F6',
                              color: engagementColors[a.potential_virality]?.text || '#666',
                            }}
                          >
                            🔥 Viralidad: {a.potential_virality}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONTENT GAPS */}
                {analysis.content_gaps && analysis.content_gaps.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🕳️ Content Gaps (oportunidades)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.content_gaps.map((g, i) => (
                        <div key={i} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 16 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{g.topic}</h4>
                          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>📡 {g.demand_signal}</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>💡 {g.suggested_approach}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REAL SOURCES */}
                {analysis.sources && analysis.sources.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🔗 Fuentes Reales (Perplexity Sonar)</h2>
                    <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 16 }}>
                      {analysis.sources.map((url, i) => (
                        <div key={i} style={{ padding: '6px 0', borderBottom: i < analysis.sources.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', wordBreak: 'break-all' }}
                          >
                            [{i + 1}] {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== VIEW: HOOKS ========== */}
            {!loading && hooksData && view === 'hooks' && (
              <div>
                <button
                  onClick={() => setView('analyze')}
                  style={{ background: 'none', border: 'none', color: '#0A66C2', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
                >
                  ← Volver a Tendencias
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🎯 Hooks Generados</h2>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Para: "{selectedTrend?.title}"</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(hooksData.hooks || []).map((h, i) => {
                    const isTop3 = (hooksData.recommended_top3 || []).includes(i);
                    const ec = engagementColors[h.estimated_engagement] || engagementColors.medium;
                    return (
                      <div
                        key={i}
                        style={{
                          background: 'white',
                          border: isTop3 ? '2px solid #00C17A' : '1px solid #E0E0E0',
                          borderRadius: 12,
                          padding: 20,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          position: 'relative',
                        }}
                      >
                        {isTop3 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: -10,
                              right: 16,
                              background: '#00C17A',
                              color: 'white',
                              padding: '2px 10px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            ⭐ TOP 3
                          </span>
                        )}
                        <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 12px', lineHeight: 1.4, color: '#191919' }}>"{h.text}"</p>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#F3F4F6', color: '#374151' }}>
                            {formulaIcons[h.formula_type] || '📝'} {h.formula_type}
                          </span>
                          <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: ec.bg, color: ec.text }}>
                            {h.estimated_engagement === 'viral' ? '🔥' : '📈'} {h.estimated_engagement}
                          </span>
                          <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#F3F4F6', color: '#374151' }}>
                            📑 {h.best_format}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>→ {h.follow_up_angle}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleGeneratePost(h)}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 8,
                              border: 'none',
                              background: '#0A66C2',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            Escribir Post →
                          </button>
                          <button
                            onClick={() => copyText(h.text, `hook-${i}`)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              border: '1px solid #E0E0E0',
                              background: 'white',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                              color: '#666',
                            }}
                          >
                            {copied === `hook-${i}` ? '✅ Copiado!' : '📋 Copiar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== VIEW: POST ========== */}
            {!loading && postData && view === 'post' && (
              <div>
                <button
                  onClick={() => setView('hooks')}
                  style={{ background: 'none', border: 'none', color: '#0A66C2', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
                >
                  ← Volver a Hooks
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>✍️ Post Completo - Preview LinkedIn</h2>

                {/* LinkedIn-style post preview */}
                <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {/* Post header */}
                  <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0A66C2, #00C17A)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'white',
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      LV
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Lucas Vega</p>
                      <p style={{ color: '#666', margin: 0, fontSize: 12 }}>Legal Tech Lead | Secretario Digesto & Modernización | #DigestIA</p>
                      <p style={{ color: '#999', margin: 0, fontSize: 11 }}>Ahora · 🌐</p>
                    </div>
                  </div>

                  {/* Post body */}
                  <div style={{ padding: '0 20px 16px' }}>
                    {(() => {
                      const body = postData.post_body || '';
                      const truncated = !expandedPost && body.length > 280;
                      const display = truncated ? body.slice(0, 280) : body;
                      return (
                        <div>
                          <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 14, lineHeight: 1.6, color: '#191919' }}>
                            {display}
                            {truncated && <span style={{ color: '#999' }}>...</span>}
                          </p>
                          {truncated && (
                            <button
                              onClick={() => setExpandedPost(true)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#666',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: 4,
                                fontSize: 13,
                              }}
                            >
                              ...ver más
                            </button>
                          )}
                        </div>
                      );
                    })()}
                    {/* Hashtags */}
                    <p style={{ color: '#0A66C2', fontSize: 14, marginTop: 12 }}>{(postData.hashtags || []).join(' ')}</p>
                  </div>

                  {/* Reactions bar */}
                  <div style={{ padding: '0 20px', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: -4 }}>
                        <span style={{ fontSize: 16 }}>👍💡👏</span>
                        <span style={{ color: '#666', fontSize: 12, marginLeft: 6 }}>{Math.floor(Math.random() * 80 + 20)}</span>
                      </div>
                      <span style={{ color: '#666', fontSize: 12 }}>{Math.floor(Math.random() * 15 + 5)} comentarios</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #E0E0E0', padding: '4px 8px' }}>
                    {['👍 Recomendar', '💬 Comentar', '🔄 Compartir', '📨 Enviar'].map((action) => (
                      <button key={action} style={{ padding: '12px 0', background: 'none', border: 'none', color: '#666', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                  <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0A66C2' }}>{postData.word_count || '~175'}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: 0 }}>palabras</p>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#00C17A' }}>{postData.engagement_prediction || 'high'}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: 0 }}>engagement</p>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#191919' }}>{postData.best_posting_time || 'Mar 8AM'}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: 0 }}>mejor horario</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button
                    onClick={() => copyText(postData.post_body + '\n\n' + (postData.hashtags || []).join(' '), 'post')}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#0A66C2',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    {copied === 'post' ? '✅ Post Copiado!' : '📋 Copiar Post Completo'}
                  </button>
                  <button
                    onClick={() => copyText(postData.first_comment || '', 'comment')}
                    style={{
                      padding: '14px 20px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      background: 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    {copied === 'comment' ? '✅ Copiado!' : '💬 1er Comentario'}
                  </button>
                </div>

                {/* First comment preview */}
                {postData.first_comment && (
                  <div style={{ marginTop: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 16 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 8px', color: '#166534' }}>💬 Primer comentario sugerido:</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.5 }}>{postData.first_comment}</p>
                  </div>
                )}

                {/* Visual suggestion + Image Prompt */}
                {postData.suggested_image && (
                  <div style={{ marginTop: 12, background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 16 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 8px', color: '#004182' }}>🖼️ Visual sugerido:</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{postData.suggested_image}</p>
                  </div>
                )}

                {/* Prompt para Imagen 3 / Nano Banana */}
                {postData.image_prompt && (
                  <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: '#166534' }}>🎨 Prompt para Nano Banana / Imagen 3:</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(postData.image_prompt);
                          const btn = document.getElementById('copy-img-prompt');
                          if (btn) {
                            btn.textContent = '✅ Copiado!';
                            setTimeout(() => {
                              btn.textContent = '📋 Copiar';
                            }, 2000);
                          }
                        }}
                        id="copy-img-prompt"
                        style={{
                          background: '#166534',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        📋 Copiar
                      </button>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#1a1a1a',
                        background: '#DCFCE7',
                        padding: 12,
                        borderRadius: 6,
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {postData.image_prompt}
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                      Prompt optimizado para Google Imagen 3 / Nano Banana Pro. Arquitectura 7 capas. Pegar directamente en AI Studio o Nano Banana.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ========== VIEW: DISCOVER (NUEVA) ========== */}
            {view === 'discover' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🔥 Auto-Discovery de Tendencias</h2>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                  Descubre tendencias relevantes sin keywords. El sistema analiza tu perfil y encuentra los temas más importantes ahora.
                </p>

                <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                    {analysis ? `Basado en tu análisis de: "${keyword}"` : 'Primero analiza una keyword en la pestaña "Analizar" para tener contexto'}
                  </p>
                  <button
                    onClick={handleDiscover}
                    disabled={isDiscovering || (!analysis && !keyword.trim())}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 14,
                      background: isDiscovering || (!analysis && !keyword.trim()) ? '#999' : '#B24020',
                      color: 'white',
                      cursor: isDiscovering || (!analysis && !keyword.trim()) ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}
                  >
                    {isDiscovering ? '⏳ Descubriendo tendencias...' : '🔥 Descubrir Tendencias'}
                  </button>
                </div>

                {trends && (
                  <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#B24020' }}>📈 Tendencias Detectadas</h3>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#333' }}>{trends}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 120, alignSelf: 'start' }}>
            {/* Profile card */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ height: 48, background: 'linear-gradient(135deg, #0B1931, #0A66C2)' }}></div>
              <div style={{ padding: '0 16px 16px', textAlign: 'center', marginTop: -24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: '3px solid white',
                    background: '#00C17A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'white',
                    fontSize: 18,
                    margin: '0 auto 8px',
                  }}
                >
                  LV
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Lucas Vega</p>
                <p style={{ color: '#666', fontSize: 12, margin: '4px 0 12px' }}>Legal Tech Lead | #DigestIA</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0A66C2', margin: 0, fontSize: 14 }}>172</p>
                    <p style={{ fontSize: 9, color: '#999', margin: 0 }}>ORDENANZAS</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0A66C2', margin: 0, fontSize: 14 }}>25K+</p>
                    <p style={{ fontSize: 9, color: '#999', margin: 0 }}>VECINOS</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0A66C2', margin: 0, fontSize: 14 }}>189</p>
                    <p style={{ fontSize: 9, color: '#999', margin: 0 }}>PROYECTOS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTENT TRACKER (NUEVO) */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#0A66C2', margin: '0 0 12px' }}>📅 CONTENT TRACKER</h4>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Registra tus posts y obtén sugerencias de qué publicar next.</p>

              {/* Formulario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Título del post"
                  value={newPost.titulo}
                  onChange={(e) => setNewPost({ ...newPost, titulo: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #E0E0E0', fontSize: 13 }}
                />
                <input
                  type="text"
                  placeholder="Pilar (ej: LegalTech)"
                  value={newPost.pilar}
                  onChange={(e) => setNewPost({ ...newPost, pilar: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #E0E0E0', fontSize: 13 }}
                />
                <input
                  type="date"
                  value={newPost.fecha}
                  onChange={(e) => setNewPost({ ...newPost, fecha: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #E0E0E0', fontSize: 13 }}
                />
                <button
                  onClick={handleAddPost}
                  disabled={!newPost.titulo || !newPost.pilar || !newPost.fecha}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: !newPost.titulo || !newPost.pilar || !newPost.fecha ? '#CCC' : '#0A66C2',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: !newPost.titulo || !newPost.pilar || !newPost.fecha ? 'not-allowed' : 'pointer',
                  }}
                >
                  + Agregar Post
                </button>
              </div>

              {/* Lista de posts */}
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {publishedPosts.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '20px 0' }}>No hay posts registrados</p>
                ) : (
                  publishedPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #F3F4F6',
                        fontSize: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.titulo}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: 11 }}>
                          {post.pilar} • {post.fecha}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Botón sugerencia */}
              {publishedPosts.length > 0 && (
                <button
                  onClick={handleGetSuggestion}
                  disabled={isLoadingTracker}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: '1px solid #0A66C2',
                    background: 'white',
                    color: '#0A66C2',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: isLoadingTracker ? 'wait' : 'pointer',
                  }}
                >
                  {isLoadingTracker ? '⏳ Analizando...' : '💡 ¿Qué publico ahora?'}
                </button>
              )}

              {/* Sugerencia */}
              {trackerSuggestion && (
                <div style={{ marginTop: 12, padding: 12, background: '#EBF5FF', borderRadius: 6, border: '1px solid #BFDBFE' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#004182' }}>💡 Sugerencia:</h5>
                  <p style={{ margin: 0, fontSize: 12, color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{trackerSuggestion}</p>
                </div>
              )}
            </div>

            {/* Pillars */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#999', margin: '0 0 12px' }}>🎯 PILARES DE CONTENIDO</h4>
              {[
                { name: 'DigestIA', pct: 35, color: '#0A66C2' },
                { name: 'LegalTech', pct: 25, color: '#057642' },
                { name: 'IA Gobierno', pct: 20, color: '#B24020' },
                { name: 'Aprendizaje', pct: 15, color: '#7C3AED' },
                { name: 'Personal', pct: 5, color: '#92400E' },
              ].map((p) => (
                <div key={p.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 700 }}>{p.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: p.color, width: `${p.pct}%`, borderRadius: 2 }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#999', margin: '0 0 12px' }}>🕐 HORARIOS ÓPTIMOS</h4>
              {[
                { day: 'Martes', time: '08:00', alt: '12:00' },
                { day: 'Miércoles', time: '08:00', alt: '17:00' },
                { day: 'Jueves', time: '08:00', alt: '12:00' },
              ].map((s) => (
                <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{s.day}</span>
                  <span>
                    <strong>{s.time}</strong> <span style={{ color: '#999' }}>/ {s.alt}</span>
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: '#999', marginTop: 8, marginBottom: 0 }}>GMT-3 (Argentina)</p>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#999', margin: '0 0 12px' }}>📜 HISTORIAL</h4>
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnalyze(h.query)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 0',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #F9FAFB',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#0A66C2',
                    }}
                  >
                    {h.query}
                  </button>
                ))}
              </div>
            )}

            {/* Tips */}
            <div style={{ background: '#0B1931', borderRadius: 12, padding: 16, color: 'white' }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#00C17A', margin: '0 0 12px' }}>💡 LINKEDIN TIPS 2026</h4>
              {['Engagement 1ra hora: 30%', 'Tiempo lectura: 25% del score', 'Comentarios +15 palabras: 20%', 'No editar en 60 min post-publicar', 'Máximo 5 hashtags'].map((tip, i) => (
                <p key={i} style={{ fontSize: 11, color: '#CBD5E1', margin: '0 0 6px', paddingLeft: 16, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#00C17A' }}>✓</span>
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #E0E0E0', marginTop: 40, background: 'white' }}>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          LinkedIn Trend Analyzer · Powered by Perplexity Sonar + Gemini Flash · Built by Lucas Vega 🚀
        </p>
      </footer>
    </div>
  );
}
