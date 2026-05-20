export const questionBank = {
  product: [
    {
      id: 'p1',
      question: '请介绍一下你最满意的产品项目，你在其中扮演了什么角色？',
      keywords: ['用户研究', '需求分析', '产品设计', '项目管理', '数据指标', '团队协作'],
      difficulty: 'easy'
    },
    {
      id: 'p2',
      question: '如果让你重新设计微信的某个功能，你会选择哪个功能？为什么？',
      keywords: ['用户体验', '用户痛点', '竞品分析', '功能优化', '数据驱动', '可行性分析'],
      difficulty: 'medium'
    },
    {
      id: 'p3',
      question: '如何衡量一个产品功能的成功与否？请举例说明。',
      keywords: ['核心指标', 'A/B测试', '用户反馈', '业务目标', '数据埋点', '迭代优化'],
      difficulty: 'medium'
    },
    {
      id: 'p4',
      question: '当产品需求与技术实现发生冲突时，你会如何处理？',
      keywords: ['沟通协调', '优先级评估', '技术可行性', '用户体验', '项目进度', '解决方案'],
      difficulty: 'hard'
    },
    {
      id: 'p5',
      question: '请描述一次产品上线后数据不如预期的经历，你是如何处理的？',
      keywords: ['数据分析', '问题定位', '快速响应', '用户调研', '方案调整', '结果验证'],
      difficulty: 'hard'
    }
  ],
  frontend: [
    {
      id: 'f1',
      question: '请解释一下你对前端工程化的理解，你在项目中是如何实践的？',
      keywords: ['构建工具', '代码规范', '自动化测试', '性能优化', 'CI/CD', '模块化'],
      difficulty: 'easy'
    },
    {
      id: 'f2',
      question: 'React和Vue有什么区别？在什么场景下会选择使用哪个框架？',
      keywords: ['虚拟DOM', '组件化', '状态管理', '生态系统', '学习曲线', '项目需求'],
      difficulty: 'medium'
    },
    {
      id: 'f3',
      question: '如何优化前端应用的性能？请分享一些具体的优化策略。',
      keywords: ['代码分割', '懒加载', '缓存策略', '图片优化', 'CDN', '监控指标'],
      difficulty: 'medium'
    },
    {
      id: 'f4',
      question: '请描述一下你在前端安全方面做过哪些工作？',
      keywords: ['XSS防护', 'CSRF防护', '输入验证', 'HTTPS', '权限控制', '安全审计'],
      difficulty: 'hard'
    },
    {
      id: 'f5',
      question: '如何处理前端项目的跨浏览器兼容性问题？',
      keywords: ['特性检测', 'polyfill', 'CSS前缀', '测试策略', '降级方案', '用户体验'],
      difficulty: 'hard'
    }
  ],
  operation: [
    {
      id: 'o1',
      question: '请分享一次成功的运营活动案例，你是如何策划和执行的？',
      keywords: ['目标设定', '用户画像', '渠道选择', '内容策划', '数据监控', '效果评估'],
      difficulty: 'easy'
    },
    {
      id: 'o2',
      question: '如何制定一个新产品的冷启动运营策略？',
      keywords: ['市场调研', '种子用户', '内容建设', '渠道测试', '数据指标', '快速迭代'],
      difficulty: 'medium'
    },
    {
      id: 'o3',
      question: '当运营活动效果不理想时，你会如何分析和调整？',
      keywords: ['数据分析', '用户反馈', '竞品对比', '渠道优化', '内容调整', '成本控制'],
      difficulty: 'medium'
    },
    {
      id: 'o4',
      question: '如何平衡用户体验和商业目标之间的关系？',
      keywords: ['用户价值', '商业价值', '长期发展', '数据驱动', 'A/B测试', '用户调研'],
      difficulty: 'hard'
    },
    {
      id: 'o5',
      question: '请描述一下你对私域流量运营的理解和实践。',
      keywords: ['用户分层', '内容运营', '社群管理', '转化漏斗', '用户生命周期', 'ROI'],
      difficulty: 'hard'
    }
  ]
};

export const encouragementMessages = [
  '太棒了！继续保持这种状态！',
  '回答得很全面，逻辑清晰！',
  '关键词都覆盖到了，很不错！',
  '这就是我们想要听到的答案！',
  '你的思考很深入，继续加油！',
  '完美的回答，下一个问题！'
];

export const pressureMessages = [
  '时间不多了，快速思考！',
  '加油！你还有时间！',
  '集中注意力，最后一分钟！',
  '快速组织你的答案！'
];
