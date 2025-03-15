import React, { useState } from 'react';
import { Form, Input, Button, Card, InputNumber, Select, message, Result } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const KamiGenerate = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/kami/generate', values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResult({
        success: true,
        data: response.data.data,
      });
      message.success('卡密生成成功！');
    } catch (error) {
      message.error('生成失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setResult(null);
  };

  if (result) {
    return (
      <Card>
        <Result
          status="success"
          title="卡密生成成功"
          subTitle={`成功生成 ${result.data.length} 个卡密`}
          extra={[
            <Button type="primary" key="back" onClick={resetForm}>
              继续生成
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'left', marginTop: 24 }}>
            <h4>生成的卡密列表：</h4>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              {result.data.map(kami => `${kami.code}\n`).join('')}
            </pre>
          </div>
        </Result>
      </Card>
    );
  }

  return (
    <Card title="生成卡密">
      <Form
        form={form}
        name="generate"
        onFinish={onFinish}
        layout="vertical"
        initialValues={{
          count: 1,
          type: 'standard',
          expiresIn: 30,
        }}
      >
        <Form.Item
          name="count"
          label="生成数量"
          rules={[{ required: true, message: '请输入生成数量！' }]}
        >
          <InputNumber min={1} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="卡密类型"
          rules={[{ required: true, message: '请选择卡密类型！' }]}
        >
          <Select>
            <Option value="standard">标准卡密</Option>
            <Option value="premium">高级卡密</Option>
            <Option value="trial">试用卡密</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="value"
          label="面值"
          rules={[{ required: true, message: '请输入面值！' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\¥\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="expiresIn"
          label="有效期（天）"
          rules={[{ required: true, message: '请输入有效期！' }]}
        >
          <InputNumber min={1} max={365} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={loading}
            style={{ width: '100%' }}
          >
            生成卡密
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default KamiGenerate;