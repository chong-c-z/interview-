import React, { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

const FaceDetection = ({ onDetectionUpdate, isActive, onExpressionScore, onEyeContactScore, onPostureScore }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expressionHistory, setExpressionHistory] = useState([]);
  const [eyeContactHistory, setEyeContactHistory] = useState([]);
  const [postureHistory, setPostureHistory] = useState([]);
  const modelRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      initializeCamera();
      loadModel();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive]);

  const loadModel = async () => {
    try {
      setIsModelLoading(true);
      modelRef.current = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      );
      setIsModelLoading(false);
    } catch (err) {
      console.error('模型加载失败:', err);
      setError('面部检测模型加载失败');
      setIsModelLoading(false);
    }
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320, 
          height: 240,
          facingMode: 'user' 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('摄像头访问失败:', err);
      setError('无法访问摄像头');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (!isActive || isModelLoading || !modelRef.current) return;

    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const predictions = await modelRef.current.estimateFaces({
          input: videoRef.current,
          predictIrises: false
        });

        if (predictions.length > 0) {
          const face = predictions[0];
          const detection = analyzeFaceFeatures(face);
          onDetectionUpdate(detection);
          
          // 更新表情历史
          updateExpressionHistory(detection.expression);
          updateEyeContactHistory(detection.eyeDirection);
          updatePostureHistory(detection.headPose);
        }
      } catch (err) {
        console.error('面部检测失败:', err);
      }

      if (isActive) {
        requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  }, [isActive, isModelLoading]);

  const analyzeFaceFeatures = (face) => {
    return {
      expression: detectExpression(face),
      eyeDirection: detectEyeDirection(face),
      headPose: detectHeadPose(face),
      gestures: detectGestures(face),
      confidence: face.faceInViewConfidence || 0,
      timestamp: Date.now()
    };
  };

  const detectExpression = (face) => {
    const landmarks = face.scaledMesh;
    if (!landmarks) return 'neutral';

    // 检测微笑
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const mouthCenter = landmarks[13];

    if (leftMouth && rightMouth && mouthCenter) {
      const mouthWidth = Math.abs(leftMouth[0] - rightMouth[0]);
      const mouthHeight = Math.abs(mouthCenter[1] - (leftMouth[1] + rightMouth[1]) / 2);
      
      if (mouthWidth > 60 && mouthHeight > 15) {
        return 'smile';
      }
    }

    // 检测皱眉
    const leftBrow = landmarks[105];
    const rightBrow = landmarks[334];
    
    if (leftBrow && rightBrow) {
      const browHeight = (leftBrow[1] + rightBrow[1]) / 2;
      if (browHeight < 100) {
        return 'frown';
      }
    }

    // 检测张嘴
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    if (upperLip && lowerLip) {
      const mouthOpenness = Math.abs(upperLip[1] - lowerLip[1]);
      if (mouthOpenness > 20) {
        return 'open';
      }
    }

    return 'neutral';
  };

  const detectEyeDirection = (face) => {
    const landmarks = face.scaledMesh;
    if (!landmarks) return 'center';

    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    if (leftEye && rightEye) {
      const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;
      
      if (eyeCenterX < 140) {
        return 'left';
      } else if (eyeCenterX > 180) {
        return 'right';
      } else {
        return 'center';
      }
    }

    return 'center';
  };

  const detectHeadPose = (face) => {
    const landmarks = face.scaledMesh;
    if (!landmarks) return 'upright';

    const nose = landmarks[1];
    const chin = landmarks[152];
    const leftTemple = landmarks[234];
    const rightTemple = landmarks[454];

    if (nose && chin && leftTemple && rightTemple) {
      const headTilt = Math.abs(leftTemple[0] - rightTemple[0]);
      const headForward = nose[1] - chin[1];

      if (headTilt > 30) {
        return 'tilted';
      } else if (headForward > 50) {
        return 'forward';
      } else if (headForward < 20) {
        return 'backward';
      }
    }

    return 'upright';
  };

  const detectGestures = () => {
    return 'none';
  };

  const updateExpressionHistory = (expression) => {
    setExpressionHistory(prev => {
      const newHistory = [...prev, { expression, timestamp: Date.now() }];
      // 只保留最近100条记录
      return newHistory.slice(-100);
    });
  };

  const updateEyeContactHistory = (eyeDirection) => {
    setEyeContactHistory(prev => {
      const newHistory = [...prev, { eyeDirection, timestamp: Date.now() }];
      // 只保留最近100条记录
      return newHistory.slice(-100);
    });
  };

  const updatePostureHistory = (headPose) => {
    setPostureHistory(prev => {
      const newHistory = [...prev, { headPose, timestamp: Date.now() }];
      // 只保留最近100条记录
      return newHistory.slice(-100);
    });
  };

  // 计算表情评分
  useEffect(() => {
    if (expressionHistory.length > 0 && onExpressionScore) {
      const recentExpressions = expressionHistory.slice(-20); // 最近20次检测
      
      let score = 70; // 基础分
      
      // 微笑加分
      const smileCount = recentExpressions.filter(e => e.expression === 'smile').length;
      score += (smileCount / recentExpressions.length) * 20;
      
      // 皱眉扣分
      const frownCount = recentExpressions.filter(e => e.expression === 'frown').length;
      score -= (frownCount / recentExpressions.length) * 15;
      
      // 张嘴说话加分
      const openCount = recentExpressions.filter(e => e.expression === 'open').length;
      score += (openCount / recentExpressions.length) * 10;
      
      onExpressionScore(Math.max(0, Math.min(100, score)));
    }
  }, [expressionHistory, onExpressionScore]);

  // 计算眼神交流评分
  useEffect(() => {
    if (eyeContactHistory.length > 0 && onEyeContactScore) {
      const recentEyeContacts = eyeContactHistory.slice(-20); // 最近20次检测
      
      let score = 70; // 基础分
      
      // 直视加分
      const centerCount = recentEyeContacts.filter(e => e.eyeDirection === 'center').length;
      score += (centerCount / recentEyeContacts.length) * 20;
      
      // 眼神飘忽扣分
      const sideCount = recentEyeContacts.filter(e => e.eyeDirection === 'left' || e.eyeDirection === 'right').length;
      score -= (sideCount / recentEyeContacts.length) * 15;
      
      onEyeContactScore(Math.max(0, Math.min(100, score)));
    }
  }, [eyeContactHistory, onEyeContactScore]);

  // 计算姿态评分
  useEffect(() => {
    if (postureHistory.length > 0 && onPostureScore) {
      const recentPostures = postureHistory.slice(-20); // 最近20次检测
      
      let score = 70; // 基础分
      
      // 姿态端正加分
      const uprightCount = recentPostures.filter(e => e.headPose === 'upright').length;
      score += (uprightCount / recentPostures.length) * 20;
      
      // 低头扣分
      const forwardCount = recentPostures.filter(e => e.headPose === 'forward').length;
      score -= (forwardCount / recentPostures.length) * 15;
      
      // 思考姿态加分
      const tiltedCount = recentPostures.filter(e => e.headPose === 'tilted').length;
      score += (tiltedCount / recentPostures.length) * 5;
      
      onPostureScore(Math.max(0, Math.min(100, score)));
    }
  }, [postureHistory, onPostureScore]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: 'scaleX(-1)' }}
      />
      {isModelLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">加载面部检测模型...</p>
          </div>
        </div>
      )}
      
      {/* 实时表情显示 */}
      {expressionHistory.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          表情: {expressionHistory[expressionHistory.length - 1].expression}
        </div>
      )}
    </div>
  );
};

export default FaceDetection;
