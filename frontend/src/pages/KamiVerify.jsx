import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';

const KamiVerify = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleVerify = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/kami/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: values.code.trim()
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        message.error(result.message || '验证失败');
        return;
      }

      message.success('卡密验证成功');
      form.resetFields();
      
      // 这里可以添加验证成功后的逻辑
      // 例如跳转页面或更新用户权限

    } catch (error) {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>卡密验证</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleVerify}
      >
        <Form.Item
          name="code"
          label="卡密"
          rules={[
            { required: true, message: '请输入卡密' },
            { pattern: /^[A-Za-z0-9]+$/, message: '卡密格式不正确' }
          ]}
        >
          <Input placeholder="请输入您的卡密" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
          >
            验证
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default KamiVerify;