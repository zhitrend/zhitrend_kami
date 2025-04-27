import React, { useState } from 'react';
import { Form, Input, Button, Card, Result, Spin, Typography } from 'antd';
import { KeyOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Paragraph } = Typography;

const Verify = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setResult(null);
      
      // 将表单中的cardNumber和password转换为后端API期望的格式
      const requestData = { 
        code: values.cardNumber,
        password: values.password 
      };
      // 修正API路径，使用正确的后端端点
      const response = await api.post('/kami/verify', requestData);
      
      if (response.success) {
        setResult({
          status: 'success',
          title: '卡密验证成功',
          message: '您的卡密有效，可以使用以下信息',
          data: response.data
        });
      } else {
        setResult({
          status: 'error',
          title: '卡密验证失败',
          message: response.message || '验证失败'
        });
      }
    } catch (error) {
      setResult({
        status: 'error',
        title: '验证过程中出错',
        message: error.message || '网络错误，请稍后再试'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setResult(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '50px' }}>
      {!result ? (
        <Card title="卡密验证" bordered={false}>
          <Paragraph>
            请输入您的卡号和密码进行验证。如果您是测试用户，可以使用卡号 DEMO123 和密码 123456 进行测试。
          </Paragraph>
          <Form
            form={form}
            name="verify"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="cardNumber"
              label="卡号"
              rules={[{ required: true, message: '请输入卡号！' }]}
            >
              <Input prefix={<KeyOutlined />} placeholder="请输入卡号" />
            </Form.Item>
            
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码！' }]}
            >
              <Input.Password prefix={<SafetyOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                验证
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '20px' }}>正在验证，请稍候...</p>
            </div>
          ) : (
            <Result
              status={result.status}
              title={result.title}
              subTitle={result.message}
              extra={[
                <Button type="primary" key="back" onClick={resetForm}>
                  返回
                </Button>
              ]}
            >
              {result.status === 'success' && result.data && (
                <div className="result-info">
                  <Title level={4}>卡密信息</Title>
                  <ul>
                    <li><strong>类型：</strong> {result.data.type}</li>
                    <li><strong>有效期：</strong> {result.data.expireAt ? new Date(result.data.expireAt).toLocaleDateString() : '永久'}</li>
                    {result.data.activationTime && (
                      <li><strong>激活时间：</strong> {new Date(result.data.activationTime).toLocaleString()}</li>
                    )}
                  </ul>
                </div>
              )}
            </Result>
          )}
        </Card>
      )}
    </div>
  );
};

export default Verify;