import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Button, Tag, message, Popconfirm } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

const KamiList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const response = await api.get('/kami/list', {
        params: {
          page: params.current || pagination.current,
          limit: params.pageSize || pagination.pageSize,
        },
      });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || '返回数据结构异常');
      }

      setData(response.data.data.items || []);
      setPagination({
        ...pagination,
        ...params,
        total: response.data.data.total || 0,
      });
    } catch (error) {
      console.error('API Error:', error); // 记录完整错误对象
      let errorMsg = '获取卡密列表失败';
      if (error.response) {
        errorMsg += ': ' + (
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`
        );
      } else if (error.request) {
        errorMsg += ': 网络请求未完成';
      } else {
        errorMsg += ': ' + (error.message || '未知错误');
      }
      message.error(errorMsg);
      setData([]);
      setPagination({
        ...pagination,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code) => {
    try {
      await api.delete(`/kami/${code}`);
      message.success('删除成功');
      fetchData(pagination);
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  useEffect(() => {
    fetchData(pagination);
  }, []);

  const handleTableChange = (newPagination) => {
    fetchData(newPagination);
  };

  const columns = [
    {
      title: '卡密码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '面值',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          unused: { text: '未使用', color: 'green' },
          used: { text: '已使用', color: 'red' },
          expired: { text: '已过期', color: 'orange' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'gray' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '有效期(天)',
      dataIndex: 'days',
      key: 'days',
      render: (days) => days ? `${days}天` : '-',
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (usedAt) => usedAt ? new Date(usedAt).toLocaleString() : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date) => date ? new Date(date).toLocaleString() : '永不过期',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除这个卡密吗？"
            onConfirm={() => handleDelete(record.code)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="卡密列表"
      extra={
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => fetchData(pagination)}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="code"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default KamiList;