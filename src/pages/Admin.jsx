// src/pages/Admin.jsx
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Form,
  Input,
  Button,
  DatePicker,
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

const { TabPane }  = Tabs;
const { TextArea } = Input;

export default function Admin() {
  const [loading, setLoading]             = useState(false);
  const [hospitals, setHospitals]         = useState([]);
  const [treatments, setTreatments]       = useState([]);
  const [doctors, setDoctors]             = useState([]);
  const [inquiries, setInquiries]         = useState([]);
  const [blogs, setBlogs]                 = useState([]);

  const [inqLoading, setInqLoading]       = useState(true);
  const [blogLoading, setBlogLoading]     = useState(true);

  const [selectedDoctor, setSelectedDoctor]     = useState(null);
  const [docModalVisible, setDocModalVisible]   = useState(false);

  const [selectedInquiry, setSelectedInquiry]   = useState(null);
  const [inqModalVisible, setInqModalVisible]   = useState(false);

  const [selectedBlog, setSelectedBlog]         = useState(null);
  const [blogModalVisible, setBlogModalVisible] = useState(false);

  const [blogForm] = Form.useForm();

  // ── LOADERS ────────────────────────────────────────────────────────────
  const loadCollection = async (col, setter, setLoadingFn) => {
    setLoadingFn(true);
    const snap = await getDocs(collection(db, col));
    setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoadingFn(false);
  };

  useEffect(() => {
    loadCollection('hospitals',   setHospitals,   setLoading);
    loadCollection('treatments',  setTreatments,  setLoading);
    loadCollection('doctors',     setDoctors,     setLoading);
    loadCollection('inquiries',   setInquiries,   setInqLoading);
    loadCollection('blogs',       setBlogs,       setBlogLoading);
  }, []);

  // ── SHOW / CLOSE MODALS ────────────────────────────────────────────────
  const showDoctorModal   = d => { setSelectedDoctor(d);   setDocModalVisible(true); };
  const closeDoctorModal  = () => setDocModalVisible(false);

  const showInquiryModal  = i => { setSelectedInquiry(i);    setInqModalVisible(true); };
  const closeInquiryModal = () => setInqModalVisible(false);

  const showBlogModal     = b => { setSelectedBlog(b);       setBlogModalVisible(true); };
  const closeBlogModal    = () => setBlogModalVisible(false);

  // ── FORM SUBMISSIONS ──────────────────────────────────────────────────
  const submitToCollection = async (col, data, clearFn) => {
    setLoading(true);
    try {
      await addDoc(collection(db, col), data);
      message.success(`${col.slice(0,-1)} added`);
      clearFn && clearFn();
      // reload that collection
      loadCollection(col, {
        hospitals:   setHospitals,
        treatments:  setTreatments,
        doctors:     setDoctors,
        inquiries:   setInquiries,
        blogs:       setBlogs,
      }[col], col==='inquiries'? setInqLoading : col==='blogs'? setBlogLoading : setLoading);
    } catch (e) {
      console.error(e);
      message.error(`Error adding to ${col}`);
    }
    setLoading(false);
  };

  const onFinishHospital  = v => submitToCollection('hospitals', {
    name: v.name, city: v.city, country: v.country,
    specialties: v.specialties.split(',').map(s=>s.trim()),
    image: v.imageUrl
  });

  const onFinishTreatment = v => submitToCollection('treatments', {
    name: v.name, description: v.description, image: v.imageUrl
  });

  const onFinishDoctor    = v => submitToCollection('doctors', {
    name: v.name, hospital: v.hospital,
    specialty: v.specialty.split(',').map(s=>s.trim()),
    bio: v.bio, image: v.imageUrl
  });

  const onFinishBlog      = v => submitToCollection('blogs', {
    title: v.title,
    excerpt: v.excerpt,
    content: v.content,
    imageUrl: v.imageUrl,
    publishedDate: v.publishedDate.toISOString()
  }, () => blogForm.resetFields());

  // ── INQUIRY UPDATES ──────────────────────────────────────────────────
  const updateInquiryStatus = async (inq, status) => {
    await updateDoc(doc(db, 'inquiries', inq.id), { status });
    message.success(`Marked as ${status}`);
    loadCollection('inquiries', setInquiries, setInqLoading);
  };
  const deleteInquiry      = async id => {
    await deleteDoc(doc(db, 'inquiries', id));
    message.success('Inquiry deleted');
    loadCollection('inquiries', setInquiries, setInqLoading);
  };

  // ── TABLE CONFIGS ─────────────────────────────────────────────────────
  const mkTag = s => <Tag key={s}>{s}</Tag>;

  const hospitalCols = [
    { title:'Name', dataIndex:'name', key:'name' },
    { title:'City', dataIndex:'city', key:'city' },
    { title:'Country', dataIndex:'country', key:'country' },
    {
      title:'Specialties',
      dataIndex:'specialties',
      key:'specialties',
      render: arr => arr.map(mkTag)
    }
  ];

  const treatmentCols = [
    { title:'Name', dataIndex:'name', key:'name' },
    {
      title:'Description',
      dataIndex:'description',
      key:'description',
      render: txt => txt.length>40 ? txt.slice(0,40)+'…' : txt
    }
  ];

  const doctorCols = [
    { title:'Name', dataIndex:'name', key:'name' },
    { title:'Hospital', dataIndex:'hospital', key:'hospital' },
    {
      title:'Specialty',
      dataIndex:'specialty',
      key:'specialty',
      render: arr => arr.map(mkTag)
    }
  ];

  const inquiryCols = [
    { title:'Name', dataIndex:'fullName', key:'fullName' },
    { title:'Email', dataIndex:'email',    key:'email'    },
    { title:'Phone', dataIndex:'mobile',   key:'mobile'   },
    { title:'Condition', dataIndex:'condition', key:'condition' },
    {
      title:'Status', dataIndex:'status', key:'status',
      render: s => {
        let color='gold', txt=s||'New';
        if(txt==='In Progress') color='blue';
        if(txt==='Completed')   color='green';
        return <Tag color={color}>{txt}</Tag>;
      }
    },
    {
      title:'Actions', key:'actions',
      render: (_,row) => (
        <>
          <Button type="link" onClick={()=>showInquiryModal(row)}>View</Button>
          { !['In Progress','Completed'].includes(row.status||'') &&
            <Button type="link" onClick={()=>updateInquiryStatus(row,'In Progress')}>
              Contact
            </Button>
          }
          { row.status==='In Progress' &&
            <Button type="link" onClick={()=>updateInquiryStatus(row,'Completed')}>
              Complete
            </Button>
          }
          <Popconfirm
            title="Delete this inquiry?"
            onConfirm={()=>deleteInquiry(row.id)}
          >
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  const blogCols = [
    { title:'Title', dataIndex:'title', key:'title' },
    {
      title:'Date',
      dataIndex:'publishedDate',
      key:'publishedDate',
      render: iso => new Date(iso).toLocaleDateString()
    },
    {
      title:'Actions',
      key:'actions',
      render: (_,row) => (
        <Button type="link" onClick={()=>showBlogModal(row)}>
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
              <Form.Item name="name" label="Name" rules={[{required:true}]}>
                <Input />
              </Form.Item>
              <Form.Item name="city" label="City" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item name="country" label="Country" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item
                name="specialties"
                label="Specialties"
                extra="Comma-separate"
              >
                <Input/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Hospital
                </Button>
              </Form.Item>
            </Form>
            <Table
              style={{marginTop:24}}
              dataSource={hospitals}
              columns={hospitalCols}
              rowKey="id"
              pagination={{pageSize:5}}
              loading={loading}
            />
          </TabPane>

          {/* Treatments */}
          <TabPane tab="Treatments" key="treatments">
            <Form layout="vertical" onFinish={onFinishTreatment}>
              <Form.Item name="name" label="Name" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item name="description" label="Description">
                <TextArea rows={3}/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Treatment
                </Button>
              </Form.Item>
            </Form>
            <Table
              style={{marginTop:24}}
              dataSource={treatments}
              columns={treatmentCols}
              rowKey="id"
              pagination={{pageSize:5}}
              loading={loading}
            />
          </TabPane>

          {/* Doctors */}
          <TabPane tab="Doctors" key="doctors">
            <Form layout="vertical" onFinish={onFinishDoctor}>
              <Form.Item name="name" label="Name" rules={[{required:true}]}>
                <Input placeholder="Dr. Smith"/>
              </Form.Item>
              <Form.Item name="hospital" label="Hospital" rules={[{required:true}]}>
                <Input placeholder="Apollo Hospital"/>
              </Form.Item>
              <Form.Item
                name="specialty"
                label="Specialty"
                extra="Comma-separate"
              >
                <Input/>
              </Form.Item>
              <Form.Item name="bio" label="Bio">
                <TextArea rows={2}/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Image URL" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Doctor
                </Button>
              </Form.Item>
            </Form>
            <Table
              style={{marginTop:24}}
              dataSource={doctors}
              columns={doctorCols}
              rowKey="id"
              pagination={{pageSize:5}}
              loading={loading}
            />
            <Modal
              title="Doctor Details"
              visible={docModalVisible}
              onCancel={closeDoctorModal}
              footer={[<Button key="close" onClick={closeDoctorModal}>Close</Button>]}
            >
              {selectedDoctor && (
                <>
                  <p><strong>Name:</strong> {selectedDoctor.name}</p>
                  <p><strong>Hospital:</strong> {selectedDoctor.hospital}</p>
                  <p><strong>Specialty:</strong> {selectedDoctor.specialty.join(', ')}</p>
                  <p><strong>Bio:</strong> {selectedDoctor.bio}</p>
                </>
              )}
            </Modal>
          </TabPane>

          {/* Inquiries */}
          <TabPane tab="Inquiries" key="inquiries">
            <Table
              dataSource={inquiries}
              columns={inquiryCols}
              rowKey="id"
              pagination={{pageSize:5}}
              loading={inqLoading}
            />
            <Modal
              title="Inquiry Details"
              visible={inqModalVisible}
              onCancel={closeInquiryModal}
              footer={[<Button key="close" onClick={closeInquiryModal}>Close</Button>]}
            >
              {selectedInquiry && (
                <>
                  <p><strong>Name:</strong> {selectedInquiry.fullName}</p>
                  <p><strong>Email:</strong> {selectedInquiry.email}</p>
                  <p><strong>Phone:</strong> {selectedInquiry.mobile}</p>
                  <p><strong>Condition:</strong> {selectedInquiry.condition}</p>
                  <p><strong>Status:</strong> {selectedInquiry.status || 'New'}</p>
                </>
              )}
            </Modal>
          </TabPane>

          {/* Blogs */}
          <TabPane tab="Blogs" key="blogs">
            <Form
              form={blogForm}
              layout="vertical"
              onFinish={onFinishBlog}
            >
              <Form.Item name="title" label="Title" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item name="excerpt" label="Excerpt" rules={[{required:true}]}>
                <TextArea rows={2}/>
              </Form.Item>
              <Form.Item name="content" label="Content" rules={[{required:true}]}>
                <TextArea rows={6}/>
              </Form.Item>
              <Form.Item name="imageUrl" label="Cover Image URL" rules={[{required:true}]}>
                <Input/>
              </Form.Item>
              <Form.Item name="publishedDate" label="Publish Date" rules={[{required:true}]}>
                <DatePicker style={{width:'100%'}}/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Blog Post
                </Button>
              </Form.Item>
            </Form>
            <Table
              style={{marginTop:24}}
              dataSource={blogs}
              columns={blogCols}
              rowKey="id"
              pagination={{pageSize:5}}
              loading={blogLoading}
            />
            <Modal
              title={selectedBlog?.title}
              visible={blogModalVisible}
              onCancel={closeBlogModal}
              footer={[<Button key="close" onClick={closeBlogModal}>Close</Button>]}
              width={800}
            >
              {selectedBlog && (
                <>
                  <img
                    src={selectedBlog.imageUrl}
                    alt={selectedBlog.title}
                    style={{width:'100%', marginBottom:16, borderRadius:4}}
                  />
                  <p style={{fontStyle:'italic', color:'#888', marginBottom:16}}>
                    {new Date(selectedBlog.publishedDate).toLocaleDateString()}
                  </p>
                  <div style={{lineHeight:1.6}}>
                    {selectedBlog.content.split('\n').map((p,i)=><p key={i}>{p}</p>)}
                  </div>
                </>
              )}
            </Modal>
          </TabPane>
        </Tabs>
      </div>

  
    </>
  );
}
