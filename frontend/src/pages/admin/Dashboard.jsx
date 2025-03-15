import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Typography, Spin } from 'antd';
import { KeyOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKami: 0,
    usedKami: 0,
    unusedKami: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [recentKamis, setRecentKamis] = useState([]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/kami/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchRecentKamis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/kami/recent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRecentKamis(response.data.data.map(kami => ({
        key: kami.code,
        cardNumber: kami.code,
        password: '******',
        status: kami.status === 'used' ? '已使用' : '未使用',
        createTime: new Date(kami.createdAt).toLocaleString(),
        expireTime: kami.expiresAt ? new Date(kami.expiresAt).toLocaleString() : '永不过期'
      })));
    } catch (error) {
      console.error('获取最近卡密失败:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchStats(), fetchRecentKamis()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: '卡号',
      dataIndex: 'cardNumber',
      key: 'cardNumber',
    },
    {
      title: '密码',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <span>
          {text === '未使用' ? 
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            <CloseCircleOutlined style={{ color: '#f5222d' }} />}
          {' '}{text}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Title level={2}>管理员仪表盘</Title>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="卡密总数"
              value={stats.totalKami}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已使用卡密"
              value={stats.usedKami}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="未使用卡密"
              value={stats.unusedKami}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="注册用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="总收入 (元)"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="最近生成的卡密" extra={<Button type="primary">查看更多</Button>}>
        <Table columns={columns} dataSource={recentKamis} pagination={false} />
      </Card>
    </div>
  );
};

export default Dashboard;