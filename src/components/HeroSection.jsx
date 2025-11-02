import React, { useMemo, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Steps,
  Upload,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  PhoneOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import ReCAPTCHA from "react-google-recaptcha";
import "../styles/HeroSection.css";

const { TextArea } = Input;
const { Dragger } = Upload;

/** --- Dummy data (swap with your lists later) --- */
const COUNTRY_OPTIONS = [
  { value: "india", label: "India" },
  { value: "uae", label: "UAE" },
  { value: "turkey", label: "Turkey" },
  { value: "singapore", label: "Singapore" },
];

const CITY_BY_COUNTRY = {
  india: ["New Delhi", "Mumbai", "Bangalore", "Chennai"],
  uae: ["Dubai", "Abu Dhabi", "Sharjah"],
  turkey: ["Istanbul", "Ankara", "Antalya"],
  singapore: ["Singapore"],
};

export default function HeroSection() {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const country = Form.useWatch("country", form);
  const cityOptions = useMemo(() => {
    const list = CITY_BY_COUNTRY[country] || [];
    return list.map((c) => ({ value: c, label: c }));
  }, [country]);

  const next = async () => {
    try {
      // Validate only fields in the current step
      const fieldsByStep = [
        ["patientName", "country", "city"],
        ["phone", "email"],
        ["condition", "dob", "documents"],
        [], // captcha step validates separately
      ];
      await form.validateFields(fieldsByStep[step] || []);
      setStep((s) => s + 1);
    } catch {
      // antd will display errors; keep quiet here
    }
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const onFinish = async (values) => {
    if (!captchaToken) {
      message.error("Please verify the captcha.");
      return;
    }
    // TODO: send to Firestore / backend
    console.log("Lead:", { ...values, captchaToken });
    message.success("Thanks! We’ll reach out shortly.");
    form.resetFields();
    setCaptchaToken(null);
    if (recaptchaRef.current) recaptchaRef.current.reset();
    setStep(0);
  };

  return (
    <section className="hero-new">
      <div className="hero-shell">
        {/* LEFT: copy + CTA */}
        <div className="hero-copy">
          <span className="tag">Healthcare, simplified</span>
          <h1 className="hero-title">
            Find the right care, <span>fast.</span>
          </h1>
          <p className="hero-sub">
            Compare top hospitals and specialists, then get a callback with
            transparent estimates — all in one place.
          </p>

          <div className="cta-row">
            <Button
              type="primary"
              size="large"
              className="cta-primary"
              icon={<ArrowRightOutlined />}
              onClick={() => window.location.assign("/Treatments")}
            >
              Explore Treatments
            </Button>
            <Button size="large" className="cta-secondary" icon={<PhoneOutlined />}>
              Request Callback
            </Button>
          </div>

          <ul className="meta">
            <li>
              <strong>120+</strong> Hospitals
            </li>
            <li>
              <strong>450+</strong> Doctors
            </li>
            <li>
              <strong>12</strong> Countries
            </li>
          </ul>
        </div>

        {/* RIGHT: multi-step form */}
        <aside className="hero-form">
          <div className="form-card" role="region" aria-label="Patient inquiry">
            <div className="form-head">
              <h3>Get a quick estimate</h3>
              <p>4 quick steps — we’ll call you within hours.</p>
            </div>

            <div className="form-steps-wrap">
              <Steps
                current={step}
                size="small"
                items={[
                  { title: "Patient" },
                  { title: "Contact" },
                  { title: "Medical" },
                  { title: "Verify" },
                ]}
              />
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="form-body"
            >
              {/* STEP 0 — Patient */}
              {step === 0 && (
                <div className="form-step">
                  <Form.Item
                    name="patientName"
                    label="Patient Full Name"
                    rules={[{ required: true, message: "Please enter full name" }]}
                  >
                    <Input placeholder="John Doe" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="country"
                    label="Select Country"
                    rules={[{ required: true, message: "Please select country" }]}
                  >
                    <Select
                      size="large"
                      options={COUNTRY_OPTIONS}
                      placeholder="Choose a country"
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>

                  <Form.Item
                    name="city"
                    label="Select City"
                    rules={[{ required: true, message: "Please select city" }]}
                  >
                    <Select
                      size="large"
                      options={cityOptions}
                      placeholder="Choose a city"
                      disabled={!country}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </div>
              )}

              {/* STEP 1 — Contact */}
              {step === 1 && (
                <div className="form-step">
                  <Form.Item
                    name="phone"
                    label="Mobile Number"
                    rules={[
                      { required: true, message: "Please enter your mobile number" },
                      { pattern: /^[0-9()+\-\s]{7,20}$/, message: "Enter a valid number" },
                    ]}
                  >
                    <Input placeholder="+1 234 567 8900" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Your Email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Enter a valid email" },
                    ]}
                  >
                    <Input placeholder="you@example.com" size="large" />
                  </Form.Item>
                </div>
              )}

              {/* STEP 2 — Medical */}
              {step === 2 && (
                <div className="form-step">
                  <Form.Item
                    name="condition"
                    label="Describe the current medical condition"
                    rules={[{ required: true, message: "Please describe the condition" }]}
                  >
                    <TextArea rows={4} placeholder="Write a brief description…" />
                  </Form.Item>

                  <Form.Item
                    name="dob"
                    label="Date of Birth"
                    rules={[{ required: true, message: "Please select date of birth" }]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: "100%" }}
                      placeholder="Select date"
                      format="DD MMM YYYY"
                    />
                  </Form.Item>

                  <Form.Item
                    name="documents"
                    label="Upload Documents"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                  >
                    <Dragger beforeUpload={() => false} multiple showUploadList>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Drag & drop or click to upload medical files
                      </p>
                      <p className="ant-upload-hint">PDF, JPG, PNG. Max 10MB each.</p>
                    </Dragger>
                  </Form.Item>
                </div>
              )}

              {/* STEP 3 — Verify */}
              {step === 3 && (
                <div className="form-step">
                  <div className="captcha-wrap">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey="YOUR_RECAPTCHA_SITE_KEY"
                      onChange={(token) => setCaptchaToken(token)}
                    />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="form-controls">
                {step > 0 ? (
                  <Button onClick={prev} className="btn-prev">
                    Back
                  </Button>
                ) : (
                  <span />
                )}

                {step < 3 ? (
                  <Button type="primary" onClick={next} className="btn-next" icon={<ArrowRightOutlined />}>
                    Next
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit" className="btn-next">
                    Submit
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </aside>
      </div>
    </section>
  );
}
