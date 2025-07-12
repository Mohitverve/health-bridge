// src/components/Navbar.jsx
import React from 'react';
import { Menu, Button } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onClickItem = ({ key }) => {
    navigate(key);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <MedicineBoxOutlined
          className="navbar-logo"
          onClick={() => navigate('/')}
          style={{ fontSize: '1.8rem', color: '#17b3ad', cursor: 'pointer' }}
        />

        <Menu
          mode="horizontal"
          selectedKeys={[pathname]}
          onClick={onClickItem}
          items={[

               { key: '/',     label: 'Home' },
            { key: '/About',     label: 'About Us' },
             
            { key: '/hospitals', label: 'Hospitals' },
            { key: '/doc',   label: 'Doctors' },
            { key: '/Treatments',label: 'Treatments' },
         
            { key: '/contact',   label: 'Contact Us' },
          ]}
          className="navbar-menu"
        />

        <div className="navbar-divider" />

        <Button
          type="primary"
          className="get-quote-btn"
          onClick={() => navigate('/quote')}
        >
          Get a Quote
        </Button>
      </div>
    </nav>
  );
}
