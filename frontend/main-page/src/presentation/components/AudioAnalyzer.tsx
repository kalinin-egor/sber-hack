import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Upload, Mic, Play, Square, Loader2, Volume2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { AudioAnalysisDto } from '../../application/dto/AudioAnalysisDto';

interface AudioAnalyzerProps {
  onTranscriptionComplete?: (result: AudioAnalysisDto) => void;
}

export function AudioAnalyzer({ onTranscriptionComplete }: AudioAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentAnalysis,
    isLoading: isAnalysisLoading,
    error: analysisError,
    createFromFile,
    createFromRecording,
    processAnalysis,
    clearError: clearAnalysisError
  } = useAudioAnalysis();

  const {
    recordingState,
    isSupported: isRecordingSupported,
    error: recordingError,
    startRecording,
    stopRecording,
    clearError: clearRecordingError
  } = useAudioRecording();

  const error = analysisError || recordingError;
  const clearError = () => {
    clearAnalysisError();
    clearRecordingError();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      await createFromFile(file);
    }
  };

  const handleStartRecording = async () => {
    clearError();
    await startRecording();
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording();
      await createFromRecording(audioBlob);
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!currentAnalysis) return;

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 400);

    try {
      await processAnalysis(currentAnalysis.id);
      setProgress(100);
      
      if (onTranscriptionComplete && currentAnalysis.transcription) {
        onTranscriptionComplete(currentAnalysis);
      }
    } catch (err) {
      console.error('Failed to process analysis:', err);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                scale: recordingState.isRecording ? [1, 1.1, 1] : 1,
                rotate: recordingState.isRecording ? [0, 5, -5, 0] : 0
              }}
              transition={{
                duration: 2,
                repeat: recordingState.isRecording ? Infinity : 0,
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
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className="bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800">
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Visualization */}
          <div className="flex flex-col items-center space-y-6">
            <AnimatePresence>
              {recordingState.isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center justify-center"
                >
                  {/* Pulsing rings */}
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
                  
                  {/* Central microphone button */}
                  <motion.div
                    className="relative z-10 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                    animate={{
                      scale: [1, 1 + recordingState.audioLevel * 0.3, 1],
                    }}
                    transition={{ duration: 0.1 }}
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  {/* Audio level bars */}
                  <div className="absolute -bottom-8 flex space-x-1">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
                        animate={{
                          height: [4, 4 + recordingState.audioLevel * 30 + Math.random() * 10, 4],
                        }}
                        transition={{
                          duration: 0.3,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Timer */}
                  <motion.div
                    className="absolute -bottom-16 bg-black/80 text-white px-3 py-1 rounded-full text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {formatRecordingTime(recordingState.duration)}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Control buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-14 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800"
                  disabled={recordingState.isRecording || isAnalyzing || isAnalysisLoading}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Загрузить аудио
                </Button>
              </motion.div>
              
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={recordingState.isRecording ? handleStopRecording : handleStartRecording}
                  variant={recordingState.isRecording ? "destructive" : "default"}
                  className={`w-full h-14 ${
                    recordingState.isRecording 
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  }`}
                  disabled={!isRecordingSupported || isAnalyzing || isAnalysisLoading}
                >
                  {recordingState.isRecording ? (
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

          {/* Status indicators */}
          <AnimatePresence>
            {currentAnalysis?.audioFileName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    📁 Выбран файл: <strong>{currentAnalysis.audioFileName}</strong> 
                    {currentAnalysis.audioFileSize && ` (${(currentAnalysis.audioFileSize / 1024 / 1024).toFixed(2)} MB)`}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {currentAnalysis?.hasRecordedAudio && !recordingState.isRecording && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800">
                  <Mic className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    🎤 Аудио записано
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-md mx-auto"
          >
            <Button 
              onClick={handleAnalyzeAudio}
              disabled={!currentAnalysis || isAnalyzing || recordingState.isRecording || isAnalysisLoading}
              className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg"
              size="lg"
            >
              {isAnalyzing || isAnalysisLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Анализируется...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-3" />
                  Начать анализ
                </>
              )}
            </Button>
          </motion.div>

          {/* Progress */}
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

          {/* Transcription result */}
          <AnimatePresence>
            {currentAnalysis?.transcription && !isAnalyzing && (
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
                          {currentAnalysis.transcription.text}
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
                          {(currentAnalysis.transcription.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Точность</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currentAnalysis.transcription.duration.toFixed(1)}с
                        </div>
                        <div className="text-sm text-muted-foreground">Длительность</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-lg font-medium text-purple-600 dark:text-purple-400">
                          {currentAnalysis.transcription.language}
                        </div>
                        <div className="text-sm text-muted-foreground">Язык</div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {currentAnalysis.transcription.timestamp}
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
