// src/pages/Admin.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layout, Menu, Form, Input, Button, DatePicker, message, Table, Modal, Tag,
  Popconfirm, Upload, Space, Drawer, Select, Divider, Typography, Card, InputNumber, Empty
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

/* ======================== TipTap (React 19 friendly) ======================= */
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';

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

/* ------------------------------ Rich Editor --------------------------------
   Stores/returns clean HTML like the old Quill-based one. */
function RichEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'tt-editor',
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // sync external value into editor (e.g., when opening edit modal)
  React.useEffect(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (value != null && value !== html) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const run = (fn) => editor.chain().focus()[fn]().run();

  return (
    <div className="tt-wrapper">
      <div className="tt-toolbar">
        <button
          type="button"
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => run('toggleBold')}
        >
          B
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'active' : ''}
          onClick={() => run('toggleItalic')}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => run('toggleBulletList')}
          className={editor.isActive('bulletList') ? 'active' : ''}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => run('toggleOrderedList')}
          className={editor.isActive('orderedList') ? 'active' : ''}
        >
          1. List
        </button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}>
          P
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive('heading', { level: 4 }) ? 'active' : ''}
        >
          H4
        </button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !value && <div className="tt-placeholder">{placeholder}</div>}
    </div>
  );
}

/* --------------------------- Cost & Procedures UI -------------------------- */
function CostEditor({ value = [], onChange }) {
  const [rows, setRows] = useState(value);
  useEffect(() => { setRows(value || []); }, [value]);

  const update = (idx, key, v) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: v } : r));
    setRows(next); onChange?.(next);
  };
  const addRow = () => {
    const next = [...rows, { item: '', min: null, max: null, notes: '' }];
    setRows(next); onChange?.(next);
  };
  const remove = (idx) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next); onChange?.(next);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {rows.map((r, i) => (
        <div key={i} className="cost-row">
          <Input placeholder="Item" value={r.item} onChange={(e) => update(i, 'item', e.target.value)} style={{ flex: 2 }} />
          <Input placeholder="Min" type="number" value={r.min ?? ''} onChange={(e) => update(i, 'min', e.target.value ? Number(e.target.value) : null)} style={{ flex: 1 }} />
          <Input placeholder="Max" type="number" value={r.max ?? ''} onChange={(e) => update(i, 'max', e.target.value ? Number(e.target.value) : null)} style={{ flex: 1 }} />
          <Input placeholder="Notes" value={r.notes} onChange={(e) => update(i, 'notes', e.target.value)} style={{ flex: 2 }} />
          <Button danger onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <Button onClick={addRow} icon={<PlusOutlined />}>Add row</Button>
    </Space>
  );
}

function ProceduresEditor({ value = [], onChange }) {
  const [items, setItems] = useState(value);
  const [draft, setDraft] = useState('');
  useEffect(() => { setItems(value || []); }, [value]);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    const next = [...items, v];
    setItems(next); setDraft(''); onChange?.(next);
  };
  const remove = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next); onChange?.(next);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a procedure" />
        <Button type="primary" onClick={add}>Add</Button>
      </Space.Compact>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((p, i) => (
          <Tag key={i} closable onClose={() => remove(i)}>{p}</Tag>
        ))}
      </div>
    </Space>
  );
}

