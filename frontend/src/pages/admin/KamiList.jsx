import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Input, Select, DatePicker, Modal, message, Tag, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const KamiList = () => {
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    keyword: '',
    dateRange: null,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentKami, setCurrentKami] = useState(null);

  // 从API获取数据
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/kami/list', {
        params: {
          page: params.current || pagination.current,
          limit: params.pageSize || pagination.pageSize,
          status: filters.status === 'all' ? undefined : filters.status,
          keyword: filters.keyword || undefined,
          dateRange: filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2 ? {
            start: filters.dateRange[0].format('YYYY-MM-DD'),
            end: filters.dateRange[1].format('YYYY-MM-DD')
          } : undefined
        }
      });

      if (response.data.success) {
        setDataSource(response.data.data.items);
        setPagination({
          ...pagination,
          current: params.current || pagination.current,
          pageSize: params.pageSize || pagination.pageSize,
          total: response.data.data.total,
        });
      } else {
        message.error('获取卡密列表失败：' + response.data.message);
      }
    } catch (error) {
      console.error('获取卡密列表失败:', error);
      message.error('获取卡密列表失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, [filters]); // 当过滤条件变化时重新获取数据

  const handleTableChange = (newPagination) => {
    fetchData({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({ current: 1, pageSize: pagination.pageSize });
  };

  const handleReset = () => {
    setFilters({
      status: 'all',
      keyword: '',
      dateRange: null,
    });
    setPagination({ ...pagination, current: 1 });
    fetchData({ current: 1, pageSize: pagination.pageSize });
  };

  const handleViewKami = (record) => {
    setCurrentKami(record);
    setViewModalVisible(true);
  };

  const handleCopyCardNumber = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('卡号已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  const handleDeleteKami = async (id) => {
    try {
      const response = await api.delete(`/kami/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchData({
          current: pagination.current,
          pageSize: pagination.pageSize,
        });
      } else {
        message.error('删除失败：' + response.data.message);
      }
    } catch (error) {
      console.error('删除卡密失败:', error);
      message.error('删除失败：' + (error.response?.data?.message || error.message));
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的卡密');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条卡密记录吗？`,
      onOk: async () => {
        try {
          const response = await api.post('/kami/batch-delete', { ids: selectedRowKeys });
          if (response.data.success) {
            message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
            setSelectedRowKeys([]);
            fetchData({
              current: pagination.current,
              pageSize: pagination.pageSize,
            });
          } else {
            message.error('批量删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('批量删除卡密失败:', error);
          message.error('批量删除失败：' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const columns = [
    {
      title: '卡号',
      dataIndex: 'code',
      key: 'code',
      render: (text) => (
        <Space>
          {text}
          <Tooltip title="复制卡号">
            <CopyOutlined onClick={() => handleCopyCardNumber(text)} style={{ cursor: 'pointer' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '密码',
      dataIndex: 'password',
      key: 'password',
      render: () => '******', // 出于安全考虑，不直接显示密码
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => {
        let color = 'blue';
        if (text === '月卡') color = 'green';
        if (text === '季卡') color = 'cyan';
        if (text === '年卡') color = 'purple';
        if (text === '永久卡') color = 'magenta';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        return <Tag color={text === 'unused' ? 'success' : 'error'}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '过期时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text, record) => {
        // 开始时间createdAt + days 就是结束日期
        const expireTime = new Date(text);
        const days = record.days;
        const expireDate = new Date(expireTime.getTime() + days * 24 * 60 * 60 * 1000);
        return expireDate.toLocaleString();
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewKami(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这条卡密记录吗？"
              onConfirm={() => handleDeleteKami(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div className="kami-list">
      <Card title="卡密列表" extra={<Button type="primary" icon={<PlusOutlined />}>生成卡密</Button>}>
        {/* 搜索和过滤区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索卡号/密码/备注"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="all">全部状态</Option>
              <Option value="未使用">未使用</Option>
              <Option value="已使用">已使用</Option>
            </Select>
            <RangePicker 
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
          </Space>
        </div>

        {/* 批量操作区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              danger 
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
            <Button 
              disabled={selectedRowKeys.length === 0}
            >
              导出选中
            </Button>
            <span style={{ marginLeft: 8 }}>
              {selectedRowKeys.length > 0 ? `已选择 ${selectedRowKeys.length} 项` : ''}
            </span>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* 查看卡密详情的模态框 */}
      <Modal
        title="卡密详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {currentKami && (
          <div>
            <p><strong>卡号：</strong> {currentKami.cardNumber}</p>
            <p><strong>密码：</strong> {currentKami.password}</p>
            <p><strong>类型：</strong> {currentKami.type}</p>
            <p><strong>状态：</strong> {currentKami.status}</p>
            <p><strong>创建时间：</strong> {currentKami.createTime}</p>
            <p><strong>过期时间：</strong> {currentKami.expireTime}</p>
            {currentKami.useTime && <p><strong>使用时间：</strong> {currentKami.useTime}</p>}
            {currentKami.userId && <p><strong>使用用户：</strong> {currentKami.userId}</p>}
            <p><strong>备注：</strong> {currentKami.remark || '无'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KamiList;