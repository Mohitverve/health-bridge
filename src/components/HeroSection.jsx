  // src/components/HeroSection.jsx

  import React, { useEffect, useState } from "react";
  import {
    Form,
    Input,
    Button,
    Checkbox,
    Upload,
    AutoComplete,
    message,
  } from "antd";
  import {
    InboxOutlined,
    SearchOutlined,
  } from "@ant-design/icons";
  import { useNavigate } from "react-router-dom";
  import { getDocs, collection } from "firebase/firestore";
  import { db } from "../firebase";
  import "../styles/HeroSection.css";

  const { Dragger } = Upload;
  const { TextArea } = Input;

  export default function HeroSection() {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // state for all items in Firestore
    const [hospitals, setHospitals]     = useState([]);
    const [doctors, setDoctors]         = useState([]);
    const [treatments, setTreatments]   = useState([]);
    const [options, setOptions]         = useState([]);

    // load all three collections once
    useEffect(() => {
      (async () => {
        const [hSnap, dSnap, tSnap] = await Promise.all([
          getDocs(collection(db, "hospitals")),
          getDocs(collection(db, "doctors")),
          getDocs(collection(db, "treatments")),
        ]);
        setHospitals(hSnap.docs.map(d => d.data().name));
        setDoctors(dSnap.docs.map(d => d.data().name));
        setTreatments(tSnap.docs.map(d => d.data().name));
      })();
    }, []);

    // as user types, build dropdown options
    const onSearch = (val) => {
      const q = val.trim().toLowerCase();
      if (!q) {
        setOptions([]);
        return;
      }
      const make = (arr, type) =>
        arr
          .filter(name => name.toLowerCase().includes(q))
          .map(name => ({
            value: name,
            label: `${type}: ${name}`,
            type,
          }));
      setOptions([
        ...make(hospitals, "Hospital"),
        ...make(doctors,   "Doctor"),
        ...make(treatments,"Treatment"),
      ]);
    };

    // when user selects an option, redirect to the matching page
    const onSelect = (value, option) => {
      const type = option.type;
      const pathMap = {
        Hospital:  "/Hospital",
        Doctor:    "/Doctors",
        Treatment: "/Treatments",
      };
      const route = pathMap[type];
      if (!route) {
        message.error("No route for " + type);
        return;
      }
      navigate(`${route}?search=${encodeURIComponent(value)}`);
    };

    // contact form submission
    const onFinish = (values) => {
      console.log("Contact form submitted:", values);
      // TODO: wire up to Firestore / backend
      message.success("Thank you! We’ll be in touch shortly.");
      form.resetFields();
    };

    return (
      <section className="hero-section" id="hero">
        {/* Left: Hero intro + live search */}
        <div className="hero-intro">
          <h1 className="intro-title">
            Your Gateway to <br />
            World-Class Healthcare
          </h1>
          <p className="intro-subtitle">
            Affordable medical journeys, seamless support, 24/7 care.
          </p>

          <AutoComplete
            options={options}
            style={{ width: '100%' }}
            onSearch={onSearch}
            onSelect={onSelect}
            placeholder="Search hospitals, doctors, treatments..."
          >
            <Input.Search
              size="large"
              enterButton={<SearchOutlined />}
            />
          </AutoComplete>
        </div>

        {/* Right: Contact Us form */}
        <div className="hero-inquiry">
          <h2 className="inquiry-title">Contact Us</h2>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="inquiry-form"
          >
            {/* Full Name */}
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="John Doe" size="large" />
            </Form.Item>

            {/* Email & Phone */}
            <div className="inquiry-row">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
                className="inquiry-col"
              >
                <Input placeholder="you@example.com" size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: "Please enter your phone" }]}
                className="inquiry-col"
              >
                <Input placeholder="+1 234 567 8900" size="large" />
              </Form.Item>
            </div>

            {/* Subject */}
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: "Please enter a subject" }]}
            >
              <Input placeholder="Subject of your message" size="large" />
            </Form.Item>

            {/* Message */}
            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: "Please enter your message" }]}
            >
              <TextArea rows={4} placeholder="Type your message here…" />
            </Form.Item>

            {/* Optional Attachment */}
            <Form.Item
              name="attachment"
              label="Attachment (optional)"
              valuePropName="fileList"
              getValueFromEvent={e => (Array.isArray(e) ? e : e?.fileList)}
            >
              <Dragger beforeUpload={() => false} showUploadList>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Drag or click to upload a file
                </p>
              </Dragger>
            </Form.Item>

            {/* Captcha */}
            <Form.Item
              name="captcha"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject("Please verify you are human"),
                },
              ]}
            >
              <Checkbox>I’m not a robot</Checkbox>
            </Form.Item>

            {/* Submit */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                className="inquiry-submit"
              >
                Send Message
              </Button>
            </Form.Item>
          </Form>
        </div>
      </section>
    );
  }
