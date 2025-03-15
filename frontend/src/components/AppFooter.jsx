import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      卡密系统 ©{new Date().getFullYear()} 版权所有
    </Footer>
  );
};

export default AppFooter;