import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Typography, Spin, Divider } from 'antd';
import { KeyOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';

// 引入图表库
import { Line, Pie, Column } from '@ant-design/plots';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const KamiStats = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState({
    totalKami: 0,
    usedKami: 0,
    unusedKami: 0,
    totalRevenue: 0,
    conversionRate: 0
  });
  const [usageData, setUsageData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // 模拟从API获取数据
  const fetchData = () => {
    setLoading(true);
    
    // 这里应该调用后端API获取统计数据
    // const response = await axios.get('/api/stats', { params: { startDate, endDate } });
    
    // 模拟API响应
    setTimeout(() => {
      // 模拟统计数据
      setStats({
        totalKami: 1000,
        usedKami: 350,
        unusedKami: 650,
        totalRevenue: 15800,
        conversionRate: 35
      });

      // 模拟使用趋势数据（最近30天）
      const mockUsageData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        mockUsageData.push({
          date: dateStr,
          value: Math.floor(Math.random() * 20) + 1,
          type: '已使用'
        });
        mockUsageData.push({
          date: dateStr,
          value: Math.floor(Math.random() * 30) + 5,
          type: '已生成'
        });
      }
      setUsageData(mockUsageData);

      // 模拟卡密类型分布数据
      setTypeData([
        { type: '月卡', value: 250 },
        { type: '季卡', value: 180 },
        { type: '年卡', value: 120 },
        { type: '永久卡', value: 80 },
        { type: '试用卡', value: 370 }
      ]);

      // 模拟收入数据（最近12个月）
      const mockRevenueData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        mockRevenueData.push({
          month: monthStr,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }
      setRevenueData(mockRevenueData);

      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]); // 当日期范围变化时重新获取数据

  // 使用趋势图配置
  const usageConfig = {
    data: usageData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    yAxis: {
      title: {
        text: '数量',
      },
    },
    legend: {
      position: 'top',
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // 卡密类型分布图配置
  const typeConfig = {
    data: typeData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  // 收入趋势图配置
  const revenueConfig = {
    data: revenueData,
    xField: 'month',
    yField: 'revenue',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    meta: {
      month: {
        alias: '月份',
      },
      revenue: {
        alias: '收入(元)',
      },
    },
    color: '#1890ff',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="kami-stats">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>卡密统计报表</Title>
        <div>
          <RangePicker 
            onChange={(dates) => setDateRange(dates)}
            style={{ marginRight: 16 }}
          />
          <Button type="primary" onClick={fetchData}>刷新数据</Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="卡密总数"
              value={stats.totalKami}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已使用卡密"
              value={stats.usedKami}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未使用卡密"
              value={stats.unusedKami}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="转化率"
              value={stats.conversionRate}
              suffix="%"
              prefix={<UserOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 使用趋势图 */}
      <Card title="卡密使用趋势" style={{ marginBottom: 24 }}>
        <Paragraph>最近30天卡密生成和使用情况</Paragraph>
        <Line {...usageConfig} />
      </Card>
      
      {/* 卡密类型分布和收入趋势 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="卡密类型分布">
            <Pie {...typeConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="收入趋势">
            <Paragraph>最近12个月收入情况</Paragraph>
            <Column {...revenueConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KamiStats;