/* ================================= Page =================================== */
const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function Admin() {
  const [active, setActive] = useState('hospitals'); // sidebar nav
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

  // Quick search
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

  /* ----------------------------- Create records ---------------------------- */
  const submitToCollection = async (col, data, clearFn, setLoader = setLoading) => {
    setLoader(true);
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
    setLoader(false);
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
      description: v.description || '',
      descriptionHtml: v.descriptionHtml || '',
      whyChooseHtml: v.whyChooseHtml || '',
      costRows: Array.isArray(v.costRows) ? v.costRows : [],
      procedures: Array.isArray(v.procedures) ? v.procedures : [],
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
      () => blogForm.resetFields(),
      setBlogLoading
    );

  /* ----------------------------- Update records ---------------------------- */
  const updateRecord = async (col, id, data, form, closeFn, setLoader = setLoading) => {
    setLoader(true);
    try {
      await updateDoc(doc(db, col, id), data);
      message.success(`${col.slice(0, -1)} updated`);
      closeFn?.();
      form?.resetFields?.();
      await loadCollection(
        col,
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, blogs: setBlogs }[col],
        col === 'blogs' ? setBlogLoading : setLoading
      );
    } catch (e) {
      console.error(e);
      message.error(`Error updating ${col}`);
    }
    setLoader(false);
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
      description: v.description || '',
      descriptionHtml: v.descriptionHtml || '',
      whyChooseHtml: v.whyChooseHtml || '',
      costRows: Array.isArray(v.costRows) ? v.costRows : [],
      procedures: Array.isArray(v.procedures) ? v.procedures : [],
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
    }, editBlogForm, () => setEditBlog(null), setBlogLoading);

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
      name: h.name, city: h.city, country: h.country,
      specialties: (h.specialties || []).join(', '),
      imageUrl: h.image
    });
  };

  const openEditTreatment = (t) => {
    setEditTreatment(t);
    editTreatmentForm.setFieldsValue({
      name: t.name,
      description: t.description || '',
      descriptionHtml: t.descriptionHtml || '',
      whyChooseHtml: t.whyChooseHtml || '',
      costRows: t.costRows || [],
      procedures: t.procedures || [],
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

  /* ------------------------------ Tables ---------------------------------- */
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
              onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
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
      render: (_, row) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditHospital(row)}>Edit</Button>
          <Popconfirm title="Delete this hospital?" onConfirm={() => deleteRecord('hospitals', row.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]);

  const treatmentCols = withThumb([
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
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
      render: (_, row) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditTreatment(row)}>Edit</Button>
          <Popconfirm title="Delete this treatment?" onConfirm={() => deleteRecord('treatments', row.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]);

  const doctorCols = withThumb([
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Hospital', dataIndex: 'hospital', key: 'hospital' },
    { title: 'Specialty', dataIndex: 'specialty', key: 'specialty', render: (arr) => (arr || []).map(mkTag) },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" onClick={() => { setSelectedDoctor(row); setDocModalVisible(true); }}>View</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditDoctor(row)}>Edit</Button>
          <Popconfirm title="Delete this doctor?" onConfirm={() => deleteRecord('doctors', row.id)}>
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
        let color = 'gold', txt = s || 'New';
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
          <Button type="link" onClick={() => { setSelectedInquiry(row); setInqModalVisible(true); }}>View</Button>
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
          <Button type="link" onClick={() => { setSelectedBlog(row); setBlogModalVisible(true); }}>View</Button>
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
  const treatmentsV = useMemo(() => filterByQuery(treatments, ['name', 'description', 'category', 'keywords']), [treatments, q]);
  const doctorsV = useMemo(() => filterByQuery(doctors, ['name', 'hospital']), [doctors, q]);
  const inquiriesV = useMemo(() => filterByQuery(inquiries, ['fullName', 'email', 'mobile', 'condition']), [inquiries, q]);
  const blogsV = useMemo(() => filterByQuery(blogs, ['title', 'excerpt', 'content']), [blogs, q]);

  /* ------------------------------ CSV Importer ---------------------------- */
  const templateFor = (col) => {
    switch (col) {
      case 'treatments': return ['name', 'description', 'category', 'keywords', 'pricing', 'duration', 'imageUrl'];
      case 'hospitals':  return ['name', 'city', 'country', 'specialties', 'image'];
      case 'doctors':    return ['name', 'hospital', 'specialty', 'bio', 'imageUrl'];
      case 'blogs':      return ['title', 'excerpt', 'content', 'imageUrl', 'publishedDate'];
      default: return [];
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
          setParsedRows([]); setImportValid(false); return;
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
      message.error('Nothing to import'); return;
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
            row.image = row.imageUrl; delete row.imageUrl;
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
            const guess = row.publishedDate.includes('/')
              ? dayjs(row.publishedDate, 'DD/MM/YYYY')
              : dayjs(row.publishedDate);
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
        { hospitals: setHospitals, treatments: setTreatments, doctors: setDoctors, inquiries: setInquiries, blogs: setBlogs }[importCollection],
        importCollection === 'blogs' ? setBlogLoading : importCollection === 'inquiries' ? setInqLoading : setLoading
      );
      setImportOpen(false); setParsedRows([]); setImportValid(false);
    } catch (e) {
      console.error(e);
      message.error('Import failed');
    }
    setLoading(false);
  };

  /* -------------------------------- Sections UI --------------------------- */
  const SectionHeader = ({ title }) => (
    <div className="panel" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Quick search"
        value={quickQuery}
        onChange={(e) => setQuickQuery(e.target.value)}
        className="topbar-search"
      />
    </div>
  );

  const HospitalsSection = () => (
    <>
      <SectionHeader title="Hospitals" />
      <Card className="panel">
        <Typography.Title level={4}>Add Hospital</Typography.Title>
        <Form form={hospitalForm} layout="vertical" onFinish={onFinishHospital}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialties" label="Specialties" extra="Comma-separate"><Input /></Form.Item>
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
        <Table dataSource={hospitalsV} columns={hospitalCols} rowKey="id" pagination={PAGINATION} loading={loading} />
      </Card>
    </>
  );

  const TreatmentsSection = () => (
    <>
      <SectionHeader title="Treatments" />
    <Card className="panel">
      <Typography.Title level={4}>Add Treatment</Typography.Title>
      <Form form={treatmentForm} layout="vertical" onFinish={onFinishTreatment}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="category" label="Category"><Input placeholder="e.g., Cardiology, Orthopedics" /></Form.Item>

        <Form.Item label="Description (rich)">
          <RichEditor
            value={Form.useWatch('descriptionHtml', treatmentForm)}
            onChange={(html) => treatmentForm.setFieldsValue({ descriptionHtml: html })}
            placeholder="Write an overview, preparation, recovery…"
          />
        </Form.Item>
        <Form.Item name="descriptionHtml" hidden><Input /></Form.Item>

        <Form.Item label="Why choose (rich)">
          <RichEditor
            value={Form.useWatch('whyChooseHtml', treatmentForm)}
            onChange={(html) => treatmentForm.setFieldsValue({ whyChooseHtml: html })}
            placeholder="Why this procedure, outcomes, hospital strengths…"
          />
        </Form.Item>
        <Form.Item name="whyChooseHtml" hidden><Input /></Form.Item>

        <Form.Item label="Costing table">
          <CostEditor
            value={Form.useWatch('costRows', treatmentForm)}
            onChange={(rows) => treatmentForm.setFieldsValue({ costRows: rows })}
          />
        </Form.Item>
        <Form.Item name="costRows" hidden><Input /></Form.Item>

        <Form.Item label="Procedures list">
          <ProceduresEditor
            value={Form.useWatch('procedures', treatmentForm)}
            onChange={(arr) => treatmentForm.setFieldsValue({ procedures: arr })}
          />
        </Form.Item>
        <Form.Item name="procedures" hidden><Input /></Form.Item>

        <Form.Item name="keywords" label="Keywords" extra="Comma-separated for search">
          <Input placeholder="surgery, heart, bypass" />
        </Form.Item>
        <Form.Item name="pricing" label="(Optional) Legacy pricing (USD)">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="5000" />
        </Form.Item>
        <Form.Item name="duration" label="Duration"><Input placeholder="e.g., 2–3 hours, 1 week recovery" /></Form.Item>

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
        <Table dataSource={treatmentsV} columns={treatmentCols} rowKey="id" pagination={PAGINATION} loading={loading} />
      </Card>
    </>
  );

  const DoctorsSection = () => (
    <>
      <SectionHeader title="Doctors" />
      <Card className="panel">
        <Typography.Title level={4}>Add Doctor</Typography.Title>
        <Form form={doctorForm} layout="vertical" onFinish={onFinishDoctor}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="Dr. Smith" /></Form.Item>
          <Form.Item name="hospital" label="Hospital" rules={[{ required: true }]}><Input placeholder="Apollo Hospital" /></Form.Item>
          <Form.Item name="specialty" label="Specialty" extra="Comma-separate"><Input /></Form.Item>
          <Form.Item name="bio" label="Bio"><TextArea rows={2} /></Form.Item>
          <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../image.jpg" /></Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => doctorForm.setFieldsValue({ imageUrl: url })}>
              Upload Image
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>Add Doctor</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="panel">
        <Table dataSource={doctorsV} columns={doctorCols} rowKey="id" pagination={PAGINATION} loading={loading} />
      </Card>

      <Modal
        title="Doctor Details"
        open={docModalVisible}
        onCancel={() => setDocModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDocModalVisible(false)}>Close</Button>]}
      >
        {selectedDoctor ? (
          <>
            <p><strong>Name:</strong> {selectedDoctor.name}</p>
            <p><strong>Hospital:</strong> {selectedDoctor.hospital}</p>
            <p><strong>Specialty:</strong> {(selectedDoctor.specialty || []).join(', ')}</p>
            <p><strong>Bio:</strong> {selectedDoctor.bio}</p>
          </>
        ) : <Empty description="No doctor selected" />}
      </Modal>
    </>
  );

  const InquiriesSection = () => (
    <>
      <SectionHeader title="Inquiries" />
      <Card className="panel">
        <Table dataSource={inquiriesV} columns={inquiryCols} rowKey="id" pagination={PAGINATION} loading={inqLoading} />
      </Card>

      <Modal
        title="Inquiry Details"
        open={inqModalVisible}
        onCancel={() => setInqModalVisible(false)}
        footer={[<Button key="close" onClick={() => setInqModalVisible(false)}>Close</Button>]}
      >
        {selectedInquiry ? (
          <>
            <p><strong>Name:</strong> {selectedInquiry.fullName}</p>
            <p><strong>Email:</strong> {selectedInquiry.email}</p>
            <p><strong>Phone:</strong> {selectedInquiry.mobile}</p>
            <p><strong>Condition:</strong> {selectedInquiry.condition}</p>
            <p><strong>Status:</strong> {selectedInquiry.status || 'New'}</p>
          </>
        ) : <Empty description="No inquiry selected" />}
      </Modal>
    </>
  );

  const BlogsSection = () => (
    <>
      <SectionHeader title="Blogs" />
      <Card className="panel">
        <Typography.Title level={4}>Add Blog Post</Typography.Title>
        <Form form={blogForm} layout="vertical" onFinish={onFinishBlog}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="excerpt" label="Excerpt" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}><TextArea rows={6} /></Form.Item>
          <Form.Item name="imageUrl" label="Cover Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../cover.jpg" /></Form.Item>
          <Form.Item>
            <CloudinaryUploadButton onUploaded={(url) => blogForm.setFieldsValue({ imageUrl: url })}>
              Upload Cover
            </CloudinaryUploadButton>
          </Form.Item>
          <Form.Item name="publishedDate" label="Publish Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={blogLoading}>Add Blog Post</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="panel">
        <Table dataSource={blogsV} columns={blogCols} rowKey="id" pagination={PAGINATION} loading={blogLoading} />
      </Card>

      <Modal
        title={selectedBlog?.title || 'Blog'}
        open={blogModalVisible}
        onCancel={() => setBlogModalVisible(false)}
        footer={[<Button key="close" onClick={() => setBlogModalVisible(false)}>Close</Button>]}
        width={800}
      >
        {selectedBlog ? (
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
        ) : <Empty description="No blog selected" />}
      </Modal>
    </>
  );

  /* ------------------------------- Edit Modals ----------------------------- */
  const EditHospitalModal = () => (
    <Modal title="Edit Hospital" open={!!editHospital} onCancel={() => setEditHospital(null)} footer={null} width={600}>
      <Form form={editHospitalForm} layout="vertical" onFinish={onUpdateHospital}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="specialties" label="Specialties" extra="Comma-separate"><Input /></Form.Item>
        <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../image.jpg" /></Form.Item>
        <Form.Item>
          <CloudinaryUploadButton onUploaded={(url) => editHospitalForm.setFieldsValue({ imageUrl: url })}>
            Upload Image
          </CloudinaryUploadButton>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Update Hospital</Button>
            <Button onClick={() => setEditHospital(null)}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  const EditTreatmentModal = () => (
    <Modal title="Edit Treatment" open={!!editTreatment} onCancel={() => setEditTreatment(null)} footer={null} width={820}>
      <Form form={editTreatmentForm} layout="vertical" onFinish={onUpdateTreatment}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="category" label="Category"><Input placeholder="e.g., Cardiology, Orthopedics" /></Form.Item>

        <Form.Item label="Description (rich)">
          <RichEditor
            value={Form.useWatch('descriptionHtml', editTreatmentForm)}
            onChange={(html) => editTreatmentForm.setFieldsValue({ descriptionHtml: html })}
            placeholder="Overview, preparation, recovery…"
          />
        </Form.Item>
        <Form.Item name="descriptionHtml" hidden><Input /></Form.Item>

        <Form.Item label="Why choose (rich)">
          <RichEditor
            value={Form.useWatch('whyChooseHtml', editTreatmentForm)}
            onChange={(html) => editTreatmentForm.setFieldsValue({ whyChooseHtml: html })}
            placeholder="Reasons to choose, outcomes, strengths…"
          />
        </Form.Item>
        <Form.Item name="whyChooseHtml" hidden><Input /></Form.Item>

        <Form.Item label="Costing table">
          <CostEditor
            value={Form.useWatch('costRows', editTreatmentForm)}
            onChange={(rows) => editTreatmentForm.setFieldsValue({ costRows: rows })}
          />
        </Form.Item>
        <Form.Item name="costRows" hidden><Input /></Form.Item>

        <Form.Item label="Procedures list">
          <ProceduresEditor
            value={Form.useWatch('procedures', editTreatmentForm)}
            onChange={(arr) => editTreatmentForm.setFieldsValue({ procedures: arr })}
          />
        </Form.Item>
        <Form.Item name="procedures" hidden><Input /></Form.Item>

        <Form.Item name="keywords" label="Keywords" extra="Comma-separated for search">
          <Input placeholder="surgery, heart, bypass" />
        </Form.Item>
        <Form.Item name="pricing" label="(Optional) Legacy pricing (USD)"><InputNumber min={0} style={{ width: '100%' }} placeholder="5000" /></Form.Item>
        <Form.Item name="duration" label="Duration"><Input placeholder="e.g., 2–3 hours, 1 week recovery" /></Form.Item>

        <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../image.jpg" /></Form.Item>
        <Form.Item>
          <CloudinaryUploadButton onUploaded={(url) => editTreatmentForm.setFieldsValue({ imageUrl: url })}>
            Upload Image
          </CloudinaryUploadButton>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Update Treatment</Button>
            <Button onClick={() => setEditTreatment(null)}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  const EditDoctorModal = () => (
    <Modal title="Edit Doctor" open={!!editDoctor} onCancel={() => setEditDoctor(null)} footer={null} width={600}>
      <Form form={editDoctorForm} layout="vertical" onFinish={onUpdateDoctor}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="Dr. Smith" /></Form.Item>
        <Form.Item name="hospital" label="Hospital" rules={[{ required: true }]}><Input placeholder="Apollo Hospital" /></Form.Item>
        <Form.Item name="specialty" label="Specialty" extra="Comma-separate"><Input /></Form.Item>
        <Form.Item name="bio" label="Bio"><TextArea rows={2} /></Form.Item>
        <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../image.jpg" /></Form.Item>
        <Form.Item>
          <CloudinaryUploadButton onUploaded={(url) => editDoctorForm.setFieldsValue({ imageUrl: url })}>
            Upload Image
          </CloudinaryUploadButton>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Update Doctor</Button>
            <Button onClick={() => setEditDoctor(null)}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  const EditBlogModal = () => (
    <Modal title="Edit Blog Post" open={!!editBlog} onCancel={() => setEditBlog(null)} footer={null} width={700}>
      <Form form={editBlogForm} layout="vertical" onFinish={onUpdateBlog}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="excerpt" label="Excerpt" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
        <Form.Item name="content" label="Content" rules={[{ required: true }]}><TextArea rows={6} /></Form.Item>
        <Form.Item name="imageUrl" label="Cover Image URL" rules={[{ required: true }]}><Input placeholder="https://res.cloudinary.com/.../cover.jpg" /></Form.Item>
        <Form.Item>
          <CloudinaryUploadButton onUploaded={(url) => editBlogForm.setFieldsValue({ imageUrl: url })}>
            Upload Cover
          </CloudinaryUploadButton>
        </Form.Item>
        <Form.Item name="publishedDate" label="Publish Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={blogLoading}>Update Blog Post</Button>
            <Button onClick={() => setEditBlog(null)}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  /* ------------------------------- Main Render ----------------------------- */
  return (
    <Layout className="admin-wrap" style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ borderRight: '1px solid var(--hair)' }}>
        <div className="admin-topbar" style={{ position: 'static', borderBottom: 'none', background: 'transparent', padding: 16 }}>
          <div className="topbar-left" style={{ fontSize: 16 }}>
            <DatabaseOutlined />
            <span>Admin</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[active]}
          onClick={(e) => setActive(e.key)}
          items={[
            { key: 'hospitals', label: 'Hospitals' },
            { key: 'treatments', label: 'Treatments' },
            { key: 'doctors', label: 'Doctors' },
            { key: 'inquiries', label: 'Inquiries' },
            { key: 'blogs', label: 'Blogs' },
            { type: 'divider' },
            { key: 'import', label: 'Bulk Import', icon: <FileExcelOutlined /> },
          ]}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Content className="admin-page">
          {active === 'hospitals' && <HospitalsSection />}
          {active === 'treatments' && <TreatmentsSection />}
          {active === 'doctors' && <DoctorsSection />}
          {active === 'inquiries' && <InquiriesSection />}
          {active === 'blogs' && <BlogsSection />}

          {active === 'import' && (
            <Card className="panel">
              <Typography.Title level={4}>Bulk Import (CSV)</Typography.Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Paragraph>
                  Select a collection and upload a CSV file with the required headers.
                </Typography.Paragraph>

                <Select
                  value={importCollection}
                  onChange={(v) => { setImportCollection(v); setParsedRows([]); setImportValid(false); }}
                  style={{ width: 280 }}
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
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">Click or drag CSV file here to upload</p>
                  <p className="ant-upload-hint">We’ll parse and show a preview before import.</p>
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

                    <Button type="primary" disabled={!importValid} onClick={doImport} icon={<UploadOutlined />}>
                      Import {parsedRows.length} to “{importCollection}”
                    </Button>
                  </>
                )}
              </Space>
            </Card>
          )}
        </Content>
      </Layout>

      {/* Edit Modals */}
      <EditHospitalModal />
      <EditTreatmentModal />
      <EditDoctorModal />
      <EditBlogModal />
    </Layout>
  );
}
