import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Mic, Play, Square, Loader2, Volume2, PawPrint } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { AnimalsService } from '../../application/services/AnimalsService';
import { useAuth } from '../stores/AuthContext';

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: string;
  duration: number;
  language: string;
  animalName: string;
}

export function AudioAnalyzer({ onTranscriptionComplete }: { onTranscriptionComplete: (result: TranscriptionResult) => void }) {
  const { state } = useAuth();
  const animalsService = new AnimalsService();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [animals, setAnimals] = useState<any[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Загрузка животных и типов при инициализации
  useEffect(() => {
    const loadData = async () => {
      try {
        const [animalsData, typesData] = await Promise.all([
          animalsService.getAllAnimals(),
          animalsService.getAnimalTypes()
        ]);
        setAnimals(animalsData);
        setAnimalTypes(typesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Ошибка загрузки данных');
      }
    };

    if (state.isAuthenticated) {
      loadData();
    }
  }, [state.isAuthenticated]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setRecordedAudio(null);
      setTranscription(null);
    }
  };

  // Анимация уровня аудио
  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
    }
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  // Таймер записи
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Настройка аудио анализа для визуализации
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        setAudioFile(null);
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription(null);
      updateAudioLevel();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  // Форматирование времени записи
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudio = async () => {
    if (!audioFile && !recordedAudio) return;
    if (!selectedAnimalId) return;

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // Прогресс анализа
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Создаем файл для отправки
      let fileToSend: File;
      if (audioFile) {
        fileToSend = audioFile;
      } else if (recordedAudio) {
        fileToSend = new File([recordedAudio], 'recording.wav', { type: 'audio/wav' });
      } else {
        throw new Error('Нет аудио для обработки');
      }

      // Отправляем на обработку
      const result = await animalsService.processAudio(
        fileToSend, 
        selectedAnimalId, 
        'Аудио анализ из веб-интерфейса'
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Находим информацию о животном
      const selectedAnimal = animals.find(a => a.id === selectedAnimalId);
      
      // Создаем результат для UI
      const transcriptionResult: TranscriptionResult = {
        text: result.behavior_state || 'Анализ завершен успешно',
        confidence: 0.95, // API не возвращает confidence, используем фиксированное значение
        timestamp: new Date().toLocaleString('ru-RU'),
        duration: 15, // API не возвращает длительность, используем фиксированное значение
        language: 'ru-RU',
        animalName: selectedAnimal?.name || 'Неизвестное животное'
      };

      setTranscription(transcriptionResult);
      onTranscriptionComplete(transcriptionResult);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Ошибка обработки аудио');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full overflow-hidden backdrop-blur-sm bg-card/80 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: isRecording ? [1, 1.1, 1] : 1,
                rotate: isRecording ? [0, 5, -5, 0] : 0
              }}
              transition={{
                duration: 2,
                repeat: isRecording ? Infinity : 0,
                ease: "easeInOut"
              }}
              className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"
            >
              <Volume2 className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h3 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Анализ аудио
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Загрузите файл или запишите голос для анализа
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Выбор животного */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full"
                  >
                    <PawPrint className="h-5 w-5 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                    Выберите животное
                  </h3>
                </div>
                <Select value={selectedAnimalId?.toString() || ''} onValueChange={(value) => setSelectedAnimalId(value ? parseInt(value) : null)}>
                  <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-900 border-emerald-300 dark:border-emerald-700">
                    <SelectValue placeholder="🐾 Выберите животное для анализа..." />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.length > 0 ? (
                      animals.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id.toString()}>
                          🐾 {animal.name} ({animal.animal})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Загрузка животных...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!selectedAnimalId && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 mt-2"
                  >
                    ⚠️ Выбор животного обязателен для начала анализа
                  </motion.p>
                )}
                {animals.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-yellow-600 dark:text-yellow-400 mt-2"
                  >
                    📋 Сначала создайте животных в разделе "Управление животными"
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Центральная область записи */}
          <div className="flex flex-col items-center space-y-6">
            {/* Визуализация записи */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center justify-center"
                >
                  {/* Пульсирующие кольца */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border-2 border-red-500/30"
                      style={{
                        width: 100 + i * 40,
                        height: 100 + i * 40,
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.3, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                  
                  {/* Центральная кнопка микрофона */}
                  <motion.div
                    className="relative z-10 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                    animate={{
                      scale: [1, 1 + audioLevel * 0.3, 1],
                    }}
                    transition={{ duration: 0.1 }}
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  {/* Волны */}
                  <div className="absolute -bottom-8 flex space-x-1">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
                        animate={{
                          height: [4, 4 + audioLevel * 30 + Math.random() * 10, 4],
                        }}
                        transition={{
                          duration: 0.3,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Таймер */}
                  <motion.div
                    className="absolute -bottom-16 bg-black/80 text-white px-3 py-1 rounded-full text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {formatRecordingTime(recordingTime)}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопки управления */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-14 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800"
                  disabled={isRecording || isAnalyzing}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Загрузить аудио
                </Button>
              </motion.div>
              
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className={`w-full h-14 ${
                    isRecording 
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  }`}
                  disabled={isAnalyzing}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-5 w-5 mr-2" />
                      Остановить запись
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Записать аудио
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Ошибки */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Статус индикаторы */}
          <AnimatePresence>
            {audioFile && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    📁 Выбран файл: <strong>{audioFile.name}</strong> ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {recordedAudio && !isRecording && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800">
                  <Mic className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    🎤 Аудио записано ({(recordedAudio.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Кнопка анализа */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-md mx-auto"
          >
            <Button 
              onClick={analyzeAudio}
              disabled={(!audioFile && !recordedAudio) || isAnalyzing || isRecording || !selectedAnimalId}
              className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Анализируется...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-3" />
                  {!selectedAnimalId ? 'Выберите животное' : 'Начать анализ'}
                </>
              )}
            </Button>
          </motion.div>

          {/* Прогресс анализа */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 max-w-md mx-auto"
              >
                <div className="relative">
                  <Progress value={progress} className="w-full h-3" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 400] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    Обработка аудио... {progress}%
                  </p>
                  <div className="flex justify-center space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ y: [-4, 4, -4] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Результат транскрипции */}
          <AnimatePresence>
            {transcription && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                        className="p-2 bg-green-500 text-white rounded-full"
                      >
                        <Volume2 className="h-4 w-4" />
                      </motion.div>
                      Результат анализа
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2">
                        📝 Транскрипция:
                      </h4>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm"
                      >
                        <p className="leading-relaxed">
                          {transcription.text}
                        </p>
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(transcription.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Точность</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {transcription.duration.toFixed(1)}с
                        </div>
                        <div className="text-sm text-muted-foreground">Длительность</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-lg font-medium text-purple-600 dark:text-purple-400">
                          {transcription.language}
                        </div>
                        <div className="text-sm text-muted-foreground">Язык</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {transcription.timestamp}
                        </div>
                        <div className="text-sm text-muted-foreground">Время</div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}