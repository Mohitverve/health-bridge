import React, { useState } from 'react';
import { Tabs, Form, Input, Button, Select, message } from 'antd';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import '../styles/Admin.css';
import Header from '../components/Header';
import Navbar from '../components/Navbar';

const { TabPane } = Tabs;
const { Option } = Select;

export default function Admin() {
  const [loading, setLoading] = useState(false);

  const onFinishHospital = async (values) => {
    setLoading(true);
    try {
      // specialties come in as comma-separated string; convert to array
      const specs = values.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await addDoc(collection(db, 'hospitals'), {
        name: values.name,
        city: values.city,
        country: values.country,
        specialties: specs,
        image: values.imageUrl,
      });
      message.success('Hospital added successfully');
    } catch (e) {
      console.error(e);
      message.error('Failed to add hospital');
    }
    setLoading(false);
  };

  const onFinishTreatment = async (values) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'treatments'), {
        name:        values.name,
        description: values.description || '',
        image:       values.imageUrl,
      });
      message.success('Treatment added successfully');
    } catch (e) {
      console.error(e);
      message.error('Failed to add treatment');
    }
    setLoading(false);
  };

  return (
    <div>
        <Header/>
        <Navbar/>
   
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <Tabs defaultActiveKey="hospitals" centered>
        <TabPane tab="Hospitals" key="hospitals">
          <Form
            layout="vertical"
            onFinish={onFinishHospital}
          >
            <Form.Item
              name="name"
              label="Hospital Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input placeholder="e.g. Apollo Hospital" />
            </Form.Item>

            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: 'Please enter a city' }]}
            >
              <Input placeholder="e.g. Mumbai" />
            </Form.Item>

            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true, message: 'Please enter a country' }]}
            >
              <Input placeholder="e.g. India" />
            </Form.Item>

            <Form.Item
              name="specialties"
              label="Specialties"
              rules={[{ required: true, message: 'Comma-separate specialties' }]}
              extra="Comma-separate, e.g. Cardiology, Neurology"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="imageUrl"
              label="Image URL"
              rules={[{ required: true, message: 'Please provide an image URL' }]}
              extra="Use any external image host and paste the public URL"
            >
              <Input placeholder="https://your-image-host.com/xyz.jpg" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Add Hospital
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Treatments" key="treatments">
          <Form
            layout="vertical"
            onFinish={onFinishTreatment}
          >
            <Form.Item
              name="name"
              label="Treatment Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input placeholder="e.g. Cardiology" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} placeholder="Short description" />
            </Form.Item>

            <Form.Item
              name="imageUrl"
              label="Image URL"
              rules={[{ required: true, message: 'Please provide an image URL' }]}
            >
              <Input placeholder="https://your-image-host.com/abc.png" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Add Treatment
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </div>
     </div>
  );
}
