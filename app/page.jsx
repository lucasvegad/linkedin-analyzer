"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { analyzeProfile } from "@/lib/perplexity";
import { generateContent } from "@/lib/gemini";
import { Loader2, Sparkles, TrendingUp, Calendar, Target, Lightbulb } from "lucide-react";

export default function Home() {
  const [profile, setProfile] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [pillar, setPillar] = useState("");
  const [contentIdea, setContentIdea] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para Feature 1: Auto-Discovery
  const [trends, setTrends] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  
  // Estados para Feature 2: Content Tracker
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [newPost, setNewPost] = useState({ titulo: "", pilar: "", fecha: "" });
  const [trackerSuggestion, setTrackerSuggestion] = useState(null);
  const [isLoadingTracker, setIsLoadingTracker] = useState(false);

  const handleAnalyze = async () => {
    if (!profile.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeProfile(profile);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!pillar.trim() || !contentIdea.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const post = await generateContent(
        analysis?.profile_summary || profile,
        pillar,
        contentIdea
      );
      setGeneratedPost(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Feature 1: Auto-Discovery
  const handleDiscover = async () => {
    if (!profile.trim() && !analysis?.profile_summary) {
      setError("Primero analiza tu perfil o ingresa información de tu nicho");
      return;
    }

    setIsDiscovering(true);
    setError(null);

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: analysis?.profile_summary || profile,
        }),
      });

      if (!response.ok) throw new Error("Error al descubrir tendencias");

      const data = await response.json();
      setTrends(data.trends);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Feature 2: Content Tracker
  const handleAddPost = () => {
    if (!newPost.titulo || !newPost.pilar || !newPost.fecha) return;
    
    setPublishedPosts([...publishedPosts, { ...newPost, id: Date.now() }]);
    setNewPost({ titulo: "", pilar: "", fecha: "" });
  };

  const handleRemovePost = (id) => {
    setPublishedPosts(publishedPosts.filter(p => p.id !== id));
  };

  const handleGetSuggestion = async () => {
    if (publishedPosts.length === 0) {
      setError("Agrega al menos un post publicado para obtener sugerencias");
      return;
    }

    setIsLoadingTracker(true);
    setError(null);

    try {
      const response = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishedPosts,
          profile: analysis?.profile_summary || profile,
        }),
      });

      if (!response.ok) throw new Error("Error al obtener sugerencia");

      const data = await response.json();
      setTrackerSuggestion(data.suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingTracker(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LinkedIn Analyzer PRO
          </h1>
          <p className="text-gray-600">
            Analiza tu perfil, descubre tendencias y genera contenido optimizado
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Análisis de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Análisis de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Pega aquí tu perfil de LinkedIn o describe tu nicho profesional..."
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || !profile.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    "Analizar Perfil"
                  )}
                </Button>

                {analysis && (
                  <div className="space-y-4 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        📊 Resumen
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {analysis.profile_summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        🎯 Pilares de Contenido Sugeridos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.content_pillars?.map((pillar, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                          >
                            <h4 className="font-medium text-gray-900 mb-1">
                              {pillar.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {pillar.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        💡 Keywords Relevantes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords?.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Generar / Descubrir */}
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">
                  <Target className="w-4 h-4 mr-2" />
                  Generar Contenido
                </TabsTrigger>
                <TabsTrigger value="discover">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  🔥 Descubrir Tendencias
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Generar Contenido */}
              <TabsContent value="generate">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Generación de Contenido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilar de Contenido
                      </label>
                      <Input
                        placeholder="Ej: Automatización Legal, Growth Mindset..."
                        value={pillar}
                        onChange={(e) => setPillar(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idea / Tema del Post
                      </label>
                      <Textarea
                        placeholder="Describe brevemente sobre qué quieres escribir..."
                        value={contentIdea}
                        onChange={(e) => setContentIdea(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !pillar.trim() || !contentIdea.trim()}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        "Generar Post"
                      )}
                    </Button>

                    {generatedPost && (
                      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-900">
                            📝 Post Generado
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPost);
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                            {generatedPost}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Descubrir Tendencias */}
              <TabsContent value="discover">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Auto-Discovery de Tendencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Descubre tendencias relevantes en LinkedIn sin necesidad de keywords.
                      El sistema analizará tu perfil y encontrará los temas más importantes ahora.
                    </p>

                    <Button
                      onClick={handleDiscover}
                      disabled={isDiscovering || (!profile.trim() && !analysis)}
                      className="w-full"
                    >
                      {isDiscovering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Descubriendo tendencias...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Descubrir Tendencias
                        </>
                      )}
                    </Button>

                    {trends && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                          <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                            <span>🔥</span>
                            Tendencias Detectadas
                          </h3>
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                              {trends}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar: Content Tracker */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Content Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Registra tus posts publicados y obtén sugerencias inteligentes
                  sobre qué pilar trabajar próximamente.
                </p>

                {/* Formulario para agregar post */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <Input
                    placeholder="Título del post"
                    value={newPost.titulo}
                    onChange={(e) => setNewPost({...newPost, titulo: e.target.value})}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Pilar (ej: LegalTech)"
                    value={newPost.pilar}
                    onChange={(e) => setNewPost({...newPost, pilar: e.target.value})}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={newPost.fecha}
                    onChange={(e) => setNewPost({...newPost, fecha: e.target.value})}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleAddPost}
                    disabled={!newPost.titulo || !newPost.pilar || !newPost.fecha}
                    size="sm"
                    className="w-full"
                  >
                    Agregar Post
                  </Button>
                </div>

                {/* Lista de posts */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {publishedPosts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay posts registrados aún
                    </p>
                  ) : (
                    publishedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white p-2 rounded border border-gray-200 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {post.titulo}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {post.pilar}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {post.fecha}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePost(post.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Botón para obtener sugerencia */}
                {publishedPosts.length > 0 && (
                  <Button
                    onClick={handleGetSuggestion}
                    disabled={isLoadingTracker}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoadingTracker ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      "¿Qué publico ahora?"
                    )}
                  </Button>
                )}

                {/* Sugerencia */}
                {trackerSuggestion && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                      💡 Sugerencia
                    </h4>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {trackerSuggestion}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
