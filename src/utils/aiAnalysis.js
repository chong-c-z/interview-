import axios from 'axios';

// 配置AI服务
const AI_CONFIG = {
  // 这里可以配置真实的AI服务API
  // 例如: OpenAI, 文心一言, 讯飞星火等
  API_ENDPOINT: 'https://api.example.com/ai/analyze', // 替换为实际的AI服务地址
  API_KEY: 'your-api-key' // 替换为实际的API密钥
};

// 模拟AI分析 - 实际项目中应调用真实AI服务
export const analyzeAnswerWithAI = async (answer, keywords, question, position) => {
  try {
    // 在实际项目中，这里应该调用真实的AI服务
    // const response = await axios.post(AI_CONFIG.API_ENDPOINT, {
    //   answer,
    //   keywords,
    //   question,
    //   position
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // return response.data;
    
    // 模拟AI分析结果
    return simulateAIAnalysis(answer, keywords, question, position);
  } catch (error) {
    console.error('AI分析失败:', error);
    // 如果AI服务不可用，返回模拟分析结果
    return simulateAIAnalysis(answer, keywords, question, position);
  }
};

// 模拟AI分析函数 - 实际项目中应删除
const simulateAIAnalysis = (answer, keywords, question, position) => {
  // 回答长度分析
  const lengthAnalysis = analyzeAnswerLength(answer);
  
  // 语言流畅度分析
  const fluencyAnalysis = analyzeFluency(answer);
  
  // 逻辑结构分析
  const logicAnalysis = analyzeLogic(answer);
  
  // 内容质量分析
  const contentAnalysis = analyzeContentQuality(answer, question, position);
  
  // 综合评分
  const overallScore = calculateOverallScore({
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis
  });
  
  // 生成详细建议
  const suggestions = generateSuggestions({
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis,
    overallScore,
    question,
    position
  });
  
  // 生成详细评价
  const detailedEvaluation = generateDetailedEvaluation(answer, question, position, overallScore);
  
  return {
    score: overallScore,
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis,
    suggestions,
    detailedEvaluation
  };
};

const analyzeAnswerLength = (answer) => {
  const wordCount = answer.trim().split(/\s+/).length;
  const charCount = answer.length;
  
  let quality = 'good';
  let feedback = '回答长度适中';
  
  if (wordCount < 50) {
    quality = 'poor';
    feedback = '回答过于简短，建议展开更多细节';
  } else if (wordCount > 300) {
    quality = 'fair';
    feedback = '回答较长，注意保持重点突出';
  }
  
  return {
    wordCount,
    charCount,
    quality,
    feedback
  };
};

const analyzeFluency = (answer) => {
  // 简单的流畅度分析
  const sentences = answer.split(/[。！？.!?]/).filter(s => s.trim());
  const avgSentenceLength = sentences.length > 0 ? 
    answer.length / sentences.length : 0;
  
  let fluency = 'good';
  let feedback = '语言表达流畅';
  
  if (avgSentenceLength < 10) {
    fluency = 'poor';
    feedback = '句子过短，建议使用更完整的表达';
  } else if (avgSentenceLength > 50) {
    fluency = 'fair';
    feedback = '句子较长，注意适当断句';
  }
  
  return {
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength),
    fluency,
    feedback
  };
};

const analyzeLogic = (answer) => {
  // 逻辑连接词分析
  const logicWords = ['首先', '其次', '然后', '最后', '因此', '所以', '但是', '然而', '同时', '另外'];
  const foundLogicWords = logicWords.filter(word => answer.includes(word));
  
  let logic = 'good';
  let feedback = '逻辑结构清晰';
  
  if (foundLogicWords.length < 2) {
    logic = 'fair';
    feedback = '建议增加逻辑连接词，使回答更有条理';
  }
  
  return {
    logicWords: foundLogicWords,
    logicWordCount: foundLogicWords.length,
    logic,
    feedback
  };
};

const analyzeContentQuality = (answer, question, position) => {
  // 内容质量分析
  const lowerAnswer = answer.toLowerCase();
  
  // 检查是否包含具体例子
  const hasExample = /例如|比如|举例|案例|经历|项目|实践|做过|负责|参与/.test(lowerAnswer);
  
  // 检查是否包含数据支撑
  const hasData = /\d+%|\d+个|\d+年|\d+月|\d+天|提升|增长|减少|优化|改进|效果|结果/.test(lowerAnswer);
  
  // 检查是否包含反思总结
  const hasReflection = /总结|反思|收获|成长|学习|改进|优化|提升|经验|教训/.test(lowerAnswer);
  
  // 检查是否包含行动方案
  const hasAction = /会|将|可以|能够|计划|打算|准备|实施|执行|推进|落实/.test(lowerAnswer);
  
  let quality = 'good';
  let feedback = '内容丰富，有深度';
  
  const scorePoints = [hasExample, hasData, hasReflection, hasAction].filter(Boolean).length;
  
  if (scorePoints < 2) {
    quality = 'poor';
    feedback = '回答较为空泛，建议增加具体例子、数据支撑或反思总结';
  } else if (scorePoints < 3) {
    quality = 'fair';
    feedback = '回答有一定内容，但可以更具体、更有深度';
  }
  
  return {
    hasExample,
    hasData,
    hasReflection,
    hasAction,
    quality,
    feedback
  };
};

