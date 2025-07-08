import React from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Checkbox,
} from "antd";
import { InboxOutlined, SearchOutlined } from "@ant-design/icons";
import "../styles/HeroSection.css";

const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

export default function HeroSection() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log("Inquiry submitted:", values);
    // TODO: wire up to Firestore / backend
  };

  return (
    <section className="hero-section" id="hero">
      {/* Left: Hero text + search */}
      <div className="hero-intro">
        <h1 className="intro-title">
          Your Gateway to <br />
          World-Class Healthcare
        </h1>
        <p className="intro-subtitle">
          Affordable medical journeys, seamless support, 24/7 care.
        </p>
        <Input
          className="intro-search"
          size="large"
          placeholder="Search hospitals, doctors, treatments..."
          prefix={<SearchOutlined />}
        />
      </div>

      {/* Right: Inquiry form */}
      <div className="hero-inquiry">
        <h2 className="inquiry-title">Get In Touch</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="inquiry-form"
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="John Doe" size="large" />
          </Form.Item>

          <div className="inquiry-row">
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true }]}
              className="inquiry-col"
            >
              <Select placeholder="Select country" size="large">
                <Option value="india">India</Option>
                <Option value="usa">United States</Option>
                <Option value="uk">United Kingdom</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true }]}
              className="inquiry-col"
            >
              <Select placeholder="Select city" size="large">
                <Option value="delhi">New Delhi</Option>
                <Option value="mumbai">Mumbai</Option>
                <Option value="bangalore">Bangalore</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="inquiry-row">
            <Form.Item
              name="mobile"
              label="Mobile"
              rules={[{ required: true }]}
              className="inquiry-col"
            >
              <Input
                size="large"
                placeholder="12345 67890"
                addonBefore="+91"
              />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true },
                { type: "email", message: "Enter a valid email" },
              ]}
              className="inquiry-col"
            >
              <Input size="large" placeholder="you@example.com" />
            </Form.Item>
          </div>

          <Form.Item
            name="condition"
            label="Medical Condition"
            rules={[{ required: true }]}
          >
            <TextArea rows={3} placeholder="Briefly describe…" />
          </Form.Item>

          <div className="inquiry-row">
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[{ required: true }]}
              className="inquiry-col"
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                format="DD-MM-YYYY"
              />
            </Form.Item>
            <Form.Item
              name="documents"
              label="Upload Docs"
              valuePropName="fileList"
              getValueFromEvent={(e) =>
                Array.isArray(e) ? e : e && e.fileList
              }
              className="inquiry-col"
            >
              <Dragger
                beforeUpload={() => false}
                showUploadList={{ showRemoveIcon: true }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Drag or click to upload</p>
              </Dragger>
            </Form.Item>
          </div>

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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              className="inquiry-submit"
            >
              Submit Inquiry
            </Button>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
}
