// src/pages/GetQuotePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Steps,
  Card,
  message,
  Row,
  Col,
  Spin,
} from 'antd';
import { getDocs, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GetQuotePage.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

export default function GetQuotePage() {
  // Step navigation
  const [current, setCurrent] = useState(0);

  // Form instances
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();

  // Collected values
  const [personal, setPersonal] = useState({});
  const [medical, setMedical]   = useState({});
  const [prefs, setPrefs]       = useState({ treatments: [], hospitals: [] });

  // Fetched dropdown lists
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [hospitalsList, setHospitalsList]   = useState([]);
  const [loadingLists, setLoadingLists]     = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load treatments & hospitals names
  useEffect(() => {
    (async () => {
      try {
        const [tSnap, hSnap] = await Promise.all([
          getDocs(collection(db, 'treatments')),
          getDocs(collection(db, 'hospitals')),
        ]);
        setTreatmentsList(tSnap.docs.map(d => d.data().name).filter(Boolean));
        setHospitalsList(hSnap.docs.map(d => d.data().name).filter(Boolean));
      } catch (err) {
        console.error('Error loading lists:', err);
      } finally {
        setLoadingLists(false);
      }
    })();
  }, []);

  // Define each step's UI
  const steps = [
    {
      title: 'Personal',
      content: (
        <Form
          form={form1}
          layout="vertical"
          initialValues={personal}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Enter your name' }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Enter your email' },
                  { type: 'email', message: 'Invalid email' },
                ]}
              >
                <Input placeholder="you@example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Enter phone number' }]}
              >
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Enter your country' }]}
              >
                <Input placeholder="Country" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="state"
            label="State / Province"
            rules={[{ required: true, message: 'Enter your state' }]}
          >
            <Input placeholder="State / Province" />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Medical',
      content: (
        <Form
          form={form2}
          layout="vertical"
          initialValues={medical}
        >
          <Form.Item
            name="condition"
            label="Describe your medical condition"
            rules={[{ required: true, message: 'Describe your condition' }]}
          >
            <TextArea rows={4} placeholder="e.g. chronic back pain" />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Preferences',
      content: loadingLists ? (
        <Spin style={{ margin: '40px auto', display: 'block' }} />
      ) : (
        <Form
          form={form3}
          layout="vertical"
          initialValues={prefs}
        >
          <Form.Item
            name="treatments"
            label="Preferred Treatments"
            rules={[{ required: true, message: 'Select at least one' }]}
          >
            <Select mode="multiple" placeholder="Choose treatments">
              {treatmentsList.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="hospitals"
            label="Preferred Hospitals"
            rules={[{ required: true, message: 'Select at least one' }]}
          >
            <Select mode="multiple" placeholder="Choose hospitals">
              {hospitalsList.map(h => (
                <Option key={h} value={h}>{h}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Review',
      content: (
        <Card bordered>
          <h3>Personal Info</h3>
          <p><b>Name:</b> {personal.fullName || ''}</p>
          <p><b>Email:</b> {personal.email || ''}</p>
          <p><b>Phone:</b> {personal.phone || ''}</p>
          <p><b>Country:</b> {personal.country || ''}</p>
          <p><b>State:</b> {personal.state || ''}</p>

          <h3 style={{ marginTop: 16 }}>Medical</h3>
          <p>{medical.condition || ''}</p>

          <h3 style={{ marginTop: 16 }}>Preferences</h3>
          <p><b>Treatments:</b> {(prefs.treatments || []).join(', ')}</p>
          <p><b>Hospitals:</b> {(prefs.hospitals || []).join(', ')}</p>
        </Card>
      ),
    },
  ];

  // Move to next step after validating
  const next = async () => {
    try {
      if (current === 0) {
        const vals = await form1.validateFields();
        setPersonal(vals);
      } else if (current === 1) {
        const vals = await form2.validateFields();
        setMedical(vals);
      } else if (current === 2) {
        const vals = await form3.validateFields();
        setPrefs(vals);
      }
      setCurrent(curr => curr + 1);
    } catch {
      // validation failed
    }
  };

  const prev = () => setCurrent(curr => curr - 1);

  // Submit to Firestore and clear everything
  const submit = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...personal,
        ...medical,
        ...prefs,
        createdAt: serverTimestamp(),
      });
      message.success('Inquiry submitted! We’ll be in touch shortly.');

      // reset forms & state
      form1.resetFields();
      form2.resetFields();
      form3.resetFields();
      setPersonal({});
      setMedical({});
      setPrefs({ treatments: [], hospitals: [] });
      setCurrent(0);
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
     
      <div className="gq-container">
        <Steps current={current} className="gq-steps">
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div className="gq-content">{steps[current].content}</div>

        <div className="gq-actions">
          {current > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              type="primary"
              loading={submitting}
              onClick={submit}
            >
              Submit Inquiry
            </Button>
          )}
        </div>
      </div>

     
    </>
  );
}
