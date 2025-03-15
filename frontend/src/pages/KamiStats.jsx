import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Space, message } from 'antd';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import api from '../utils/api';

const KamiStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    expired: 0,
    usageRate: '0%',
    expirationRate: '0%',
    typeStats: {},
    dailyUsage: [],
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kami/stats');
      setStats(response.data.data);
    } catch (error) {
      message.error('获取统计数据失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 转换类型统计数据为饼图数据格式
  const typeChartData = Object.entries(stats.typeStats).map(([name, value]) => ({
    name,
    value,
  }));

  // 导出数据为Excel
  const exportToExcel = () => {
    const data = [
      ['类型', '数量'],
      ['总卡密数', stats.total],
      ['已使用', stats.used],
      ['未使用', stats.unused],
      ['已过期', stats.expired],
      ['使用率', stats.usageRate],
      ['过期率', stats.expirationRate],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '卡密统计');
    XLSX.writeFile(wb, '卡密统计数据.xlsx');
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => fetchStats()}
          loading={loading}
        >
          刷新数据
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
          disabled={loading}
        >
          导出数据
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="总卡密数" value={stats.total} loading={loading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已使用" value={stats.used} suffix={`/ ${stats.usageRate}`} loading={loading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未使用" value={stats.unused} loading={loading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已过期" value={stats.expired} suffix={`/ ${stats.expirationRate}`} loading={loading} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="卡密类型分布" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="每日使用趋势" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="使用次数" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KamiStats;