import React, { useState, useEffect } from 'react';
import { FileText, Star, TrendingUp, User, Eye, Smile } from 'lucide-react';
import { getInterviewObservations, endInterviewSession } from '../utils/database';

const InterviewerReport = ({ observations, onClose, detectionHistory, sessionId, userId }) => {
  const [dbObservations, setDbObservations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchObservations = async () => {
      if (userId && sessionId) {
        const data = await getInterviewObservations(userId, sessionId);
        setDbObservations(data);
      }
    };

    fetchObservations();
  }, [userId, sessionId]);

  // 计算体态评分
  const calculatePostureScore = () => {
    const headPoseObservations = [...observations, ...dbObservations].filter(obs => obs.type === 'head_pose' || obs.observation_type === 'head_pose');
    const lowHeadCount = headPoseObservations.filter(obs => 
      obs.message?.includes('低头') || obs.message?.includes('forward')
    ).length;
    const tiltedCount = headPoseObservations.filter(obs => 
      obs.message?.includes('倾斜') || obs.message?.includes('tilted')
    ).length;
    
    let score = 100;
    score -= lowHeadCount * 15; // 每次低头扣15分
    score += tiltedCount * 5; // 思考姿态加5分
    
    return Math.max(0, Math.min(100, score));
  };

  // 计算表达评分
  const calculateExpressionScore = () => {
    const expressionObservations = [...observations, ...dbObservations].filter(obs => obs.type === 'expression' || obs.observation_type === 'expression');
    const smileCount = expressionObservations.filter(obs => 
      obs.message?.includes('微笑') || obs.message?.includes('smile')
    ).length;
    const frownCount = expressionObservations.filter(obs => 
      obs.message?.includes('皱眉') || obs.message?.includes('frown')
    ).length;
    
    let score = 70; // 基础分
    score += smileCount * 10; // 每次微笑加10分
    score -= frownCount * 15; // 每次皱眉扣15分
    
    return Math.max(0, Math.min(100, score));
  };

  // 计算眼神交流评分
  const calculateEyeContactScore = () => {
    const eyeObservations = [...observations, ...dbObservations].filter(obs => obs.type === 'eye_contact' || obs.observation_type === 'eye_contact');
    const poorContactCount = eyeObservations.filter(obs => 
      obs.message?.includes('飘忽') || obs.message?.includes('left') || obs.message?.includes('right')
    ).length;
    
    let score = 100;
    score -= poorContactCount * 20; // 每次眼神飘忽扣20分
    
    return Math.max(0, Math.min(100, score));
  };

  // 计算综合印象
  const calculateOverallImpression = () => {
    const postureScore = calculatePostureScore();
    const expressionScore = calculateExpressionScore();
    const eyeContactScore = calculateEyeContactScore();
    
    const overallScore = (postureScore + expressionScore + eyeContactScore) / 3;
    
    if (overallScore >= 85) {
      return {
        score: overallScore,
        level: '优秀',
        description: '面试官对你的整体印象非常好，表现自然自信',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    } else if (overallScore >= 70) {
      return {
        score: overallScore,
        level: '良好',
        description: '面试官对你的印象不错，整体表现令人满意',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    } else if (overallScore >= 55) {
      return {
        score: overallScore,
        level: '一般',
        description: '面试官认为你有改进空间，需要注意细节表现',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else {
      return {
        score: overallScore,
        level: '需改进',
        description: '面试官对你的印象一般，建议多练习面试技巧',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }
  };

  const postureScore = calculatePostureScore();
  const expressionScore = calculateExpressionScore();
  const eyeContactScore = calculateEyeContactScore();
  const overallImpression = calculateOverallImpression();

  const handleClose = async () => {
    if (userId && sessionId) {
      setIsSaving(true);
      await endInterviewSession(sessionId, {
        postureScore,
        expressionScore,
        eyeContactScore,
        overallImpression: overallImpression.description
      });
      setIsSaving(false);
    }
    onClose();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-800">面试官观察报告</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              disabled={isSaving}
            >
              ×
            </button>
          </div>

          {/* 综合印象 */}
          <div className={`p-4 rounded-lg ${overallImpression.bgColor} mb-6`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">综合印象</h3>
              <div className={`text-2xl font-bold ${overallImpression.color}`}>
                {overallImpression.score.toFixed(0)}分
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${overallImpression.color} ${overallImpression.bgColor}`}>
                {overallImpression.level}
              </span>
            </div>
            <p className="text-gray-700">{overallImpression.description}</p>
          </div>

          {/* 详细评分 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 体态评分 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">体态评分</h4>
                </div>
                <span className={`text-xl font-bold ${getScoreColor(postureScore)}`}>
                  {postureScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(postureScore)}`}
                  style={{ width: `${postureScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {postureScore >= 80 ? '姿态自然得体' :
                 postureScore >= 60 ? '姿态基本合格' :
                 postureScore >= 40 ? '需要注意姿态' : '姿态需要改进'}
              </p>
            </div>

            {/* 表达评分 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Smile className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">表达评分</h4>
                </div>
                <span className={`text-xl font-bold ${getScoreColor(expressionScore)}`}>
                  {expressionScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(expressionScore)}`}
                  style={{ width: `${expressionScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {expressionScore >= 80 ? '表情丰富自然' :
                 expressionScore >= 60 ? '表情基本自然' :
                 expressionScore >= 40 ? '表情略显僵硬' : '表情需要改善'}
              </p>
            </div>

            {/* 眼神交流评分 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">眼神交流</h4>
                </div>
                <span className={`text-xl font-bold ${getScoreColor(eyeContactScore)}`}>
                  {eyeContactScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(eyeContactScore)}`}
                  style={{ width: `${eyeContactScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {eyeContactScore >= 80 ? '眼神交流良好' :
                 eyeContactScore >= 60 ? '眼神交流一般' :
                 eyeContactScore >= 40 ? '眼神交流不足' : '需要加强眼神交流'}
              </p>
            </div>
          </div>

          {/* 改进建议 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              改进建议
            </h4>
            <div className="space-y-2">
              {postureScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 保持头部直立，避免频繁低头，展现自信姿态
                </p>
              )}
              {expressionScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 多微笑，展现亲和力和积极态度
                </p>
              )}
              {eyeContactScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 保持眼神交流，展现专注和诚意
    </p>
              )}
              {overallImpression.score >= 80 && (
                <p className="text-sm text-gray-700">
                  • 继续保持优秀的表现，你做得很好！
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '关闭报告'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerReport;
