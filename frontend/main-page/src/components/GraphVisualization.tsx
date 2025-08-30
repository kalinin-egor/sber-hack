import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Network, RefreshCw, Zap, Orbit, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GraphNode {
  id: string;
  label: string;
  type: 'text' | 'keyword' | 'emotion' | 'topic';
  size: number;
  color: string;
  x: number;
  y: number;
  connections: string[];
  metadata?: {
    confidence?: number;
    frequency?: number;
    sentiment?: string;
  };
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: string;
}

export function GraphVisualization({ transcriptionData }: { transcriptionData?: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Мок данные для демонстрации
  const generateSampleGraph = () => {
    const sampleNodes: GraphNode[] = [
      {
        id: 'text1',
        label: 'Анализ аудио',
        type: 'text',
        size: 40,
        color: '#3b82f6',
        x: 400,
        y: 300,
        connections: ['keyword1', 'keyword2', 'emotion1'],
        metadata: { confidence: 0.95 }
      },
      {
        id: 'keyword1',
        label: 'Качество',
        type: 'keyword',
        size: 25,
        color: '#10b981',
        x: 200,
        y: 200,
        connections: ['text1', 'topic1'],
        metadata: { frequency: 12, confidence: 0.87 }
      },
      {
        id: 'keyword2',
        label: 'Система',
        type: 'keyword',
        size: 30,
        color: '#10b981',
        x: 600,
        y: 200,
        connections: ['text1', 'topic2'],
        metadata: { frequency: 18, confidence: 0.92 }
      },
      {
        id: 'emotion1',
        label: 'Позитивное',
        type: 'emotion',
        size: 20,
        color: '#f59e0b',
        x: 300,
        y: 450,
        connections: ['text1'],
        metadata: { sentiment: 'positive', confidence: 0.82 }
      },
      {
        id: 'topic1',
        label: 'Технологии',
        type: 'topic',
        size: 35,
        color: '#8b5cf6',
        x: 150,
        y: 100,
        connections: ['keyword1', 'keyword3'],
        metadata: { confidence: 0.89 }
      },
      {
        id: 'topic2',
        label: 'Анализ данных',
        type: 'topic',
        size: 32,
        color: '#8b5cf6',
        x: 650,
        y: 100,
        connections: ['keyword2', 'keyword4'],
        metadata: { confidence: 0.91 }
      },
      {
        id: 'keyword3',
        label: 'Распознавание',
        type: 'keyword',
        size: 22,
        color: '#10b981',
        x: 100,
        y: 300,
        connections: ['topic1'],
        metadata: { frequency: 8, confidence: 0.78 }
      },
      {
        id: 'keyword4',
        label: 'Обработка',
        type: 'keyword',
        size: 28,
        color: '#10b981',
        x: 700,
        y: 350,
        connections: ['topic2'],
        metadata: { frequency: 15, confidence: 0.85 }
      }
    ];

    const sampleLinks: GraphLink[] = [
      { source: 'text1', target: 'keyword1', strength: 0.9, type: 'contains' },
      { source: 'text1', target: 'keyword2', strength: 0.8, type: 'contains' },
      { source: 'text1', target: 'emotion1', strength: 0.7, type: 'expresses' },
      { source: 'keyword1', target: 'topic1', strength: 0.6, type: 'belongs_to' },
      { source: 'keyword2', target: 'topic2', strength: 0.7, type: 'belongs_to' },
      { source: 'topic1', target: 'keyword3', strength: 0.5, type: 'relates_to' },
      { source: 'topic2', target: 'keyword4', strength: 0.6, type: 'relates_to' }
    ];

    setNodes(sampleNodes);
    setLinks(sampleLinks);
  };

  useEffect(() => {
    generateSampleGraph();
    
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📄';
      case 'keyword': return '🔑';
      case 'emotion': return '😊';
      case 'topic': return '📂';
      default: return '⚪';
    }
  };

  const animateGraph = () => {
    // Простая анимация - перемешивание позиций узлов
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        x: Math.random() * (dimensions.width - 100) + 50,
        y: Math.random() * (dimensions.height - 100) + 50
      }))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full overflow-hidden backdrop-blur-sm bg-card/80 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"
              >
                <Orbit className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Граф анализа текстов
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Интерактивная визуализация связей между данными
                </p>
              </div>
            </CardTitle>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={animateGraph} 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200"
                >
                  <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                  Анимация
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={generateSampleGraph} 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
                  Обновить
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Граф */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <div className="border-2 rounded-xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 shadow-inner overflow-hidden" style={{ height: '600px' }}>
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  className="cursor-pointer"
                >
                  {/* Градиенты для связей */}
                  <defs>
                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Связи */}
                  {links.map((link, index) => {
                    const sourceNode = nodes.find(n => n.id === link.source);
                    const targetNode = nodes.find(n => n.id === link.target);
                    
                    if (!sourceNode || !targetNode) return null;
                    
                    return (
                      <motion.line
                        key={`link-${index}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="url(#linkGradient)"
                        strokeWidth={link.strength * 4}
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                    );
                  })}

                  {/* Узлы */}
                  {nodes.map((node, index) => (
                    <motion.g
                      key={node.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={node.color}
                        stroke={selectedNode?.id === node.id ? '#fbbf24' : '#fff'}
                        strokeWidth={selectedNode?.id === node.id ? 4 : 3}
                        opacity={0.9}
                        className="cursor-pointer drop-shadow-lg"
                        onClick={() => handleNodeClick(node)}
                        filter="url(#glow)"
                        animate={{
                          r: selectedNode?.id === node.id ? node.size + 5 : node.size,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      {/* Иконка внутри узла */}
                      <text
                        x={node.x}
                        y={node.y + 6}
                        textAnchor="middle"
                        className="fill-white pointer-events-none select-none drop-shadow-sm"
                        fontSize="16"
                      >
                        {getNodeTypeIcon(node.type)}
                      </text>
                      {/* Подпись */}
                      <motion.text
                        x={node.x}
                        y={node.y + node.size + 25}
                        textAnchor="middle"
                        className="fill-foreground pointer-events-none select-none font-medium"
                        fontSize="13"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.8 }}
                      >
                        {node.label}
                      </motion.text>
                    </motion.g>
                  ))}
                </svg>
              </div>
            </motion.div>

            {/* Панель информации */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full lg:w-80 space-y-6"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </motion.div>
                    Легенда
                  </h3>
                  <div className="space-y-3">
                    {[
                      { color: "bg-blue-500", label: "Текст", icon: "📄" },
                      { color: "bg-green-500", label: "Ключевые слова", icon: "🔑" },
                      { color: "bg-yellow-500", label: "Эмоции", icon: "😊" },
                      { color: "bg-purple-500", label: "Темы", icon: "📂" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                      >
                        <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></div>
                        <span className="text-sm font-medium">{item.icon} {item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-2xl"
                          >
                            {getNodeTypeIcon(selectedNode.type)}
                          </motion.span>
                          <span className="text-amber-800 dark:text-amber-200">
                            {selectedNode.label}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Badge 
                          variant="outline"
                          className="bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-200"
                        >
                          📊 {selectedNode.type}
                        </Badge>
                        
                        {selectedNode.metadata && (
                          <div className="space-y-3">
                            {selectedNode.metadata.confidence && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">🎯 Уверенность:</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    {(selectedNode.metadata.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            {selectedNode.metadata.frequency && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">📈 Частота:</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {selectedNode.metadata.frequency}
                                  </span>
                                </div>
                              </div>
                            )}
                            {selectedNode.metadata.sentiment && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">😊 Настроение:</span>
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {selectedNode.metadata.sentiment}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">🔗 Связи:</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {selectedNode.connections.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <strong>Связан с:</strong><br />
                          {selectedNode.connections.join(', ')}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h4 className="mb-4 flex items-center gap-2 font-semibold">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        📊
                      </motion.div>
                      Статистика графа
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: "Узлов", value: nodes.length, icon: "🔵" },
                        { label: "Связей", value: links.length, icon: "🔗" },
                        { label: "Плотность", value: ((links.length * 2) / (nodes.length * (nodes.length - 1))).toFixed(3), icon: "📊" }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                          className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"
                        >
                          <span className="text-sm font-medium">
                            {stat.icon} {stat.label}:
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {stat.value}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}