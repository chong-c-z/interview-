const STORAGE_KEYS = {
  USER_PROGRESS: 'mianba_user_progress',
  WRONG_ANSWERS: 'mianba_wrong_answers',
  PRACTICE_HISTORY: 'mianba_practice_history'
};

export const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('获取本地存储数据失败:', error);
    return null;
  }
};

export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('保存本地存储数据失败:', error);
    return false;
  }
};

export const getUserProgress = () => {
  const defaultProgress = {
    totalExp: 0,
    currentRank: 'bronze',
    questionsAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    practicedQuestions: []
  };
  
  return getStorageData(STORAGE_KEYS.USER_PROGRESS) || defaultProgress;
};

export const updateUserProgress = (progress) => {
  return setStorageData(STORAGE_KEYS.USER_PROGRESS, progress);
};

export const getWrongAnswers = () => {
  return getStorageData(STORAGE_KEYS.WRONG_ANSWERS) || [];
};

export const addWrongAnswer = (wrongAnswer) => {
  const wrongAnswers = getWrongAnswers();
  wrongAnswer.id = Date.now().toString();
  wrongAnswer.timestamp = new Date().toISOString();
  wrongAnswers.unshift(wrongAnswer);
  
  // 只保留最近50条错题
  if (wrongAnswers.length > 50) {
    wrongAnswers.splice(50);
  }
  
  return setStorageData(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers);
};

export const removeWrongAnswer = (id) => {
  const wrongAnswers = getWrongAnswers();
  const filtered = wrongAnswers.filter(item => item.id !== id);
  return setStorageData(STORAGE_KEYS.WRONG_ANSWERS, filtered);
};

export const getPracticeHistory = () => {
  return getStorageData(STORAGE_KEYS.PRACTICE_HISTORY) || [];
};

export const addPracticeRecord = (record) => {
  const history = getPracticeHistory();
  record.id = Date.now().toString();
  record.timestamp = new Date().toISOString();
  history.unshift(record);
  
  // 只保留最近100条记录
  if (history.length > 100) {
    history.splice(100);
  }
  
  return setStorageData(STORAGE_KEYS.PRACTICE_HISTORY, history);
};
