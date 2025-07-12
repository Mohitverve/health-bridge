// src/pages/Admin.jsx
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Form,
  Input,
  Button,
  message,
  Table,
  Modal,
  Tag,
  Popconfirm,
} from 'antd';
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Admin.css';

const { TabPane } = Tabs;

export default function Admin() {
  const [loading, setLoading]             = useState(false);
  const [doctors, setDoctors]             = useState([]);
  const [inqLoading, setInqLoading]       = useState(true);
  const [inquiries, setInquiries]         = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry]   = useState(null);
  const [inqModalVisible, setInqModalVisible]   = useState(false);

  // ── Load Doctors ───────────────────────────────────────────────────
  const loadDoctors = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'doctors'));
    setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // ── Load Inquiries ─────────────────────────────────────────────────
  const loadInquiries = async () => {
    setInqLoading(true);
    const snap = await getDocs(collection(db, 'inquiries'));
    setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setInqLoading(false);
  };

  useEffect(() => {
    loadDoctors();
    loadInquiries();
  }, []);

  // ── Show / Close Doctor Modal ─────────────────────────────────────
  const showDoctor = doc => {
    setSelectedDoctor(doc);
    setDocModalVisible(true);
  };
  const closeDoctorModal = () => {
    setSelectedDoctor(null);
    setDocModalVisible(false);
  };

  // ── Show / Close Inquiry Modal ────────────────────────────────────
  const showInquiry = inq => {
    setSelectedInquiry(inq);
    setInqModalVisible(true);
  };
  const closeInquiryModal = () => {
    setSelectedInquiry(null);
    setInqModalVisible(false);
  };

  // ── Add Hospital ───────────────────────────────────────────────────
  const onFinishHospital = async values => {
    setLoading(true);
    try {
      const specs = values.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      await addDoc(collection(db, 'hospitals'), {
        name:        values.name,
        city:        values.city,
        country:     values.country,
        specialties: specs,
        image:       values.imageUrl,
      });
      message.success('Hospital added');
    } catch {
      message.error('Error adding hospital');
    }
    setLoading(false);
  };

  // ── Add Treatment ─────────────────────────────────────────────────
  const onFinishTreatment = async values => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'treatments'), {
        name:        values.name,
        description: values.description || '',
        image:       values.imageUrl,
      });
      message.success('Treatment added');
    } catch {
      message.error('Error adding treatment');
    }
    setLoading(false);
  };

  // ── Add Doctor ────────────────────────────────────────────────────
  const onFinishDoctor = async values => {
    setLoading(true);
    try {
      const specs = values.specialty
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      await addDoc(collection(db, 'doctors'), {
        name:      values.name,
        hospital:  values.hospital,
        specialty: specs,
        image:     values.imageUrl,
        bio:       values.bio || '',
      });
      message.success('Doctor added');
      loadDoctors();
    } catch {
      message.error('Error adding doctor');
    }
    setLoading(false);
  };

  // ── Update Inquiry Status ─────────────────────────────────────────
  const updateInquiryStatus = async (inq, status) => {
    await updateDoc(doc(db, 'inquiries', inq.id), { status });
    message.success(`Marked as ${status}`);
    loadInquiries();
  };

  // ── Delete Inquiry ────────────────────────────────────────────────
  const deleteInquiry = async id => {
    await deleteDoc(doc(db, 'inquiries', id));
    message.success('Inquiry deleted');
    loadInquiries();
  };

  // ── Table Columns ─────────────────────────────────────────────────
  const doctorColumns = [
    { title: 'Name',     dataIndex: 'name',     key: 'name' },
    { title: 'Hospital', dataIndex: 'hospital', key: 'hospital' },
    {
      title: 'Specialty',
      dataIndex: 'specialty',
      key: 'specialty',
      render: arr => arr.map(s => <Tag key={s}>{s}</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button type="link" onClick={() => showDoctor(row)}>
          View
        </Button>
      ),
    },
  ];

  const inquiryColumns = [
    { title: 'Name',      dataIndex: 'fullName',  key: 'fullName' },
    { title: 'Email',     dataIndex: 'email',     key: 'email'    },
    { title: 'Phone',     dataIndex: 'mobile',    key: 'mobile'   },
    { title: 'Condition', dataIndex: 'condition', key: 'condition'},
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        let color = 'gold', text = s || 'New';
        if (text === 'In Progress') color = 'blue';
        if (text === 'Completed')   color = 'green';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <>
          <Button type="link" onClick={() => showInquiry(row)}>
            View
          </Button>
          {row.status !== 'In Progress' && row.status !== 'Completed' && (
            <Button
              type="link"
              onClick={() => updateInquiryStatus(row, 'In Progress')}
            >
              Contact
            </Button>
          )}
          {row.status === 'In Progress' && (
            <Button
              type="link"
              onClick={() => updateInquiryStatus(row, 'Completed')}
            >
              Complete
            </Button>
          )}
          <Popconfirm
            title="Delete this inquiry?"
            onConfirm={() => deleteInquiry(row.id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
     
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        <Tabs defaultActiveKey="hospitals" centered>
          {/* Hospitals */}
          <TabPane tab="Hospitals" key="hospitals">
            <Form layout="vertical" onFinish={onFinishHospital}>
              <Form.Item name="name" label="Hospital Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                name="specialties"
                label="Specialties"
                extra="Comma-separate, e.g. Cardiology, Neurology"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="imageUrl"
                label="Image URL"
                rules={[{ required: true }]}
              >
                <Input placeholder="https://your-host/xyz.jpg" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Hospital
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Treatments */}
          <TabPane tab="Treatments" key="treatments">
            <Form layout="vertical" onFinish={onFinishTreatment}>
              <Form.Item name="name" label="Treatment Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="imageUrl"
                label="Image URL"
                rules={[{ required: true }]}
              >
                <Input placeholder="https://your-host/abc.png" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Treatment
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Doctors */}
          <TabPane tab="Doctors" key="doctors">
            <Form layout="vertical" onFinish={onFinishDoctor}>
              <Form.Item name="name" label="Doctor Name" rules={[{ required: true }]}>
                <Input placeholder="Dr. Mehta" />
              </Form.Item>
              <Form.Item
                name="hospital"
                label="Hospital Affiliation"
                rules={[{ required: true }]}
              >
                <Input placeholder="Apollo Hospital" />
              </Form.Item>
              <Form.Item
                name="specialty"
                label="Specialty"
                extra="Comma-separate, e.g. Cardiology, Neurology"
              >
                <Input />
              </Form.Item>
              <Form.Item name="bio" label="Short Bio">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="imageUrl"
                label="Image URL"
                rules={[{ required: true }]}
              >
                <Input placeholder="https://your-host/doc.png" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Doctor
                </Button>
              </Form.Item>
            </Form>

            <Table
              style={{ marginTop: 24 }}
              dataSource={doctors}
              columns={doctorColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
            />

            <Modal
              title="Doctor Details"
              visible={docModalVisible}
              onCancel={closeDoctorModal}
              footer={[
                <Button key="close" onClick={closeDoctorModal}>
                  Close
                </Button>,
              ]}
            >
              {selectedDoctor && (
                <>
                  <p><strong>Name:</strong> {selectedDoctor.name}</p>
                  <p><strong>Hospital:</strong> {selectedDoctor.hospital}</p>
                  <p>
                    <strong>Specialties:</strong>{' '}
                    {selectedDoctor.specialty.join(', ')}
                  </p>
                  <p><strong>Bio:</strong> {selectedDoctor.bio}</p>
                </>
              )}
            </Modal>
          </TabPane>

          {/* Inquiries */}
          <TabPane tab="Inquiries" key="inquiries">
            <Table
              dataSource={inquiries}
              columns={inquiryColumns}
              rowKey="id"
              loading={inqLoading}
              pagination={{ pageSize: 5 }}
            />

            <Modal
              title="Inquiry Details"
              visible={inqModalVisible}
              onCancel={closeInquiryModal}
              footer={[
                <Button key="close" onClick={closeInquiryModal}>
                  Close
                </Button>,
              ]}
            >
              {selectedInquiry && (
                <>
                  <p><strong>Name:</strong> {selectedInquiry.fullName}</p>
                  <p><strong>Email:</strong> {selectedInquiry.email}</p>
                  <p><strong>Phone:</strong> {selectedInquiry.mobile}</p>
                  <p><strong>Condition:</strong> {selectedInquiry.condition}</p>
                  <p><strong>DOB:</strong> {selectedInquiry.dob}</p>
                  <p><strong>Status:</strong> {selectedInquiry.status || 'New'}</p>
                </>
              )}
            </Modal>
          </TabPane>
        </Tabs>
      </div>
   
    </>
  );
}
