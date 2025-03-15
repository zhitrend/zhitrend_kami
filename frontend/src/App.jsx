import React from 'react';
import { Layout, ConfigProvider } from 'antd';
import { Routes, Route } from 'react-router-dom';
import zhCN from 'antd/lib/locale/zh_CN';

// 导入组件
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import Dashboard from './pages/admin/Dashboard';
import KamiList from './pages/admin/KamiList';
import KamiGenerate from './pages/admin/KamiGenerate';
import KamiStats from './pages/admin/KamiStats';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import NotFound from './pages/NotFound';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div className="site-layout-content" style={{ margin: '16px 0' }}>
            <Routes>
              {/* 公共页面 */}
              <Route path="/" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              
              {/* 管理员页面 */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/kami-list" element={<KamiList />} />
              <Route path="/admin/kami-generate" element={<KamiGenerate />} />
              <Route path="/admin/kami-stats" element={<KamiStats />} />
              
              {/* 404页面 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Content>
        <AppFooter />
      </Layout>
    </ConfigProvider>
  );
}

export default App;