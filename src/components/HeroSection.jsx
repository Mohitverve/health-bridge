import React, { useEffect, useRef, useState } from "react";
import { AutoComplete, Button, Drawer, Form, Input, Tag, message, Skeleton } from "antd";
import { SearchOutlined, PhoneOutlined, FileSearchOutlined, BankOutlined, DollarCircleOutlined } from "@ant-design/icons";
import { getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import "../styles/HeroSection.css";

export default function HeroSection() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);            // still used for search results if user types a doctor's name
  const [treatments, setTreatments] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);

  // ✅ No doctor quick pick; only treatments/hospitals
  const quickPicks = [
    { label: "Knee Replacement", type: "Treatment" },
    { label: "Hip Replacement", type: "Treatment" },
    { label: "Heart Bypass", type: "Treatment" },
    { label: "Fortis Hospital", type: "Hospital" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [hSnap, dSnap, tSnap] = await Promise.all([
          getDocs(collection(db, "hospitals")),
          getDocs(collection(db, "doctors")),
          getDocs(collection(db, "treatments")),
        ]);
        setHospitals(hSnap.docs.map(d => d.data().name).filter(Boolean));
        setDoctors(dSnap.docs.map(d => d.data().name).filter(Boolean));
        setTreatments(tSnap.docs.map(d => d.data().name).filter(Boolean));
      } catch {
        message.error("Failed to load data.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Debounced search
  const timer = useRef(null);
  const buildOptions = (q) => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const make = (arr, type) =>
      arr
        .filter(n => n?.toLowerCase().includes(query))
        .slice(0, 8)
        .map(name => ({
          value: name,
          label: (
            <div className="opt-row">
              <span className="opt-type">{type}</span>
              <span className="opt-name">{name}</span>
            </div>
          ),
          type,
        }));
    return [
      ...make(hospitals, "Hospital"),
      ...make(doctors, "Doctor"),
      ...make(treatments, "Treatment"),
    ];
  };
  const onSearch = (val) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOptions(buildOptions(val)), 160);
  };
  const onSelect = (value, option) => {
    const route = { Hospital: "/Hospital", Doctor: "/Doctors", Treatment: "/Treatments" }[option?.type];
    if (!route) return message.error("Unknown type");
    navigate(`${route}?search=${encodeURIComponent(value)}`);
  };
  const onQuick = (q) => setOptions(buildOptions(q.label));

  const onSmallFinish = (values) => {
    console.log("Callback request:", values);
    message.success("Thanks! We’ll call you shortly.");
    form.resetFields();
    setOpenDrawer(false);
  };

  return (
    <section className="hero minimal-hero" id="hero">
      <div className="hero-wrap">
        <p className="eyebrow">Healthcare, simplified</p>

        <h1 className="h-title">Find the right care, fast.</h1>
        <p className="h-sub">Search hospitals, doctors, and treatments with transparent information.</p>

        {/* Clean search input */}
        <div className="h-search">
          {loadingData ? (
            <Skeleton.Input active size="large" block />
          ) : (
            <AutoComplete
  dropdownMatchSelectWidth   // ✅ matches the input (true)
  options={options}
  onSearch={onSearch}
  onSelect={onSelect}
  className="autocomplete"
>

              <Input
                size="large"
                className="search-input"
                placeholder="Search hospitals, doctors, treatments…"
                prefix={<SearchOutlined className="search-icon" />}
                allowClear
                aria-label="Search"
              />
            </AutoComplete>
          )}
        </div>

        {/* Quick picks (no doctor names) */}
        <div className="quick">
          {quickPicks.map((q) => (
            <Tag key={q.label} className="quick-chip" onClick={() => onQuick(q)}>
              {q.label}
            </Tag>
          ))}
        </div>

        {/* CTAs */}
        <div className="cta">
          <Button type="primary" size="large" className="btn-primary" onClick={() => navigate("/Treatments")}>
            Explore Treatments
          </Button>
          <Button size="large" className="btn-ghost" icon={<PhoneOutlined />} onClick={() => setOpenDrawer(true)}>
            Request Callback
          </Button>
        </div>

        {/* Light 3-step strip to fill space without clutter */}
        <div className="steps">
          <div className="step">
            <FileSearchOutlined />
            <div>
              <strong>1. Choose treatment</strong>
              <span>Tell us what you need</span>
            </div>
          </div>
          <div className="step">
            <BankOutlined />
            <div>
              <strong>2. Compare hospitals</strong>
              <span>Accredited & verified</span>
            </div>
          </div>
          <div className="step">
            <DollarCircleOutlined />
            <div>
              <strong>3. Get estimates</strong>
              <span>Transparent pricing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiny Drawer form */}
      <Drawer
        title="Request a callback"
        placement="right"
        width={360}
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        <Form form={form} layout="vertical" onFinish={onSmallFinish} requiredMark={false}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input placeholder="John Doe" size="large" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter your phone" },
              { pattern: /^[0-9()+\-\s]{7,20}$/, message: "Enter a valid phone" },
            ]}
          >
            <Input placeholder="+1 234 567 8900" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            Get a Call
          </Button>
        </Form>
      </Drawer>
    </section>
  );
}
