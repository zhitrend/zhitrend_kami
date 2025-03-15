import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, KeyOutlined, DashboardOutlined, BarChartOutlined, PlusOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 检查用户登录状态
  useEffect(() => {
    // 这里应该从localStorage或者其他存储中获取用户登录状态
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // 这里应该根据用户角色判断是否为管理员
      setIsAdmin(localStorage.getItem('userRole') === 'admin');
    }
  }, []);

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/login');
  };

  // 用户下拉菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">个人资料</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <KeyOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
          <span>卡密系统</span>
        </Link>
      </div>
      <Menu 
        theme="dark" 
        mode="horizontal" 
        selectedKeys={[location.pathname]}
        style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end' }}
      >
        <Menu.Item key="/verify">
          <Link to="/verify">验证卡密</Link>
        </Menu.Item>
        
        {isAdmin && (
          <>
            <Menu.Item key="/admin" icon={<DashboardOutlined />}>
              <Link to="/admin">管理面板</Link>
            </Menu.Item>
            <Menu.Item key="/admin/kami-list" icon={<KeyOutlined />}>
              <Link to="/admin/kami-list">卡密列表</Link>
            </Menu.Item>
            <Menu.Item key="/admin/kami-generate" icon={<PlusOutlined />}>
              <Link to="/admin/kami-generate">生成卡密</Link>
            </Menu.Item>
            <Menu.Item key="/admin/kami-stats" icon={<BarChartOutlined />}>
              <Link to="/admin/kami-stats">统计报表</Link>
            </Menu.Item>
          </>
        )}
        
        {isLoggedIn ? (
          <Menu.Item key="user">
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />} style={{ color: 'white' }}>
                用户中心
              </Button>
            </Dropdown>
          </Menu.Item>
        ) : (
          <>
            <Menu.Item key="/login">
              <Link to="/login">登录</Link>
            </Menu.Item>
            <Menu.Item key="/register">
              <Link to="/register">注册</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Header>
  );
};

export default AppHeader;