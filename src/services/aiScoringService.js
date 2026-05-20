import axios from 'axios';

// AI评分服务配置
const AI_CONFIG = {
  // 这里可以配置多个AI服务商的API
  providers: {
    // 阿里云通义千问
    aliyun: {
      endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      apiKey: import.meta.env.VITE_ALIYUN_API_KEY || 'your-aliyun-api-key'
    },
    // 百度文心一言
    baidu: {
      endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
      apiKey: import.meta.env.VITE_BAIDU_API_KEY || 'your-baidu-api-key'
    },
    // 智谱AI
    zhipu: {
      endpoint: 'https://open.bigmodel.cn/api/private/v1/chat/completions',
      apiKey: import.meta.env.VITE_ZHIPU_API_KEY || 'your-zhipu-api-key'
    }
  },
  // 默认使用的服务商
  defaultProvider: 'aliyun'
};

// 面试评分提示词模板
const SCORING_PROMPT_TEMPLATE = `
你是一个专业的面试官，请根据以下信息对面试者的回答进行评分：

面试岗位：{position}
面试问题：{question}
面试者回答：{answer}
期望关键词：{keywords}

请从以下维度进行评分（每个维度满分25分，总分100分）：
1. 内容完整性（是否覆盖关键词，回答是否完整）
2. 逻辑清晰度（表达是否条理清晰，有逻辑性）
3. 专业深度（回答是否体现专业性，有深度）
4. 表达流畅度（语言表达是否流畅自然）

请按照以下JSON格式返回评分结果：
{
  "score": 85,
  "dimensions": {
    "content": {"score": 22, "feedback": "内容覆盖较全面，但缺少具体案例支撑"},
    "logic": {"score": 20, "feedback": "逻辑清晰，使用了连接词使回答更有条理"},
    "professional": {"score": 21, "feedback": "体现了较好的专业素养，但深度可以加强"},
    "fluency": {"score": 22, "feedback": "表达流畅自然，语速适中"}
  },
  "overallFeedback": "整体表现良好，建议在回答中增加具体案例和数据支撑",
  "suggestions": [
    "增加具体的工作案例来支撑观点",
    "使用更多数据来量化工作成果",
    "可以进一步展示对行业的深入理解"
  ]
}

请确保返回的是有效的JSON格式，不要包含其他说明文字。
`;

export const aiScoringService = {
  /**
   * 调用AI进行面试评分
   * @param {string} answer - 面试者回答内容
   * @param {string} question - 面试问题
   * @param {string} position - 面试岗位
   * @param {Array} keywords - 期望关键词
   * @param {string} provider - 使用的AI服务商
   * @returns {Promise<Object>} 评分结果
   */
  async scoreInterview({ answer, question, position, keywords, provider = AI_CONFIG.defaultProvider }) {
    try {
      const prompt = SCORING_PROMPT_TEMPLATE
        .replace('{position}', position)
        .replace('{question}', question)
        .replace('{answer}', answer)
        .replace('{keywords}', keywords.join('、'));

      const config = AI_CONFIG.providers[provider];
      if (!config) {
        throw new Error(`不支持的AI服务商: ${provider}`);
      }

      const response = await axios.post(
        config.endpoint,
        this.buildRequestPayload(prompt, provider),
        {
          headers: this.buildHeaders(config.apiKey, provider),
          timeout: 30000 // 30秒超时
        }
      );

      const result = this.parseResponse(response.data, provider);
      return result;
    } catch (error) {
      console.error('AI评分失败:', error);
      throw new Error(`AI评分服务调用失败: ${error.message}`);
    }
  },

  /**
   * 构建请求载荷
   */
  buildRequestPayload(prompt, provider) {
    switch (provider) {
      case 'aliyun':
        return {
          model: 'qwen-plus',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的面试官，擅长对面试者的回答进行客观评分。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            result_format: 'json'
          }
        };
      
      case 'baidu':
        return {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的面试官，擅长对面试者的回答进行客观评分。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          response_format: 'json'
        };
      
      case 'zhipu':
        return {
          model: 'glm-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的面试官，擅长对面试者的回答进行客观评分。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        };
      
      default:
        throw new Error(`不支持的AI服务商: ${provider}`);
    }
  },

  /**
   * 构建请求头
   */
  buildHeaders(apiKey, provider) {
    const baseHeaders = {
      'Content-Type': 'application/json'
    };

    switch (provider) {
      case 'aliyun':
        return {
          ...baseHeaders,
          'Authorization': `Bearer ${apiKey}`,
          'X-DashScope-Skip-Security-Check': 'true'
        };
      
      case 'baidu':
        return {
          ...baseHeaders,
          'Authorization': `Bearer ${apiKey}`
        };
      
      case 'zhipu':
        return {
          ...baseHeaders,
          'Authorization': apiKey
        };
      
      default:
        return baseHeaders;
    }
  },

  /**
   * 解析AI响应
   */
  parseResponse(data, provider) {
    try {
      let content;
      
      switch (provider) {
        case 'aliyun':
          content = data.output.text;
          break;
        case 'baidu':
          content = data.result;
          break;
        case 'zhipu':
          content = data.choices[0].message.content;
          break;
        default:
          throw new Error(`不支持的AI服务商: ${provider}`);
      }

      // 尝试解析JSON
      const result = JSON.parse(content);
      
      // 验证结果格式
      if (!result.score || !result.dimensions || !result.overallFeedback) {
        throw new Error('AI返回的评分结果格式不正确');
      }

      return result;
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('AI返回的评分结果解析失败');
    }
  },

  /**
   * 获取支持的AI服务商列表
   */
  getSupportedProviders() {
    return Object.keys(AI_CONFIG.providers);
  },

  /**
   * 测试AI服务连接
   */
  async testConnection(provider = AI_CONFIG.defaultProvider) {
    try {
      await this.scoreInterview({
        answer: '这是一个测试回答',
        question: '请介绍一下你自己',
        position: '前端开发',
        keywords: ['经验', '技能', '项目'],
        provider
      });
      return true;
    } catch (error) {
      console.error('AI服务连接测试失败:', error);
      return false;
    }
  }
};
