import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { PawPrint, Plus, Trash2, Eye, Users, FileText, Search, Calendar, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Animal {
  id: string;
  name: string;
  species: string;
  emoji: string;
  createdAt: string;
  transcriptionsCount: number;
  lastActivity?: string;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: string;
  duration: number;
  language: string;
  animalName: string;
}

interface AnimalManagementProps {
  transcriptionData: TranscriptionResult[];
}

export function AnimalManagement({ transcriptionData }: AnimalManagementProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newAnimalSpecies, setNewAnimalSpecies] = useState('');
  const [newAnimalEmoji, setNewAnimalEmoji] = useState('🐾');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Инициализируем животных на основе данных транскрипций
  useEffect(() => {
    const animalNames = [...new Set(transcriptionData.map(t => t.animalName))];
    const initialAnimals: Animal[] = animalNames.map((name, index) => {
      const animalTranscriptions = transcriptionData.filter(t => t.animalName === name);
      const lastTranscription = animalTranscriptions[animalTranscriptions.length - 1];
      
      return {
        id: `animal-${index}`,
        name,
        species: getSpeciesFromName(name),
        emoji: getEmojiFromName(name),
        createdAt: new Date().toLocaleDateString('ru-RU'),
        transcriptionsCount: animalTranscriptions.length,
        lastActivity: lastTranscription?.timestamp
      };
    });
    
    setAnimals(initialAnimals);
  }, [transcriptionData]);

  const getSpeciesFromName = (name: string): string => {
    const speciesMap: { [key: string]: string } = {
      'лев': 'Большая кошка',
      'тигр': 'Большая кошка',
      'медведь': 'Медвежьи',
      'волк': 'Псовые',
      'лиса': 'Псовые',
      'заяц': 'Зайцевые',
      'белка': 'Беличьи',
      'олень': 'Оленевые',
      'слон': 'Слоновые',
      'жираф': 'Жирафовые',
      'зебра': 'Лошадиные',
      'кот': 'Домашние кошки',
      'собака': 'Домашние собаки'
    };
    return speciesMap[name.toLowerCase()] || 'Неизвестный вид';
  };

  const getEmojiFromName = (name: string): string => {
    const emojiMap: { [key: string]: string } = {
      'лев': '🦁',
      'тигр': '🐅',
      'медведь': '🐻',
      'волк': '🐺',
      'лиса': '🦊',
      'заяц': '🐰',
      'белка': '🐿️',
      'олень': '🦌',
      'слон': '🐘',
      'жираф': '🦒',
      'зебра': '🦓',
      'кот': '🐱',
      'собака': '🐶'
    };
    return emojiMap[name.toLowerCase()] || '🐾';
  };

  const createAnimal = () => {
    if (!newAnimalName.trim()) return;
    
    const newAnimal: Animal = {
      id: `animal-${Date.now()}`,
      name: newAnimalName.trim(),
      species: newAnimalSpecies.trim() || getSpeciesFromName(newAnimalName.trim()),
      emoji: newAnimalEmoji,
      createdAt: new Date().toLocaleDateString('ru-RU'),
      transcriptionsCount: 0
    };
    
    setAnimals(prev => [...prev, newAnimal]);
    setNewAnimalName('');
    setNewAnimalSpecies('');
    setNewAnimalEmoji('🐾');
    setIsCreateDialogOpen(false);
  };

  const deleteAnimal = (animalId: string) => {
    setAnimals(prev => prev.filter(animal => animal.id !== animalId));
    if (selectedAnimal?.id === animalId) {
      setSelectedAnimal(null);
    }
  };

  const getAnimalTranscriptions = (animalName: string) => {
    return transcriptionData.filter(t => t.animalName === animalName);
  };

  const filteredAnimals = animals.filter(animal =>
    animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full overflow-hidden backdrop-blur-sm bg-card/80 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
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
                className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full"
              >
                <PawPrint className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Управление животными
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Создавайте, просматривайте и управляйте данными о животных
                </p>
              </div>
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать животное
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-emerald-600" />
                    Создать новое животное
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Имя животного</label>
                    <Input
                      value={newAnimalName}
                      onChange={(e) => setNewAnimalName(e.target.value)}
                      placeholder="Введите имя..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Вид (необязательно)</label>
                    <Input
                      value={newAnimalSpecies}
                      onChange={(e) => setNewAnimalSpecies(e.target.value)}
                      placeholder="Введите вид..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Эмодзи</label>
                    <Input
                      value={newAnimalEmoji}
                      onChange={(e) => setNewAnimalEmoji(e.target.value)}
                      placeholder="🐾"
                      className="mt-1"
                      maxLength={2}
                    />
                  </div>
                  <Button 
                    onClick={createAnimal} 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    disabled={!newAnimalName.trim()}
                  >
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Статистика */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
              <CardContent className="p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                >
                  {animals.length}
                </motion.div>
                <div className="text-sm text-blue-800 dark:text-blue-200 flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  Всего животных
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200">
              <CardContent className="p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  className="text-2xl font-bold text-green-600 dark:text-green-400"
                >
                  {transcriptionData.length}
                </motion.div>
                <div className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center gap-1">
                  <FileText className="h-4 w-4" />
                  Транскрипций
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200">
              <CardContent className="p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                >
                  {animals.filter(a => a.transcriptionsCount > 0).length}
                </motion.div>
                <div className="text-sm text-purple-800 dark:text-purple-200 flex items-center justify-center gap-1">
                  <Heart className="h-4 w-4" />
                  Активных
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200">
              <CardContent className="p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  className="text-2xl font-bold text-orange-600 dark:text-orange-400"
                >
                  {new Set(animals.map(a => a.species)).size}
                </motion.div>
                <div className="text-sm text-orange-800 dark:text-orange-200 flex items-center justify-center gap-1">
                  <PawPrint className="h-4 w-4" />
                  Видов
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Поиск */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск животных по имени или виду..."
                className="pl-10 h-12"
              />
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Список животных */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex-1"
            >
              <h3 className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Все животные ({filteredAnimals.length})
              </h3>
              
              {filteredAnimals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Животные не найдены' : 'Животные ещё не созданы'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredAnimals.map((animal, index) => (
                      <motion.div
                        key={animal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedAnimal(animal)}
                      >
                        <Card className={`transition-all duration-300 hover:shadow-lg ${
                          selectedAnimal?.id === animal.id 
                            ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                            : 'hover:shadow-md'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <motion.span
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                  className="text-2xl"
                                >
                                  {animal.emoji}
                                </motion.span>
                                <div>
                                  <h4 className="font-semibold">{animal.name}</h4>
                                  <p className="text-sm text-muted-foreground">{animal.species}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnimal(animal);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteAnimal(animal.id);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {animal.transcriptionsCount} записей
                              </Badge>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {animal.createdAt}
                              </div>
                            </div>
                            
                            {animal.lastActivity && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Последняя активность: {animal.lastActivity}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Детали животного */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full lg:w-80"
            >
              <AnimatePresence>
                {selectedAnimal ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800 sticky top-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-3xl"
                          >
                            {selectedAnimal.emoji}
                          </motion.span>
                          <div>
                            <h3 className="text-emerald-800 dark:text-emerald-200">
                              {selectedAnimal.name}
                            </h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              {selectedAnimal.species}
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border text-center">
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {selectedAnimal.transcriptionsCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Записей</div>
                          </div>
                          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {selectedAnimal.createdAt}
                            </div>
                            <div className="text-xs text-muted-foreground">Создан</div>
                          </div>
                        </div>

                        {selectedAnimal.transcriptionsCount > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-emerald-600" />
                              Транскрипции
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {getAnimalTranscriptions(selectedAnimal.name).map((transcription, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-white dark:bg-gray-900 p-3 rounded-lg border text-sm"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {(transcription.confidence * 100).toFixed(1)}% точность
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {transcription.duration.toFixed(1)}с
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed">
                                    {transcription.text.length > 100 
                                      ? transcription.text.substring(0, 100) + '...'
                                      : transcription.text
                                    }
                                  </p>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {transcription.timestamp}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedAnimal.transcriptionsCount === 0 && (
                          <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                              У этого животного пока нет записей транскрипций.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Выберите животное для просмотра деталей
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}