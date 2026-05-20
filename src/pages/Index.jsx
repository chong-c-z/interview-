import WrongAnswerBook from '../components/WrongAnswerBook';
import { analyzeAnswerWithAI } from '../utils/aiAnalysis';
import { questionBank, pressureMessages, encouragementMessages } from '../data/questions';
import { updateUserProgress, addPracticeRecord, getUserProgress } from '../utils/storage';
import { createInterviewSession, saveInterviewObservation, endInterviewSession } from '../utils/database';
import { getRankByExp, calculateExpGain } from '../utils/rankSystem';
import React, { useEffect, useRef, useState } from 'react';
import InterviewerReport from '../components/InterviewerReport';
import FaceDetection from '../components/FaceDetection';
import InterviewerFeedback from '../components/InterviewerFeedback';
import UserProgress from '../components/UserProgress';
import { Pause, RotateCcw, CameraOff, Moon, Mic, BookOpen, Zap, FileText, Clock, Sun, Play, MicOff, Camera, Settings } from 'lucide-react';
import CelebrationAnimation from '../components/CelebrationAnimation';
import InterviewerObservation from '../components/InterviewerObservation';
const Index = () => {
  const [currentPosition, setCurrentPosition] = useState('product');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userProgress, setUserProgress] = useState(getUserProgress());
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [showWrongAnswerBook, setShowWrongAnswerBook] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPressureMode, setIsPressureMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreparationTimer, setShowPreparationTimer] = useState(false);
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(30);
  const [interviewerThinking, setInterviewerThinking] = useState(false);
  const [randomReaction, setRandomReaction] = useState('');
  
  // 面试模拟器相关状态
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectionData, setDetectionData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [interviewerFeedback, setInterviewerFeedback] = useState('');
  
  // 数据库相关状态
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState('user_123'); // 在实际应用中，这应该从认证系统获取

  // 主题状态
  const [isDarkMode, setIsDarkMode] = useState(false); // 默认改为白天模式

  // 语音识别状态
  const [isListening, setIsListening] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(true);

  // 评分相关状态
  const [expressionScore, setExpressionScore] = useState(70);
  const [eyeContactScore, setEyeContactScore] = useState(70);
  const [postureScore, setPostureScore] = useState(70);
  const [comprehensiveScore, setComprehensiveScore] = useState(null);
  const [showComprehensiveScore, setShowComprehensiveScore] = useState(false);

  const timerRef = useRef(null);
  const preparationTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // 面试官反应词
  const interviewerReactions = [
    '确定吗？',
    '举个例子？',
    '还有呢？',
    '具体说说？',
    '然后呢？',
    '为什么这么想？',
    '能详细解释一下吗？',
    '这个过程中遇到了什么困难？',
    '你是怎么解决的？',
    '结果如何？'
  ];

  useEffect(() => {
    loadWrongAnswers();
    loadNewQuestion();
    
    // 检查浏览器是否支持语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setUserAnswer(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsMicSupported(false);
    }
  }, [currentPosition]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  useEffect(() => {
    if (showPreparationTimer && preparationTimeLeft > 0) {
      preparationTimerRef.current = setTimeout(() => {
        setPreparationTimeLeft(preparationTimeLeft - 1);
      }, 1000);
    } else if (preparationTimeLeft === 0 && showPreparationTimer) {
      setShowPreparationTimer(false);
    }

    return () => {
      if (preparationTimerRef.current) {
        clearTimeout(preparationTimerRef.current);
      }
    };
  }, [showPreparationTimer, preparationTimeLeft]);

  const loadWrongAnswers = () => {
    const stored = JSON.parse(localStorage.getItem('mianba_wrong_answers') || '[]');
    setWrongAnswers(stored);
  };

  const getAvailableQuestions = () => {
    const questions = questionBank[currentPosition];
    const practicedIds = userProgress.practicedQuestions || [];
    return questions.filter(q => !practicedIds.includes(q.id));
  };

  const loadNewQuestion = () => {
    const availableQuestions = getAvailableQuestions();
    
    if (availableQuestions.length === 0) {
      // 如果该岗位所有题目都练过了,随机选择一个
      const allQuestions = questionBank[currentPosition];
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      setCurrentQuestion(allQuestions[randomIndex]);
    } else {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      setCurrentQuestion(availableQuestions[randomIndex]);
    }
    
    resetTimer();
    setUserAnswer('');
    setShowFeedback(false);
    setShowPreparationTimer(true);
    setPreparationTimeLeft(30);
    setRandomReaction('');
    setInterviewerFeedback('');
  };

  const resetTimer = () => {
    setTimeLeft(isPressureMode ? 60 : 0);
    setIsTimerActive(false);
    setStartTime(null);
  };

  const startTimer = () => {
    if (isPressureMode) {
      setTimeLeft(60);
      setIsTimerActive(true);
      setStartTime(Date.now());
    }
  };

  const handleTimeUp = () => {
    setIsTimerActive(false);
    if (userAnswer.trim()) {
      handleSubmitAnswer();
    } else {
      // 时间到了但没有回答,自动提交
      handleSubmitAnswer();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    // 随机选择一个面试官反应词
    const randomIndex = Math.floor(Math.random() * interviewerReactions.length);
    setRandomReaction(interviewerReactions[randomIndex]);

    setIsAnalyzing(true);

    try {
      const timeUsed = isPressureMode ? Math.round((Date.now() - startTime) / 1000) : 0;
      
      // 显示"面试官思考中..."
      setInterviewerThinking(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInterviewerThinking(false);
      
      // 异步获取AI分析结果
      const aiAnalysis = await analyzeAnswerWithAI(
        userAnswer, 
        currentQuestion.keywords, 
        currentQuestion.question, 
        currentPosition
      );

      const expGain = calculateExpGain(currentQuestion.difficulty, 1, 1);
      
      // 更新用户进度
      const newProgress = {
        ...userProgress,
        totalExp: userProgress.totalExp + expGain,
        questionsAnswered: userProgress.questionsAnswered + 1,
        correctAnswers: userProgress.correctAnswers + 1,
        streak: userProgress.streak + 1,
        practicedQuestions: [...(userProgress.practicedQuestions || []), currentQuestion.id]
      };

      setUserProgress(newProgress);
      updateUserProgress(newProgress);

      // 检查是否连续答对3题
      if (newProgress.streak === 3) {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      }

      // 记录练习历史
      const practiceRecord = {
        question: currentQuestion.question,
        position: currentPosition,
        difficulty: currentQuestion.difficulty,
        timeUsed,
        expGain,
        isCorrect: true
      };
      addPracticeRecord(practiceRecord);

      // 显示反馈
      setFeedbackData({
        timeUsed,
        isUnderPressure: isPressureMode,
        userAnswer,
        keywords: currentQuestion.keywords,
        question: currentQuestion.question,
        position: currentPosition,
        aiAnalysis // 将AI分析结果传递给反馈组件
      });
      setShowFeedback(true);
    } catch (error) {
      console.error('提交答案时出错:', error);
      // 即使AI分析失败,也显示基本反馈
      const timeUsed = isPressureMode ? Math.round((Date.now() - startTime) / 1000) : 0;
      setFeedbackData({
        timeUsed,
        isUnderPressure: isPressureMode,
        userAnswer,
        keywords: currentQuestion.keywords,
        question: currentQuestion.question,
        position: currentPosition,
        aiAnalysis: null // AI分析失败时传递null
      });
      setShowFeedback(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setShowComprehensiveScore(false);
    setComprehensiveScore(null);
    loadNewQuestion();
  };

  const togglePressureMode = () => {
    setIsPressureMode(!isPressureMode);
    resetTimer();
  };

  const toggleInterviewMode = () => {
    setIsInterviewMode(!isInterviewMode);
    if (!isInterviewMode) {
      setIsCameraActive(true);
      setObservations([]);
      // 重置评分
      setExpressionScore(70);
      setEyeContactScore(70);
      setPostureScore(70);
      // 创建新的面试会话
      createInterviewSession(userId).then(session => {
        if (session) {
          setSessionId(session.id);
        }
      });
    } else {
      setIsCameraActive(false);
      setDetectionData(null);
      // 结束面试会话
      if (sessionId) {
        endInterviewSession(sessionId, {
          postureScore,
          expressionScore,
          eyeContactScore,
          overallImpression: comprehensiveScore ? 
            `综合评分: ${comprehensiveScore.overallScore}分` : '面试已完成'
        });
      }
    }
  };

  const handleDetectionUpdate = (detection) => {
    setDetectionData(detection);
  };

  const getTimerColor = () => {
    if (timeLeft > 30) return 'text-green-600';
    if (timeLeft > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPositionName = (position) => {
    const names = { product: '产品', frontend: '前端', operation: '运营' };
    return names[position];
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 语音识别控制
  const toggleListening = () => {
    if (!isMicSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      startTimer();
    }
  };

  // 处理综合评分完成
  const handleScoreComplete = (scoreData) => {
    setComprehensiveScore(scoreData);
    setShowComprehensiveScore(true);
    
    // 更新反馈数据
    setFeedbackData(prev => ({
      ...prev,
      comprehensiveScore: scoreData
    }));
  };

  // 根据主题设置背景色 - 统一白天模式配色
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const cardBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = isDarkMode ? 'bg-gray-700' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">
              {isInterviewMode ? 'AI面试模拟器' : '面试练习工具'}
            </h1>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isInterviewMode ? 'AI面试官实时分析你的语言表达和面部表情' : '我们来聊聊你的工作经历'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧:用户进度 */}
          <div className="lg:col-span-3">
            <div className={`${cardBgClass} rounded-xl shadow-lg p-4 ${borderClass} border`}>
              <UserProgress 
                progress={userProgress} 
                wrongAnswersCount={wrongAnswers.length}
              />
            </div>
            
            {/* 控制按钮 */}
            <div className="mt-4 space-y-3">
              <button
                onClick={() => setShowWrongAnswerBook(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-md"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                错题本 ({wrongAnswers.length})
              </button>
              
              <button
                onClick={togglePressureMode}
                className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md ${
                  isPressureMode 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isPressureMode ? '关闭压力模式' : '开启压力模式'}
              </button>

              <button
                onClick={toggleInterviewMode}
                className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md ${
                  isInterviewMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isInterviewMode ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                {isInterviewMode ? '退出面试模式' : '进入面试模式'}
              </button>

              {isInterviewMode && observations.length > 0 && (
                <button
                  onClick={() => setShowReport(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center shadow-md"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  查看观察报告
                </button>
              )}
            </div>
          </div>

          {/* 中间:练习区域 */}
          <div className="lg:col-span-6">
            <div className={`${cardBgClass} rounded-xl shadow-lg p-6 ${borderClass} border`}>
              {/* 岗位选择 */}
              <div className="flex space-x-2 mb-6">
                {Object.keys(questionBank).map((position) => (
                  <button
                    key={position}
                    onClick={() => setCurrentPosition(position)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPosition === position
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPositionName(position)}
                  </button>
                ))}
              </div>

              {/* 题目显示 */}
              {currentQuestion && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} text-sm rounded-full mr-3 font-medium`}>
                        {getPositionName(currentPosition)}面试题
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        currentQuestion.difficulty === 'easy' ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') :
                        currentQuestion.difficulty === 'medium' ? (isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800') :
                        (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')
                      }`}>
                        {currentQuestion.difficulty === 'easy' ? '简单' :
                         currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                    </div>
                    
                    {isPressureMode && (
                      <div className={`flex items-center ${getTimerColor()}`}>
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-bold">{timeLeft}s</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-lg font-medium mb-4 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>
              )}

              {/* 准备倒计时 */}
              {showPreparationTimer && (
                <div className={`mb-6 p-4 ${isDarkMode ? 'bg-blue-900 bg-opacity-30 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg border`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>面试官：请准备一下，说说看</span>
                    <span className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>{preparationTimeLeft}秒</span>
                  </div>
                  <div className={`w-full ${isDarkMode ? 'bg-blue-800' : 'bg-blue-200'} rounded-full h-2 mt-2`}>
                    <div
                      className={`${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${(preparationTimeLeft / 30) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 答题区域 */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    面试官：请回答这个问题
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onFocus={startTimer}
                    placeholder="面试官：说说你的想法..."
                    className={`w-full h-32 p-3 border ${inputBgClass} ${isDarkMode ? 'border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm`}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || isAnalyzing}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {isAnalyzing ? '面试官思考中...' : '确定提交'}
                  </button>
                  
                  <button
                    onClick={loadNewQuestion}
                    disabled={isAnalyzing}
                    className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧:面试模拟器 */}
          {isInterviewMode && (
            <div className="lg:col-span-3 space-y-4">
              {/* 摄像头预览 */}
              <div className={`${cardBgClass} rounded-xl shadow-lg p-4 ${borderClass} border`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">面试者视角</h3>
                  {isMicSupported && (
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-full ${isListening ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      title={isListening ? '停止录音' : '开始录音'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <FaceDetection 
                  onDetectionUpdate={handleDetectionUpdate}
                  isActive={isCameraActive}
                  onExpressionScore={setExpressionScore}
                  onEyeContactScore={setEyeContactScore}
                  onPostureScore={setPostureScore}
                />
              </div>

              {/* 实时评分显示 */}
              {isInterviewMode && (
                <div className={`${cardBgClass} rounded-xl shadow-lg p-4 ${borderClass} border`}>
                  <h3 className="text-lg font-semibold mb-3">实时评分</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">表情</span>
                      <span className={`text-sm font-bold ${expressionScore >= 80 ? 'text-green-600' : expressionScore >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
                        {expressionScore}分
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">眼神</span>
                      <span className={`text-sm font-bold ${eyeContactScore >= 80 ? 'text-green-600' : eyeContactScore >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
                        {eyeContactScore}分
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">姿态</span>
                      <span className={`text-sm font-bold ${postureScore >= 80 ? 'text-green-600' : postureScore >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
                        {postureScore}分
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 面试官观察记录 */}
              <div className={`${cardBgClass} rounded-xl shadow-lg p-4 ${borderClass} border`}>
                <InterviewerObservation 
                  detection={detectionData}
                  isActive={isInterviewMode}
                  onObservation={handleObservation}
                  sessionId={sessionId}
                  userId={userId}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 综合评分弹窗 */}
      {showComprehensiveScore && comprehensiveScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ComprehensiveScoring
              userAnswer={userAnswer}
              question={currentQuestion?.question}
              position={currentPosition}
              keywords={currentQuestion?.keywords}
              expressionScore={expressionScore}
              eyeContactScore={eyeContactScore}
              postureScore={postureScore}
              onScoreComplete={handleScoreComplete}
            />
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleContinue}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                继续面试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗组件 */}
      {showWrongAnswerBook && (
        <WrongAnswerBook
          wrongAnswers={wrongAnswers}
          onClose={() => setShowWrongAnswerBook(false)}
          onRemove={(id) => {
            setWrongAnswers(prev => prev.filter(item => item.id !== id));
          }}
        />
      )}

      {showFeedback && feedbackData && (
        <InterviewerFeedback
          {...feedbackData}
          onContinue={handleContinue}
        />
      )}

      {showCelebration && (
        <CelebrationAnimation
          show={showCelebration}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* 面试官思考中... */}
      {interviewerThinking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBgClass} rounded-xl p-6 max-w-md w-full text-center shadow-2xl`}>
            <div className="animate-pulse mb-4">
              <div className="text-xl font-medium">面试官思考中...</div>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 随机反应词 */}
      {randomReaction && !showFeedback && !interviewerThinking && (
        <div className={`fixed bottom-4 right-4 ${cardBgClass} ${borderClass} border rounded-xl p-3 shadow-lg z-40`}>
          <div className="text-sm">
            <span className="text-blue-600 font-medium">面试官：</span>
            {randomReaction}
          </div>
        </div>
      )}

      {/* 面试官反馈 */}
      {interviewerFeedback && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="text-center">
            <div className="font-semibold">面试官：{interviewerFeedback}</div>
          </div>
        </div>
      )}

      {/* 面试官观察报告 */}
      {showReport && (
        <InterviewerReport
          observations={observations}
          onClose={() => setShowReport(false)}
          detectionHistory={detectionData}
          sessionId={sessionId}
          userId={userId}
        />
      )}
    </div>
  );
};

export default Index;
