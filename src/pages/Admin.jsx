// src/pages/Admin.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tabs, Form, Input, Button, DatePicker, message, Table, Modal, Tag,
  Popconfirm, Upload, Space, Drawer, Select, Divider, Typography, Card, Affix, InputNumber
} from 'antd';
import {
  addDoc, collection, getDocs, updateDoc, deleteDoc, doc, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  PlusOutlined, UploadOutlined, FileExcelOutlined, InboxOutlined,
  SearchOutlined, DatabaseOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import '../styles/Admin.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

/* ----------------------- Cloudinary Upload (unsigned) ---------------------- */
async function uploadToCloudinary(file) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error(
      'Cloudinary env vars missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET'
    );
  }
  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json();
  return json.secure_url;
}

function CloudinaryUploadButton({ onUploaded, children, size = 'small' }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const choose = () => inputRef.current?.click();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      onUploaded?.(url);
      message.success('Image uploaded');
    } catch (err) {
      console.error(err);
      message.error('Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input type="file" accept="image/*" hidden ref={inputRef} onChange={handleChange} />
      <Button icon={<UploadOutlined />} loading={loading} size={size} onClick={choose}>
        {children ?? 'Upload Image'}
      </Button>
    </>
  );
}

/* ------------------------------ Small helpers ----------------------------- */
const mkTag = (s) => <Tag key={s}>{s}</Tag>;
const PAGINATION = { pageSize: 8, showSizeChanger: false };
const getImageField = (row) => row.image || row.imageUrl || row.logoUrl || '';

