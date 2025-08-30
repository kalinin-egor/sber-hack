import React, { useState } from 'react';
import { AudioAnalyzer } from './components/AudioAnalyzer';
import { GraphVisualization } from './components/GraphVisualization';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Separator } from './components/ui/separator';
import { Activity, BarChart3, Mic, Network, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: string;
  duration: number;
  language: string;
}

export default function App() {
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [activeTab, setActiveTab] = useState("analyzer");

  const handleTranscriptionComplete = (result: TranscriptionResult) => {
    setTranscriptions(prev => [...prev, result]);
    // Автоматически переключаемся на граф после анализа
    setTimeout(() => setActiveTab("graph"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Заголовок */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur opacity-40"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                Анализатор аудио
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"
              />
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Загружайте или записывайте аудио для анализа и визуализации данных в интерактивном графе.
            Используйте возможности искусственного интеллекта для обработки речи.
          </motion.p>
        </motion.div>

        {/* Статистика */}
        <AnimatePresence>
          {transcriptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 overflow-hidden">
                  <CardContent className="relative p-6">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-blue-100 mb-1">Всего анализов</p>
                        <motion.p
                          key={transcriptions.length}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-bold"
                        >
                          {transcriptions.length}
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <BarChart3 className="h-10 w-10 text-blue-200" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl border-0 overflow-hidden">
                  <CardContent className="relative p-6">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-green-100 mb-1">Средняя точность</p>
                        <motion.p
                          key={transcriptions.length}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-bold"
                        >
                          {(transcriptions.reduce((acc, t) => acc + t.confidence, 0) / transcriptions.length * 100).toFixed(1)}%
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <TrendingUp className="h-10 w-10 text-green-200" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl border-0 overflow-hidden">
                  <CardContent className="relative p-6">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-purple-100 mb-1">Общая длительность</p>
                        <motion.p
                          key={transcriptions.length}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-bold"
                        >
                          {transcriptions.reduce((acc, t) => acc + t.duration, 0).toFixed(1)}с
                        </motion.p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="h-10 w-10 text-purple-200" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Основной контент */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-10 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border">
                <TabsTrigger 
                  value="analyzer" 
                  className="flex items-center gap-3 text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <Mic className="h-5 w-5" />
                  Анализ аудио
                </TabsTrigger>
                <TabsTrigger 
                  value="graph" 
                  className="flex items-center gap-3 text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                >
                  <Network className="h-5 w-5" />
                  Граф анализа
                </TabsTrigger>
              </TabsList>
            </motion.div>
          
            <TabsContent value="analyzer" className="space-y-8">
              <AudioAnalyzer onTranscriptionComplete={handleTranscriptionComplete} />
              
              {/* История транскрипций */}
              <AnimatePresence>
                {transcriptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="backdrop-blur-sm bg-card/80 shadow-xl border-2">
                      <CardContent className="p-8">
                        <motion.h3
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mb-6 flex items-center gap-3 text-xl"
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"
                          >
                            <Activity className="h-5 w-5 text-white" />
                          </motion.div>
                          История анализов
                        </motion.h3>
                        <div className="space-y-6">
                          {transcriptions.slice(-3).reverse().map((transcription, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-white/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-950/50 border"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant="outline" 
                                    className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
                                  >
                                    🌐 {transcription.language}
                                  </Badge>
                                  <Badge 
                                    variant="secondary"
                                    className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200"
                                  >
                                    ✅ {(transcription.confidence * 100).toFixed(1)}% точность
                                  </Badge>
                                </div>
                                <span className="text-sm text-muted-foreground font-medium">
                                  📅 {transcription.timestamp}
                                </span>
                              </div>
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="text-sm bg-white dark:bg-gray-900 p-4 rounded-lg border shadow-sm leading-relaxed"
                              >
                                {transcription.text.length > 200 
                                  ? transcription.text.substring(0, 200) + '...'
                                  : transcription.text
                                }
                              </motion.p>
                              {index < transcriptions.slice(-3).length - 1 && (
                                <Separator className="my-4" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          
            <TabsContent value="graph">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GraphVisualization transcriptionData={transcriptions} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Подвал */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 text-center"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border">
            <p className="text-muted-foreground mb-4">
              Анализатор аудио с функциями загрузки, записи и визуализации данных
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Распознавание речи
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Анализ данных
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Визуализация
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}