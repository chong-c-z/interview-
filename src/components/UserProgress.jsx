import React from 'react';
import { User, Star, Target, TrendingUp, BookOpen } from 'lucide-react';
import { getRankByExp, getExpForNextRank } from '../utils/rankSystem';

const UserProgress = ({ progress, wrongAnswersCount }) => {
  const currentRank = getRankByExp(progress.totalExp);
  const nextRankInfo = getExpForNextRank(progress.totalExp);
  
  const accuracy = progress.questionsAnswered > 0 
    ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${currentRank.bgColor} flex items-center justify-center mr-3`}>
            <User className={`w-6 h-6 ${currentRank.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-white">面试者</h3>
            <p className={`text-sm ${currentRank.color} font-medium`}>
              {currentRank.name}段位
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{progress.totalExp}</div>
          <div className="text-xs text-gray-400">经验值</div>
        </div>
      </div>

      {/* 经验值进度条 */}
      {nextRankInfo && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>升级进度</span>
            <span>{nextRankInfo.remaining}经验值后升级</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((progress.totalExp - (nextRankInfo.nextExp - nextRankInfo.remaining)) / nextRankInfo.remaining) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-900 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-blue-400 mr-1" />
            <span className="text-xs text-gray-400">正确率</span>
          </div>
          <div className="text-lg font-bold text-blue-400">{accuracy}%</div>
        </div>
        
        <div className="text-center p-3 bg-green-900 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-xs text-gray-400">连胜</span>
          </div>
          <div className="text-lg font-bold text-green-400">{progress.streak}</div>
        </div>
        
        <div className="text-center p-3 bg-purple-900 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Star className="w-4 h-4 text-purple-400 mr-1" />
            <span className="text-xs text-gray-400">已练习</span>
          </div>
          <div className="text-lg font-bold text-purple-400">{progress.questionsAnswered}</div>
        </div>
        
        <div className="text-center p-3 bg-red-900 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <BookOpen className="w-4 h-4 text-red-400 mr-1" />
            <span className="text-xs text-gray-400">错题</span>
          </div>
          <div className="text-lg font-bold text-red-400">{wrongAnswersCount}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProgress;