/* ================================= Page =================================== */
export default function Admin() {
  const [loading, setLoading] = useState(false);

  const [hospitals, setHospitals] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [blogs, setBlogs] = useState([]);

  const [inqLoading, setInqLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(true);

  // Edit modals
  const [editHospital, setEditHospital] = useState(null);
  const [editTreatment, setEditTreatment] = useState(null);
  const [editDoctor, setEditDoctor] = useState(null);
  const [editBlog, setEditBlog] = useState(null);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [docModalVisible, setDocModalVisible] = useState(false);

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inqModalVisible, setInqModalVisible] = useState(false);

  const [selectedBlog, setSelectedBlog] = useState(null);
  const [blogModalVisible, setBlogModalVisible] = useState(false);

  // Topbar
  const [activeTab, setActiveTab] = useState('hospitals');
  const [quickQuery, setQuickQuery] = useState('');

  // CSV import
  const [importOpen, setImportOpen] = useState(false);
  const [importCollection, setImportCollection] = useState('treatments');
  const [parsedRows, setParsedRows] = useState([]);
  const [importValid, setImportValid] = useState(false);

  // Forms
  const [hospitalForm] = Form.useForm();
  const [treatmentForm] = Form.useForm();
  const [doctorForm] = Form.useForm();
  const [blogForm] = Form.useForm();

  const [editHospitalForm] = Form.useForm();
  const [editTreatmentForm] = Form.useForm();
  const [editDoctorForm] = Form.useForm();
  const [editBlogForm] = Form.useForm();

  /* ------------------------------ Data loading ----------------------------- */
  const loadCollection = async (col, setter, setLoadingFn) => {
    setLoadingFn(true);
    const snap = await getDocs(collection(db, col));
    setter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoadingFn(false);
  };

  useEffect(() => {
    loadCollection('hospitals', setHospitals, setLoading);
    loadCollection('treatments', setTreatments, setLoading);
    loadCollection('doctors', setDoctors, setLoading);
    loadCollection('inquiries', setInquiries, setInqLoading);
    loadCollection('blogs', setBlogs, setBlogLoading);
  }, []);

  /* -------------------------------- Modals -------------------------------- */
  const showDoctorModal = (d) => {
    setSelectedDoctor(d);
    setDocModalVisible(true);
  };
  const closeDoctorModal = () => setDocModalVisible(false);

  const showInquiryModal = (i) => {
    setSelectedInquiry(i);
    setInqModalVisible(true);
  };
  const closeInquiryModal = () => setInqModalVisible(false);

  const showBlogModal = (b) => {
    setSelectedBlog(b);
    setBlogModalVisible(true);
  };
  const closeBlogModal = () => setBlogModalVisible(false);

  /* ----------------------------- Create records ---------------------------- */
  const submitToCollection = async (col, data, clearFn) => {
    setLoading(true);
    try {
      await addDoc(collection(db, col), data);
      message.success(`${col.slice(0, -1)} added`);
      clearFn && clearFn();
      await loadCollection(
        col,
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, inquiries: setInquiries, blogs: setBlogs }[col],
        col === 'inquiries' ? setInqLoading : col === 'blogs' ? setBlogLoading : setLoading
      );
    } catch (e) {
      console.error(e);
      message.error(`Error adding to ${col}`);
    }
    setLoading(false);
  };

  const onFinishHospital = (v) =>
    submitToCollection('hospitals', {
      name: v.name,
      city: v.city,
      country: v.country,
      specialties: (v.specialties || '').split(',').map((s) => s.trim()).filter(Boolean),
      image: v.imageUrl
    }, () => hospitalForm.resetFields());

  const onFinishTreatment = (v) =>
    submitToCollection('treatments', {
      name: v.name,
      description: v.description,
      category: v.category || '',
      keywords: v.keywords || '',
      pricing: v.pricing || null,
      duration: v.duration || '',
      image: v.imageUrl
    }, () => treatmentForm.resetFields());

  const onFinishDoctor = (v) =>
    submitToCollection('doctors', {
      name: v.name,
      hospital: v.hospital,
      specialty: (v.specialty || '').split(',').map((s) => s.trim()).filter(Boolean),
      bio: v.bio,
      image: v.imageUrl
    }, () => doctorForm.resetFields());

  const onFinishBlog = (v) =>
    submitToCollection(
      'blogs',
      {
        title: v.title,
        excerpt: v.excerpt,
        content: v.content,
        imageUrl: v.imageUrl,
        publishedDate: v.publishedDate?.toISOString?.() || new Date().toISOString()
      },
      () => blogForm.resetFields()
    );

  /* ----------------------------- Update records ---------------------------- */
  const updateRecord = async (col, id, data, form, closeFn) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, col, id), data);
      message.success(`${col.slice(0, -1)} updated`);
      closeFn();
      form.resetFields();
      await loadCollection(
        col,
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, blogs: setBlogs }[col],
        col === 'blogs' ? setBlogLoading : setLoading
      );
    } catch (e) {
      console.error(e);
      message.error(`Error updating ${col}`);
    }
    setLoading(false);
  };

  const onUpdateHospital = (v) =>
    updateRecord('hospitals', editHospital.id, {
      name: v.name,
      city: v.city,
      country: v.country,
      specialties: (v.specialties || '').split(',').map((s) => s.trim()).filter(Boolean),
      image: v.imageUrl
    }, editHospitalForm, () => setEditHospital(null));

  const onUpdateTreatment = (v) =>
    updateRecord('treatments', editTreatment.id, {
      name: v.name,
      description: v.description,
      category: v.category || '',
      keywords: v.keywords || '',
      pricing: v.pricing || null,
      duration: v.duration || '',
      image: v.imageUrl
    }, editTreatmentForm, () => setEditTreatment(null));

  const onUpdateDoctor = (v) =>
    updateRecord('doctors', editDoctor.id, {
      name: v.name,
      hospital: v.hospital,
      specialty: (v.specialty || '').split(',').map((s) => s.trim()).filter(Boolean),
      bio: v.bio,
      image: v.imageUrl
    }, editDoctorForm, () => setEditDoctor(null));

  const onUpdateBlog = (v) =>
    updateRecord('blogs', editBlog.id, {
      title: v.title,
      excerpt: v.excerpt,
      content: v.content,
      imageUrl: v.imageUrl,
      publishedDate: v.publishedDate?.toISOString?.() || editBlog.publishedDate
    }, editBlogForm, () => setEditBlog(null));

  /* ----------------------------- Delete records ---------------------------- */
  const deleteRecord = async (col, id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, col, id));
      message.success(`${col.slice(0, -1)} deleted`);
      await loadCollection(
        col,
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, blogs: setBlogs }[col],
        col === 'blogs' ? setBlogLoading : setLoading
      );
    } catch (e) {
      console.error(e);
      message.error(`Error deleting ${col}`);
    }
    setLoading(false);
  };

  /* ---------------------------- Inquiry updates ---------------------------- */
  const updateInquiryStatus = async (inq, status) => {
    await updateDoc(doc(db, 'inquiries', inq.id), { status });
    message.success(`Marked as ${status}`);
    loadCollection('inquiries', setInquiries, setInqLoading);
  };
  const deleteInquiry = async (id) => {
    await deleteDoc(doc(db, 'inquiries', id));
    message.success('Inquiry deleted');
    loadCollection('inquiries', setInquiries, setInqLoading);
  };

  /* ----------------------------- Edit handlers ---------------------------- */
  const openEditHospital = (h) => {
    setEditHospital(h);
    editHospitalForm.setFieldsValue({
      name: h.name,
      city: h.city,
      country: h.country,
      specialties: (h.specialties || []).join(', '),
      imageUrl: h.image
    });
  };

  const openEditTreatment = (t) => {
    setEditTreatment(t);
    editTreatmentForm.setFieldsValue({
      name: t.name,
      description: t.description,
      category: t.category,
      keywords: t.keywords,
      pricing: t.pricing,
      duration: t.duration,
      imageUrl: t.image
    });
  };

  const openEditDoctor = (d) => {
    setEditDoctor(d);
    editDoctorForm.setFieldsValue({
      name: d.name,
      hospital: d.hospital,
      specialty: (d.specialty || []).join(', '),
      bio: d.bio,
      imageUrl: d.image
    });
  };

  const openEditBlog = (b) => {
    setEditBlog(b);
    editBlogForm.setFieldsValue({
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      imageUrl: b.imageUrl,
      publishedDate: b.publishedDate ? dayjs(b.publishedDate) : dayjs()
    });
  };

  /* -------------------------------- Tables -------------------------------- */
  const actionButtons = (record, onEdit, onDelete) => (
    <Space size="small">
      <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm title="Delete this item?" onConfirm={() => onDelete(record.id)}>
        <Button type="link" danger icon={<DeleteOutlined />}>
          Delete
        </Button>
      </Popconfirm>
    </Space>
  );

  const withThumb = (cols) => [
    {
      title: '',
      dataIndex: 'thumb',
      key: 'thumb',
      width: 56,
      render: (_, row) => {
        const src = getImageField(row);
        if (!src) return null;
        return (
          <div className="thumb">
            <img
              src={src}
              alt=""
              onError={(e) => {
                e.currentTarget.style.opacity = 0.3;
              }}
            />
          </div>
        );
      }
    },
    ...cols
  ];

  const hospitalCols = withThumb([
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    { title: 'Specialties', dataIndex: 'specialties', key: 'specialties', render: (arr) => (arr || []).map(mkTag) },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, row) => actionButtons(row, openEditHospital, () => deleteRecord('hospitals', row.id))
    }
  ]);

  const treatmentCols = withThumb([
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Pricing', dataIndex: 'pricing', key: 'pricing', render: (p) => p ? `$${p}` : '-' },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (txt) => (txt || '').length > 60 ? (txt || '').slice(0, 60) + '…' : (txt || '')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, row) => actionButtons(row, openEditTreatment, () => deleteRecord('treatments', row.id))
    }
  ]);

  const doctorCols = withThumb([
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Hospital', dataIndex: 'hospital', key: 'hospital' },
    { title: 'Specialty', dataIndex: 'specialty', key: 'specialty', render: (arr) => (arr || []).map(mkTag) },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" onClick={() => showDoctorModal(row)}>View</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditDoctor(row)}>Edit</Button>
          <Popconfirm title="Delete?" onConfirm={() => deleteRecord('doctors', row.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]);

  const inquiryCols = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'mobile', key: 'mobile' },
    { title: 'Condition', dataIndex: 'condition', key: 'condition' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        let color = 'gold',
          txt = s || 'New';
        if (txt === 'In Progress') color = 'blue';
        if (txt === 'Completed') color = 'green';
        return <Tag color={color}>{txt}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Space size="small">
          <Button type="link" onClick={() => showInquiryModal(row)}>View</Button>
          {!['In Progress', 'Completed'].includes(row.status || '') && (
            <Button type="link" onClick={() => updateInquiryStatus(row, 'In Progress')}>Contact</Button>
          )}
          {row.status === 'In Progress' && (
            <Button type="link" onClick={() => updateInquiryStatus(row, 'Completed')}>Complete</Button>
          )}
          <Popconfirm title="Delete?" onConfirm={() => deleteInquiry(row.id)}>
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const blogCols = withThumb([
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Date',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      render: (iso) => (iso ? new Date(iso).toLocaleDateString() : '-')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" onClick={() => showBlogModal(row)}>View</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditBlog(row)}>Edit</Button>
          <Popconfirm title="Delete?" onConfirm={() => deleteRecord('blogs', row.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]);

  /* ----------------------------- Quick filtering --------------------------- */
  const q = quickQuery.trim().toLowerCase();
  const filterByQuery = (arr, keys) => (!q ? arr : arr.filter((r) => keys.some((k) => String(r[k] || '').toLowerCase().includes(q))));

  const hospitalsV = useMemo(() => filterByQuery(hospitals, ['name', 'city', 'country']), [hospitals, q]);
  const treatmentsV = useMemo(() => filterByQuery(treatments, ['name', 'description', 'category']), [treatments, q]);
  const doctorsV = useMemo(() => filterByQuery(doctors, ['name', 'hospital']), [doctors, q]);
  const inquiriesV = useMemo(() => filterByQuery(inquiries, ['fullName', 'email', 'mobile', 'condition']), [inquiries, q]);
  const blogsV = useMemo(() => filterByQuery(blogs, ['title', 'excerpt', 'content']), [blogs, q]);

  /* ------------------------------ CSV Importer ---------------------------- */
  const templateFor = (col) => {
    switch (col) {
      case 'treatments':
        return ['name', 'description', 'category', 'keywords', 'pricing', 'duration', 'imageUrl'];
      case 'hospitals':
        return ['name', 'city', 'country', 'specialties', 'image'];
      case 'doctors':
        return ['name', 'hospital', 'specialty', 'bio', 'imageUrl'];
      case 'blogs':
        return ['title', 'excerpt', 'content', 'imageUrl', 'publishedDate'];
      default:
        return [];
    }
  };

  const handleCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors?.length) {
          console.error(errors[0]);
          message.error('CSV parse error. Check headers/rows.');
          setParsedRows([]);
          setImportValid(false);
          return;
        }
        const rows = data.map((r) =>
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), typeof v === 'string' ? v.trim() : v]))
        );
        setParsedRows(rows);
        const need = templateFor(importCollection);
        const have = Object.keys(rows[0] || {});
        const ok = need.every((n) => have.includes(n));
        setImportValid(ok && rows.length > 0);
        if (!ok) message.warning(`Missing columns. Required: ${need.join(', ')}`);
      }
    });
    return false;
  };

  const doImport = async () => {
    if (!importValid || parsedRows.length === 0) {
      message.error('Nothing to import');
      return;
    }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, importCollection);

      parsedRows.forEach((raw) => {
        const row = { ...raw };

        if (importCollection === 'hospitals') {
          if (row.specialties)
            row.specialties = row.specialties.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
          if (row.imageUrl && !row.image) {
            row.image = row.imageUrl;
            delete row.imageUrl;
          }
        }
        if (importCollection === 'treatments') {
          if (row.pricing) row.pricing = parseFloat(row.pricing) || null;
        }
        if (importCollection === 'doctors') {
          if (row.specialty)
            row.specialty = row.specialty.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
        }
        if (importCollection === 'blogs') {
          if (row.publishedDate) {
            const guess = row.publishedDate.includes('/') ? dayjs(row.publishedDate, 'DD/MM/YYYY') : dayjs(row.publishedDate);
            row.publishedDate = (guess.isValid() ? guess.toDate() : new Date()).toISOString();
          } else {
            row.publishedDate = new Date().toISOString();
          }
        }

        batch.set(doc(colRef), row);
      });

      await batch.commit();
      message.success(`Imported ${parsedRows.length} ${importCollection}`);
      await loadCollection(
        importCollection,
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, inquiries: setInquiries, blogs: setBlogs }[
          importCollection
        ],
        importCollection === 'blogs' ? setBlogLoading : importCollection === 'inquiries' ? setInqLoading : setLoading
      );
      setImportOpen(false);
      setParsedRows([]);
    } catch (e) {
      console.error(e);
      message.error('Import failed');
    }
    setLoading(false);
  };

  /* -------------------------------- Render -------------------------------- */
  return (
    <>
      <div className="admin-wrap">
        {/* Sticky topbar */}
        <Affix offsetTop={0}>
          <div className="admin-topbar">
            <div className="topbar-left">
              <DatabaseOutlined />
              <span>Admin Dashboard</span>
            </div>
            <div className="topbar-right">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Quick search"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="topbar-search"
              />
              <Button icon={<FileExcelOutlined />} onClick={() => setImportOpen(true)}>
                Bulk Import
              </Button>
            </div>
          </div>
        </Affix>

        <div className="admin-page">
          <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
            {/* Hospitals */}
            <TabPane tab="Hospitals" key="hospitals">
              <Card className="panel">
                <Typography.Title level={4}>Add Hospital</Typography.Title>
                <Form form={hospitalForm} layout="vertical" onFinish={onFinishHospital}>
                  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="city" label="City" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="specialties" label="Specialties" extra="Comma-separate">
                    <Input />
                  </Form.Item>
                  <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
                    <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
                  </Form.Item>
                  <Form.Item>
                    <CloudinaryUploadButton onUploaded={(url) => hospitalForm.setFieldsValue({ imageUrl: url })}>
                      Upload Image
                    </CloudinaryUploadButton>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                      Add Hospital
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card className="panel">
                <Table
                  dataSource={hospitalsV}
                  columns={hospitalCols}
                  rowKey="id"
                  pagination={PAGINATION}
                  loading={loading}
                />
              </Card>
            </TabPane>

            {/* Treatments */}
            <TabPane tab="Treatments" key="treatments">
              <Card className="panel">
                <Typography.Title level={4}>Add Treatment</Typography.Title>
                <Form form={treatmentForm} layout="vertical" onFinish={onFinishTreatment}>
                  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="category" label="Category">
                    <Input placeholder="e.g., Cardiology, Orthopedics" />
                  </Form.Item>
                  <Form.Item name="description" label="Description">
                    <TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="keywords" label="Keywords" extra="Comma-separated for search">
                    <Input placeholder="surgery, heart, bypass" />
                  </Form.Item>
                  <Form.Item name="pricing" label="Pricing (USD)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="5000" />
                  </Form.Item>
                  <Form.Item name="duration" label="Duration">
                    <Input placeholder="e.g., 2-3 hours, 1 week recovery" />
                  </Form.Item>
                  <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
                    <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
                  </Form.Item>
                  <Form.Item>
                    <CloudinaryUploadButton onUploaded={(url) => treatmentForm.setFieldsValue({ imageUrl: url })}>
                      Upload Image
                    </CloudinaryUploadButton>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                      Add Treatment
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card className="panel">
                <Table
                  dataSource={treatmentsV}
                  columns={treatmentCols}
                  rowKey="id"
                  pagination={PAGINATION}
                  loading={loading}
                />
              </Card>
            </TabPane>

            {/* Doctors */}
            <TabPane tab="Doctors" key="doctors">
              <Card className="panel">
                <Typography.Title level={4}>Add Doctor</Typography.Title>
                <Form form={doctorForm} layout="vertical" onFinish={onFinishDoctor}>
                  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input placeholder="Dr. Smith" />
                  </Form.Item>
                  <Form.Item name="hospital" label="Hospital" rules={[{ required: true }]}>
                    <Input placeholder="Apollo Hospital" />
                  </Form.Item>
                  <Form.Item name="specialty" label="Specialty" extra="Comma-separate">
                    <Input />
                  </Form.Item>
                  <Form.Item name="bio" label="Bio">
                    <TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
                    <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
                  </Form.Item>
                  <Form.Item>
                    <CloudinaryUploadButton onUploaded={(url) => doctorForm.setFieldsValue({ imageUrl: url })}>
                      Upload Image
                    </CloudinaryUploadButton>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                      Add Doctor
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card className="panel">
                <Table
                  dataSource={doctorsV}
                  columns={doctorCols}
                  rowKey="id"
                  pagination={PAGINATION}
                  loading={loading}
                />
              </Card>

              <Modal
                title="Doctor Details"
                open={docModalVisible}
                onCancel={closeDoctorModal}
                footer={[<Button key="close" onClick={closeDoctorModal}>Close</Button>]}
              >
                {selectedDoctor && (
                  <>
                    <p><strong>Name:</strong> {selectedDoctor.name}</p>
                    <p><strong>Hospital:</strong> {selectedDoctor.hospital}</p>
                    <p><strong>Specialty:</strong> {(selectedDoctor.specialty || []).join(', ')}</p>
                    <p><strong>Bio:</strong> {selectedDoctor.bio}</p>
                  </>
                )}
              </Modal>
            </TabPane>

            {/* Inquiries */}
            <TabPane tab="Inquiries" key="inquiries">
              <Card className="panel">
                <Table
                  dataSource={inquiriesV}
                  columns={inquiryCols}
                  rowKey="id"
                  pagination={PAGINATION}
                  loading={inqLoading}
                />
              </Card>
              <Modal
                title="Inquiry Details"
                open={inqModalVisible}
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
              <Card className="panel">
                <Typography.Title level={4}>Add Blog Post</Typography.Title>
                <Form form={blogForm} layout="vertical" onFinish={onFinishBlog}>
                  <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="excerpt" label="Excerpt" rules={[{ required: true }]}>
                    <TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                    <TextArea rows={6} />
                  </Form.Item>
                  <Form.Item name="imageUrl" label="Cover Image URL" rules={[{ required: true }]}>
                    <Input placeholder="https://res.cloudinary.com/.../cover.jpg" />
                  </Form.Item>
                  <Form.Item>
                    <CloudinaryUploadButton onUploaded={(url) => blogForm.setFieldsValue({ imageUrl: url })}>
                      Upload Cover
                    </CloudinaryUploadButton>
                  </Form.Item>
                  <Form.Item name="publishedDate" label="Publish Date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                      Add Blog Post
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card className="panel">
                <Table
                  dataSource={blogsV}
                  columns={blogCols}
                  rowKey="id"
                  pagination={PAGINATION}
                  loading={blogLoading}
                />
              </Card>

              <Modal
                title={selectedBlog?.title}
                open={blogModalVisible}
                onCancel={closeBlogModal}
                footer={[<Button key="close" onClick={closeBlogModal}>Close</Button>]}
                width={800}
              >
                {selectedBlog && (
                  <>
                    {selectedBlog.imageUrl && (
                      <img
                        src={selectedBlog.imageUrl}
                        alt={selectedBlog.title}
                        style={{ width: '100%', marginBottom: 16, borderRadius: 8 }}
                      />
                    )}
                    <p className="muted" style={{ marginBottom: 16 }}>
                      {selectedBlog.publishedDate ? new Date(selectedBlog.publishedDate).toLocaleDateString() : ''}
                    </p>
                    <div style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {selectedBlog.content}
                    </div>
                  </>
                )}
              </Modal>
            </TabPane>
          </Tabs>
        </div>
      </div>

      {/* Edit Hospital Modal */}
      <Modal
        title="Edit Hospital"
        open={!!editHospital}
        onCancel={() => setEditHospital(null)}
        footer={null}
        width={600}
      >
        <Form form={editHospitalForm} layout="vertical" onFinish={onUpdateHospital}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="specialties" label="Specialties" extra="Comma-separate">
            <Input />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
            <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
          </Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => editHospitalForm.setFieldsValue({ imageUrl: url })}>
              Upload Image
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Hospital
              </Button>
              <Button onClick={() => setEditHospital(null)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Treatment Modal */}
      <Modal
        title="Edit Treatment"
        open={!!editTreatment}
        onCancel={() => setEditTreatment(null)}
        footer={null}
        width={600}
      >
        <Form form={editTreatmentForm} layout="vertical" onFinish={onUpdateTreatment}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input placeholder="e.g., Cardiology, Orthopedics" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="keywords" label="Keywords" extra="Comma-separated for search">
            <Input placeholder="surgery, heart, bypass" />
          </Form.Item>
          <Form.Item name="pricing" label="Pricing (USD)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="5000" />
          </Form.Item>
          <Form.Item name="duration" label="Duration">
            <Input placeholder="e.g., 2-3 hours, 1 week recovery" />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
            <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
          </Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => editTreatmentForm.setFieldsValue({ imageUrl: url })}>
              Upload Image
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Treatment
              </Button>
              <Button onClick={() => setEditTreatment(null)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        title="Edit Doctor"
        open={!!editDoctor}
        onCancel={() => setEditDoctor(null)}
        footer={null}
        width={600}
      >
        <Form form={editDoctorForm} layout="vertical" onFinish={onUpdateDoctor}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Dr. Smith" />
          </Form.Item>
          <Form.Item name="hospital" label="Hospital" rules={[{ required: true }]}>
            <Input placeholder="Apollo Hospital" />
          </Form.Item>
          <Form.Item name="specialty" label="Specialty" extra="Comma-separate">
            <Input />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
            <Input placeholder="https://res.cloudinary.com/.../image.jpg" />
          </Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => editDoctorForm.setFieldsValue({ imageUrl: url })}>
              Upload Image
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Doctor
              </Button>
              <Button onClick={() => setEditDoctor(null)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Blog Modal */}
      <Modal
        title="Edit Blog Post"
        open={!!editBlog}
        onCancel={() => setEditBlog(null)}
        footer={null}
        width={700}
      >
        <Form form={editBlogForm} layout="vertical" onFinish={onUpdateBlog}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="excerpt" label="Excerpt" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Cover Image URL" rules={[{ required: true }]}>
            <Input placeholder="https://res.cloudinary.com/.../cover.jpg" />
          </Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => editBlogForm.setFieldsValue({ imageUrl: url })}>
              Upload Cover
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item name="publishedDate" label="Publish Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Blog Post
              </Button>
              <Button onClick={() => setEditBlog(null)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Import Drawer */}
      <Drawer
        title="Bulk Import (CSV)"
        placement="right"
        width={Math.min(420, window.innerWidth * 0.92)}
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setParsedRows([]);
          setImportValid(false);
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Paragraph>
            Select a collection and upload a CSV file with the required headers.
          </Typography.Paragraph>

          <Select
            value={importCollection}
            onChange={(v) => {
              setImportCollection(v);
              setParsedRows([]);
              setImportValid(false);
            }}
            style={{ width: '100%' }}
            options={[
              { label: 'Treatments', value: 'treatments' },
              { label: 'Hospitals', value: 'hospitals' },
              { label: 'Doctors', value: 'doctors' },
              { label: 'Blogs', value: 'blogs' }
            ]}
          />

          <div className="csv-template">
            <strong>Required columns:</strong>
            <div className="mono">{templateFor(importCollection).join(', ')}</div>
          </div>

          <Dragger accept=".csv" beforeUpload={handleCSV} multiple={false} maxCount={1} showUploadList>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag CSV file here to upload</p>
            <p className="ant-upload-hint">We'll parse and show a preview before import.</p>
          </Dragger>

          {parsedRows.length > 0 && (
            <>
              <Divider />
              <Typography.Text strong>Preview ({parsedRows.length})</Typography.Text>
              <div className="preview-table">
                <Table
                  size="small"
                  dataSource={parsedRows.slice(0, 10).map((r, i) => ({ ...r, _k: i }))}
                  columns={Object.keys(parsedRows[0]).map((k) => ({ title: k, dataIndex: k }))}
                  rowKey="_k"
                  pagination={false}
                  scroll={{ x: true }}
                />
                {parsedRows.length > 10 && <div className="muted">Showing first 10 rows…</div>}
              </div>

              <Button type="primary" block disabled={!importValid} onClick={doImport} icon={<UploadOutlined />}>
                Import {parsedRows.length} to "{importCollection}"
              </Button>
            </>
          )}
        </Space>
      </Drawer>
    </>
  );
}