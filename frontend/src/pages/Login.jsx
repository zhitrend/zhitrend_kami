import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', values);
      
      if (response.data.success) {
        // 存储token和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('username', response.data.user.username);
        
        message.success('登录成功！');
        setLoading(false);
        navigate(response.data.user.role === 'admin' ? '/admin' : '/');
      } else {
        message.error(response.data.message || '登录失败');
        setLoading(false);
      }
    } catch (error) {
      message.error('登录失败：' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', marginTop: '50px' }}>
      <Card title="用户登录" bordered={false}>
        <Form
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" style={{ float: 'right' }}>
              忘记密码
            </Link>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
              登录
            </Button>
            或 <Link to="/register">立即注册</Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;