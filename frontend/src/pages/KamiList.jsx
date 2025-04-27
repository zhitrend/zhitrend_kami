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
          page: params.current || 1,
          limit: params.pageSize || 10,
        },
      });

      setData(response.data.items);
      setPagination({
        ...params,
        total: response.data.total,
      });
    } catch (error) {
      message.error('获取卡密列表失败：' + (error.message || '未知错误'));
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
      key: 'used',
      render: (_, record) => (
        <Tag color={record.used ? 'red' : 'green'}>
          {record.used ? '已使用' : '未使用'}
        </Tag>
      ),
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