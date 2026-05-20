import React, { useState, useEffect } from 'react';
import { Eye, Smile, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { saveInterviewObservation } from '../utils/database';

const InterviewerObservation = ({ detection, isActive, onObservation, sessionId, userId }) => {
  const [observations, setObservations] = useState([]);
  const [behaviorCounts, setBehaviorCounts] = useState({
    lowHead: 0,
    noBlink: 0,
    gestures: 0
  });

  useEffect(() => {
    if (!isActive || !detection) return;

    const newObservations = [];
    const timestamp = new Date().toLocaleTimeString();

    // 检测低头行为
    if (detection.headPose === 'forward') {
      const observation = {
        id: Date.now() + Math.random(),
        type: 'head_pose',
        message: '面试官注意到你低头了',
        timestamp,
        severity: 'warning'
      };
      newObservations.push(observation);
      
      // 保存到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'head_pose',
        observationValue: 'forward',
        message: observation.message,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      
      setBehaviorCounts(prev => ({ ...prev, lowHead: prev.lowHead + 1 }));
    }

    // 检测微笑
    if (detection.expression === 'smile') {
      const observation = {
        id: Date.now() + Math.random(),
        type: 'expression',
        message: '你说话时一直在微笑，印象不错',
        timestamp,
        severity: 'positive'
      };
      newObservations.push(observation);
      
      // 保存到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'expression',
        observationValue: 'smile',
        message: observation.message,
        severity: 'positive',
        timestamp: new Date().toISOString()
      });
    }

    // 检测皱眉
    if (detection.expression === 'frown') {
      const observation = {
        id: Date.now() + Math.random(),
        type: 'expression',
        message: '面试官注意到你皱眉了，是不是紧张？',
        timestamp,
        severity: 'warning'
      };
      newObservations.push(observation);
      
      // 保存到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'expression',
        observationValue: 'frown',
        message: observation.message,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
    }

    // 检测眼神方向
    if (detection.eyeDirection === 'left' || detection.eyeDirection === 'right') {
      const observation = {
        id: Date.now() + Math.random(),
        type: 'eye_contact',
        message: '眼神飘忽了，面试官觉得你没准备',
        timestamp,
        severity: 'warning'
      };
      newObservations.push(observation);
      
      // 保存到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'eye_contact',
        observationValue: detection.eyeDirection,
        message: observation.message,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
    }

    // 检测头部姿态
    if (detection.headPose === 'tilted') {
      const observation = {
        id: Date.now() + Math.random(),
        type: 'head_pose',
        message: '头部倾斜，面试官觉得你在思考',
        timestamp,
        severity: 'neutral'
      };
      newObservations.push(observation);
      
      // 保存到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'head_pose',
        observationValue: 'tilted',
        message: observation.message,
        severity: 'neutral',
        timestamp: new Date().toISOString()
      });
    }

    if (newObservations.length > 0) {
      setObservations(prev => [...newObservations, ...prev].slice(0, 20));
    }

  }, [detection, isActive, sessionId, userId]);

  // 检查特定行为触发反馈
  useEffect(() => {
    if (behaviorCounts.lowHead >= 2) {
      const feedback = {
        type: 'feedback',
        message: '你在看什么？',
        timestamp: new Date().toLocaleTimeString()
      };
      onObservation(feedback);
      
      // 保存反馈到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'feedback',
        observationValue: 'low_head_warning',
        message: feedback.message,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      
      setBehaviorCounts(prev => ({ ...prev, lowHead: 0 }));
    }

    if (behaviorCounts.noBlink >= 5) {
      const feedback = {
        type: 'feedback',
        message: '你在背稿？',
        timestamp: new Date().toLocaleTimeString()
      };
      onObservation(feedback);
      
      // 保存反馈到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'feedback',
        observationValue: 'no_blink_warning',
        message: feedback.message,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      
      setBehaviorCounts(prev => ({ ...prev, noBlink: 0 }));
    }

    if (behaviorCounts.gestures >= 3) {
      const feedback = {
        type: 'feedback',
        message: '表达很自然',
        timestamp: new Date().toLocaleTimeString()
      };
      onObservation(feedback);
      
      // 保存反馈到数据库
      saveInterviewObservation({
        userId,
        sessionId,
        observationType: 'feedback',
        observationValue: 'gestures_positive',
        message: feedback.message,
        severity: 'positive',
        timestamp: new Date().toISOString()
      });
      
      setBehaviorCounts(prev => ({ ...prev, gestures: 0 }));
    }
  }, [behaviorCounts, onObservation, sessionId, userId]);

  const getObservationIcon = (type) => {
    switch (type) {
      case 'expression':
        return <Smile className="w-4 h-4" />;
      case 'eye_contact':
        return <Eye className="w-4 h-4" />;
      case 'head_pose':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">面试官观察记录</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          实时监控中
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {observations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>等待面试开始...</p>
            <p className="text-sm mt-1">面试官正在观察你的表现</p>
          </div>
        ) : (
          observations.map((observation) => (
            <div
              key={observation.id}
              className={`p-3 rounded-lg border ${getSeverityColor(observation.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getObservationIcon(observation.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{observation.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{observation.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 行为统计 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">行为统计</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-800">{behaviorCounts.lowHead}</div>
            <div className="text-gray-600">低头次数</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-800">{behaviorCounts.noBlink}</div>
            <div className="text-gray-600">专注时长</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold text-gray-800">{behaviorCounts.gestures}</div>
            <div className="text-gray-600">手势次数</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerObservation;
