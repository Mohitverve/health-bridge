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
} from 'antd';
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Admin.css';

const { TabPane } = Tabs;

export default function Admin() {
  const [loading, setLoading]               = useState(false);
  const [doctors, setDoctors]               = useState([]);
  const [inqLoading, setInqLoading]         = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [docModalVisible, setDocModalVisible] = useState(false);

  // load doctors
  const loadDoctors = async () => {
    setInqLoading(true);
    const snap = await getDocs(collection(db, 'doctors'));
    setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setInqLoading(false);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // show detail modal
  const showDoctor = doc => {
    setSelectedDoctor(doc);
    setDocModalVisible(true);
  };
  const closeDoctorModal = () => {
    setSelectedDoctor(null);
    setDocModalVisible(false);
  };

  // form handlers
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
    } catch (e) {
      console.error(e);
      message.error('Error adding hospital');
    }
    setLoading(false);
  };

  const onFinishTreatment = async values => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'treatments'), {
        name:        values.name,
        description: values.description || '',
        image:       values.imageUrl,
      });
      message.success('Treatment added');
    } catch (e) {
      console.error(e);
      message.error('Error adding treatment');
    }
    setLoading(false);
  };

  const onFinishDoctor = async values => {
    setLoading(true);
    try {
      const specs = values.specialty
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      await addDoc(collection(db, 'doctors'), {
        name:       values.name,
        hospital:   values.hospital,
        specialty:  specs,
        image:      values.imageUrl,
        bio:        values.bio || '',
      });
      message.success('Doctor added');
      loadDoctors();
    } catch (e) {
      console.error(e);
      message.error('Error adding doctor');
    }
    setLoading(false);
  };

  // doctors table columns
  const doctorColumns = [
    { title: 'Name',     dataIndex: 'name',      key: 'name' },
    { title: 'Hospital', dataIndex: 'hospital',  key: 'hospital' },
    {
      title: 'Specialty',
      dataIndex: 'specialty',
      key: 'specialty',
      render: arr => arr.map(s => <Tag key={s}>{s}</Tag>)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button type="link" onClick={() => showDoctor(row)}>
          View
        </Button>
      )
    }
  ];

  return (
    <>
     
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        <Tabs defaultActiveKey="hospitals" centered>
          {/* Hospitals */}
          <TabPane tab="Hospitals" key="hospitals">
            <Form layout="vertical" onFinish={onFinishHospital}>
              <Form.Item name="name" label="Hospital Name"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="city" label="City"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="country" label="Country"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="specialties" label="Specialties"
                extra="Comma-separate.">
                <Input />
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit"
                  loading={loading}>Add Hospital</Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Treatments */}
          <TabPane tab="Treatments" key="treatments">
            <Form layout="vertical" onFinish={onFinishTreatment}>
              <Form.Item name="name" label="Treatment Name"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3}/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit"
                  loading={loading}>Add Treatment</Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Doctors */}
          <TabPane tab="Doctors" key="doctors">
            <Form layout="vertical" onFinish={onFinishDoctor}>
              <Form.Item name="name" label="Doctor Name"
                rules={[{ required: true }]}>
                <Input placeholder="e.g. Dr. Mehta"/>
              </Form.Item>
              <Form.Item name="hospital" label="Hospital Affiliation"
                rules={[{ required: true }]}>
                <Input placeholder="e.g. Apollo Hospital"/>
              </Form.Item>
              <Form.Item name="specialty" label="Specialty"
                extra="Comma-separate (e.g. Cardiology, Neurology)">
                <Input/>
              </Form.Item>
              <Form.Item name="bio" label="Short Bio">
                <Input.TextArea rows={3}/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL"
                rules={[{ required: true }]}>
                <Input/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit"
                  loading={loading}>Add Doctor</Button>
              </Form.Item>
            </Form>

            <Table
              style={{ marginTop: 24 }}
              dataSource={doctors}
              columns={doctorColumns}
              rowKey="id"
              loading={inqLoading}
              pagination={{ pageSize: 5 }}
            />

            <Modal
              title="Doctor Details"
              visible={docModalVisible}
              onCancel={closeDoctorModal}
              footer={[
                <Button key="close" onClick={closeDoctorModal}>
                  Close
                </Button>
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
        </Tabs>
      </div>
      <Footer />
    </>
  );
}
