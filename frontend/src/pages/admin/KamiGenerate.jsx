import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, InputNumber, DatePicker, Radio, Space, message, Typography, Alert, Divider } from 'antd';
import { KeyOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const KamiGenerate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedKamis, setGeneratedKamis] = useState([]);
  const [generating, setGenerating] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setGenerating(true);
      
      // 这里应该调用后端API生成卡密
      // const response = await axios.post('/api/kami/generate', values);
      
      // 模拟生成卡密过程
      setTimeout(() => {
        // 模拟生成的卡密数据
        const mockKamis = [];
        for (let i = 1; i <= values.count; i++) {
          const randomCardNumber = `KM${Date.now().toString().slice(-6)}${String(i).padStart(3, '0')}`;
          const randomPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
          
          mockKamis.push({
            id: i,
            cardNumber: randomCardNumber,
            password: randomPassword,
            type: values.type,
            expireTime: values.expireTime ? values.expireTime.format('YYYY-MM-DD 23:59:59') : '永久有效',
            createTime: new Date().toLocaleString(),
            status: '未使用',
            remark: values.remark || ''
          });
        }
        
        setGeneratedKamis(mockKamis);
        message.success(`成功生成 ${values.count} 个卡密`);
        setLoading(false);
        setGenerating(false);
      }, 1500);
    } catch (error) {
      message.error('生成卡密失败：' + (error.response?.data?.message || error.message));
      setLoading(false);
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  const exportAsCSV = () => {
    if (generatedKamis.length === 0) {
      message.warning('没有可导出的卡密');
      return;
    }
    
    // 构建CSV内容
    const headers = ['卡号', '密码', '类型', '过期时间', '创建时间', '状态', '备注'];
    const csvContent = [
      headers.join(','),
      ...generatedKamis.map(kami => [
        kami.cardNumber,
        kami.password,
        kami.type,
        kami.expireTime,
        kami.createTime,
        kami.status,
        kami.remark
      ].join(','))
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `卡密导出_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('导出成功');
  };

  return (
    <div className="kami-generate">
      <Title level={2}>生成卡密</Title>
      
      <Card title="卡密生成配置" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          name="generate"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            count: 10,
            type: '月卡',
            prefix: 'KM',
            passwordLength: 8,
            expireType: 'never'
          }}
        >
          <Form.Item
            name="count"
            label="生成数量"
            rules={[{ required: true, message: '请输入生成数量' }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="卡密类型"
            rules={[{ required: true, message: '请选择卡密类型' }]}
          >
            <Select>
              <Option value="月卡">月卡</Option>
              <Option value="季卡">季卡</Option>
              <Option value="年卡">年卡</Option>
              <Option value="永久卡">永久卡</Option>
              <Option value="试用卡">试用卡</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="prefix"
            label="卡号前缀"
          >
            <Input placeholder="卡号前缀，例如：KM" />
          </Form.Item>
          
          <Form.Item
            name="passwordLength"
            label="密码长度"
          >
            <InputNumber min={6} max={16} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="expireType"
            label="过期类型"
          >
            <Radio.Group>
              <Radio value="fixed">固定日期</Radio>
              <Radio value="never">永不过期</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.expireType !== currentValues.expireType}
          >
            {({ getFieldValue }) => (
              getFieldValue('expireType') === 'fixed' ? (
                <Form.Item
                  name="expireTime"
                  label="过期日期"
                  rules={[{ required: true, message: '请选择过期日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            )}
          </Form.Item>
          
          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={4} placeholder="可选备注信息" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<KeyOutlined />}>
              生成卡密
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {generating && (
        <Alert
          message="正在生成卡密"
          description="请稍候，卡密生成中..."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {generatedKamis.length > 0 && (
        <Card 
          title="生成结果" 
          extra={
            <Space>
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(generatedKamis.map(k => `${k.cardNumber},${k.password}`).join('\n'))}>
                复制全部
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportAsCSV}>
                导出CSV
              </Button>
            </Space>
          }
        >
          <Paragraph>
            成功生成 {generatedKamis.length} 个卡密，请妥善保存以下信息：
          </Paragraph>
          
          <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>卡号</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>密码</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>过期时间</th>
                </tr>
              </thead>
              <tbody>
                {generatedKamis.map((kami, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{kami.cardNumber}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{kami.password}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{kami.type}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{kami.expireTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Divider />
          
          <Alert
            message="安全提示"
            description="卡密信息敏感，请妥善保存，避免泄露。建议导出后清除此页面显示的卡密信息。"
            type="warning"
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default KamiGenerate;