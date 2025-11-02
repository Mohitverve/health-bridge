// src/components/Navbar.jsx
import React, { useState } from "react";
import { Menu, Button, Drawer } from "antd";
import { MedicineBoxOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { key: "/", label: "Home" },
    { key: "/About", label: "About Us" },
    { key: "/hospitals", label: "Hospitals" },
    { key: "/Treatments", label: "Treatments" },
    { key: "/contact", label: "Contact Us" },
  ];

  const onClickItem = ({ key }) => {
    navigate(key);
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <MedicineBoxOutlined
            className="navbar-logo"
            onClick={() => navigate("/")}
            style={{ fontSize: "1.8rem", color: "#17b3ad", cursor: "pointer" }}
          />
        </div>

        <div className="navbar-center desktop-menu">
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            onClick={onClickItem}
            items={menuItems}
            className="navbar-menu"
          />
        </div>

        <div className="navbar-right">
          <Button
            type="primary"
            className="get-quote-btn"
            onClick={() => navigate("/quote")}
          >
            Get a Quote
          </Button>

          {/* Mobile hamburger */}
          <Button
            type="text"
            className="menu-toggle"
            icon={open ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>

      {/* Drawer for mobile menu */}
      <Drawer
        title="Menu"
        placement="right"
        closable={false}
        onClose={() => setOpen(false)}
        open={open}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          onClick={onClickItem}
          items={menuItems}
        />
      </Drawer>
    </nav>
  );
}