const calculateOverallScore = (analysis) => {
  const weights = {
    length: 0.2,
    fluency: 0.2,
    logic: 0.2,
    content: 0.4
  };
  
  const lengthScore = analysis.lengthAnalysis.quality === 'good' ? 100 : 
                     analysis.lengthAnalysis.quality === 'fair' ? 70 : 40;
  const fluencyScore = analysis.fluencyAnalysis.fluency === 'good' ? 100 : 
                      analysis.fluencyAnalysis.fluency === 'fair' ? 70 : 40;
  const logicScore = analysis.logicAnalysis.logic === 'good' ? 100 : 
                    analysis.logicAnalysis.logic === 'fair' ? 70 : 40;
  const contentScore = analysis.contentAnalysis.quality === 'good' ? 100 : 
                      analysis.contentAnalysis.quality === 'fair' ? 70 : 40;
  
  const overallScore = Math.round(
    lengthScore * weights.length +
    fluencyScore * weights.fluency +
    logicScore * weights.logic +
    contentScore * weights.content
  );
  
  return Math.min(100, Math.max(0, overallScore));
};

const generateSuggestions = (analysis) => {
  const suggestions = [];
  
  // 长度建议
  if (analysis.lengthAnalysis.quality !== 'good') {
    suggestions.push({
      type: 'length',
      priority: analysis.lengthAnalysis.quality === 'fair' ? 'medium' : 'high',
      message: analysis.lengthAnalysis.feedback
    });
  }
  
  // 流畅度建议
  if (analysis.fluencyAnalysis.fluency !== 'good') {
    suggestions.push({
      type: 'fluency',
      priority: analysis.fluencyAnalysis.fluency === 'fair' ? 'medium' : 'high',
      message: analysis.fluencyAnalysis.feedback
    });
  }
  
  // 逻辑建议
  if (analysis.logicAnalysis.logic !== 'good') {
    suggestions.push({
      type: 'logic',
      priority: analysis.logicAnalysis.logic === 'fair' ? 'medium' : 'high',
      message: analysis.logicAnalysis.feedback
    });
  }
  
  // 内容质量建议
  if (analysis.contentAnalysis.quality !== 'good') {
    suggestions.push({
      type: 'content',
      priority: analysis.contentAnalysis.quality === 'fair' ? 'medium' : 'high',
      message: analysis.contentAnalysis.feedback
    });
  }
  
  // 具体改进建议
  if (!analysis.contentAnalysis.hasExample) {
    suggestions.push({
      type: 'example',
      priority: 'high',
      message: '建议增加具体的工作案例或项目经历来支撑你的观点'
    });
  }
  
  if (!analysis.contentAnalysis.hasData) {
    suggestions.push({
      type: 'data',
      priority: 'medium',
      message: '建议用具体的数据或成果来量化你的工作效果'
    });
  }
  
  if (!analysis.contentAnalysis.hasReflection) {
    suggestions.push({
      type: 'reflection',
      priority: 'medium',
      message: '建议增加对工作经历的反思和总结，展示你的成长'
    });
  }
  
  if (!analysis.contentAnalysis.hasAction) {
    suggestions.push({
      type: 'action',
      priority: 'medium',
      message: '建议说明你未来会如何应用这些经验或改进工作方法'
    });
  }
  
  return suggestions;
};

const generateDetailedEvaluation = (answer, question, position, score) => {
  // 根据岗位生成不同的评价
  const positionEvaluations = {
    product: {
      high: '嗯，作为产品经理，你的回答展现了出色的产品思维和用户洞察力。能够清晰地表达产品理念，并结合实际案例进行说明，体现了良好的专业素养。',
      medium: '作为产品经理，你的回答基本合格，但还需要更深入地展示产品思维和用户洞察力。建议多结合具体案例，用数据支撑你的观点。',
      low: '作为产品经理，你的回答还需要加强产品思维和用户洞察力的展示。建议多思考如何从用户角度出发，用具体案例和数据来支撑你的观点。'
    },
    frontend: {
      high: '嗯，作为前端工程师，你的回答展现了扎实的技术功底和良好的工程思维。能够清晰地解释技术概念，并结合实际项目进行说明，体现了优秀的编程能力。',
      medium: '作为前端工程师，你的回答基本合格，但还需要更深入地展示技术功底和工程思维。建议多结合具体技术实现，用代码示例来支撑你的观点。',
      low: '作为前端工程师，你的回答还需要加强技术功底和工程思维的展示。建议多思考如何从技术实现角度出发，用具体代码和项目经验来支撑你的观点。'
    },
    operation: {
      high: '嗯，作为运营人员，你的回答展现了出色的运营思维和数据分析能力。能够清晰地表达运营策略，并结合实际案例进行说明，体现了良好的业务理解力。',
      medium: '作为运营人员，你的回答基本合格，但还需要更深入地展示运营思维和数据分析能力。建议多结合具体运营案例，用数据支撑你的观点。',
      low: '作为运营人员，你的回答还需要加强运营思维和数据分析能力的展示。建议多思考如何从业务角度出发，用具体案例和数据来支撑你的观点。'
    }
  };
  
  const evaluation = positionEvaluations[position] || positionEvaluations.product;
  
  if (score >= 80) {
    return evaluation.high;
  } else if (score >= 60) {
    return evaluation.medium;
  } else {
    return evaluation.low;
  }
};
