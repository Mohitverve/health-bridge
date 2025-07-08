import React from 'react';
import { Menu, Button } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import '../styles/Navbar.css';

const menuItems = [
  { key: 'hospitals',   label: 'Hospitals'  },
  { key: 'doctors',     label: 'Doctors'    },
  { key: 'treatments',  label: 'Treatments' },
  { key: 'contact',     label: 'Contact Us' },
  { key: 'about',       label: 'About Us'   },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* icon only; no text */}
        <div className="navbar-logo">
          <MedicineBoxOutlined />
        </div>

        <Menu
          mode="horizontal"
          className="navbar-menu"
          items={menuItems}
        />

        <div className="navbar-divider" />

        <Button className="get-quote-btn" type="primary">
          Get a Quote
        </Button>
      </div>
    </nav>
  );
}
