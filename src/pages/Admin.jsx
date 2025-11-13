// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
  Form,
  Grid,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/Admin.css";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const emptyHospital = {
  name: "",
  city: "",
  country: "",
  phone: "",
  imageUrl: "",
  description: "",
  about: "",
  facilities: [],
  departments: [],
  doctors: [],
};

const emptyTreatment = {
  title: "",
  imageUrl: "",
  description: "",
  procedures: "",
  costing: [],
};

const useCommonTableProps = () => ({
  size: "small",
  scroll: { x: 800 },
  pagination: { pageSize: 8, showSizeChanger: false },
});

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary env vars missing");
  }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

function MobileHeader({ title, extra }) {
  return (
    <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
      <Space wrap>{extra}</Space>
    </Flex>
  );
}

const ImageUpload = ({ value, onChange, setLoading }) => (
  <Flex gap={8} align="center" wrap>
    <Upload
      showUploadList={false}
      accept="image/*"
      beforeUpload={() => false}
      onChange={async ({ file }) => {
        if (!file) return;
        try {
          setLoading?.(true);
          const url = await uploadToCloudinary(file);
          onChange?.(url);
        } catch (e) {
          message.error("Image upload failed. Check Cloudinary env or paste URL.");
        } finally {
          setLoading?.(false);
        }
      }}
    >
      <Button icon={<UploadOutlined />}>Upload</Button>
    </Upload>
    {value && (
      <Image
        src={value}
        width={56}
        height={56}
        style={{ objectFit: "cover", borderRadius: 8 }}
      />
    )}
    <Input
      placeholder="or paste image URL"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ maxWidth: 320 }}
      allowClear
    />
  </Flex>
);

export default function Admin({ db }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [modal, modalContextHolder] = Modal.useModal();
  const [hospitalForm] = Form.useForm();
  const [treatmentForm] = Form.useForm();

  const [hospitals, setHospitals] = useState([]);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalUploading, setHospitalUploading] = useState(false);

  const [treatments, setTreatments] = useState([]);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [treatmentUploading, setTreatmentUploading] = useState(false);

  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    if (!db) return;

    const unsubHosp = onSnapshot(
      query(collection(db, "hospitals"), orderBy("createdAt", "desc")),
      (snap) => setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubTrt = onSnapshot(
      query(collection(db, "treatments"), orderBy("createdAt", "desc")),
      (snap) => setTreatments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubEnq = onSnapshot(
      query(collection(db, "enquiries"), orderBy("createdAt", "desc")),
      (snap) => setEnquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubHosp?.();
      unsubTrt?.();
      unsubEnq?.();
    };
  }, [db]);

  // ---------- HOSPITALS ----------
  const handleHospitalSubmit = async (values) => {
    if (!db) {
      message.error("Firestore not ready");
      return;
    }
    const payload = {
      ...values,
      facilities: (values.facilities || []).filter(Boolean),
      departments: (values.departments || []).filter(Boolean),
      doctors: (values.doctors || []).filter(
        (d) => d && (d.name || d.specialty)
      ),
    };

    try {
      if (editingHospital) {
        await updateDoc(doc(db, "hospitals", editingHospital.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        message.success("Hospital updated");
      } else {
        await addDoc(collection(db, "hospitals"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        message.success("Hospital added");
      }
      setEditingHospital(null);
      hospitalForm.resetFields();
    } catch (e) {
      console.error(e);
      message.error("Failed to save hospital");
    }
  };

  const hospitalColumns = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 90,
      render: (src) =>
        src ? (
          <div className="thumb">
            <img src={src} alt="hospital" />
          </div>
        ) : (
          <Tag>None</Tag>
        ),
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "Country", dataIndex: "country", key: "country" },
    { title: "Phone", dataIndex: "phone", key: "phone", responsive: ["md"] },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview" getPopupContainer={() => document.body}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                modal.info({
                  title: record.name,
                  width: 800,
                  content: (
                    <div style={{ maxHeight: 420, overflow: "auto" }}>
                      {record.imageUrl && (
                        <Image
                          src={record.imageUrl}
                          alt="preview"
                          width={220}
                          style={{ borderRadius: 8, marginBottom: 12 }}
                        />
                      )}

                      <p>
                        <b>Location:</b> {record.city}, {record.country}
                      </p>
                      {record.phone && (
                        <p>
                          <b>Phone:</b> {record.phone}
                        </p>
                      )}

                      {record.description && (
                        <>
                          <Title level={5}>Short Description</Title>
                          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {record.description}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}

                      {record.about && (
                        <>
                          <Title level={5}>About</Title>
                          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {record.about}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}

                      {!!record.facilities?.length && (
                        <>
                          <Title level={5}>Facilities</Title>
                          <ul>
                            {record.facilities.map((f, i) => (
                              <li key={i}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {f}
                                </ReactMarkdown>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {!!record.departments?.length && (
                        <>
                          <Title level={5}>Departments</Title>
                          <ul>
                            {record.departments.map((dpt, i) => (
                              <li key={i}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {dpt}
                                </ReactMarkdown>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {!!record.doctors?.length && (
                        <>
                          <Title level={5}>Doctors</Title>
                          <ul>
                            {record.doctors.map((d, i) => {
                              const text = `${d.name || ""}${
                                d.specialty ? ` — ${d.specialty}` : ""
                              }`;
                              return (
                                <li key={i}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {text}
                                  </ReactMarkdown>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  ),
                })
              }
            />
          </Tooltip>
          <Tooltip title="Edit" getPopupContainer={() => document.body}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingHospital(record);
                hospitalForm.setFieldsValue({ ...emptyHospital, ...record });
                document
                  .getElementById("hospital-form-card")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete hospital?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await deleteDoc(doc(db, "hospitals", record.id));
                message.success("Deleted");
              } catch {
                message.error("Failed to delete");
              }
            }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------- TREATMENTS ----------
  const handleTreatmentSubmit = async (values) => {
    if (!db) {
      message.error("Firestore not ready");
      return;
    }
    const payload = {
      ...values,
      costing: values.costing?.filter((r) => r && (r.label || r.price)) ?? [],
    };

    try {
      if (editingTreatment) {
        await updateDoc(doc(db, "treatments", editingTreatment.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        message.success("Treatment updated");
      } else {
        await addDoc(collection(db, "treatments"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        message.success("Treatment added");
      }
      setEditingTreatment(null);
      treatmentForm.resetFields();
    } catch (e) {
      console.error(e);
      message.error("Failed to save treatment");
    }
  };

  const treatmentColumns = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 90,
      render: (src) =>
        src ? (
          <div className="thumb">
            <img src={src} alt="treatment" />
          </div>
        ) : (
          <Tag>None</Tag>
        ),
    },
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview" getPopupContainer={() => document.body}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                modal.info({
                  title: record.title,
                  width: 800,
                  content: (
                    <div style={{ maxHeight: 420, overflow: "auto" }}>
                      {record.imageUrl && (
                        <Image
                          src={record.imageUrl}
                          alt="preview"
                          width={220}
                          style={{ borderRadius: 8, marginBottom: 12 }}
                        />
                      )}

                      {record.description && (
                        <>
                          <Title level={5}>Description</Title>
                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.7,
                              color: "#4b5563",
                            }}
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {record.description}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}

                      {record.procedures && (
                        <>
                          <Title level={5}>Procedures</Title>
                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.7,
                              color: "#4b5563",
                            }}
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {record.procedures}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}

                      {!!record.costing?.length && (
                        <>
                          <Title level={5}>Costing</Title>
                          <Table
                            size="small"
                            rowKey={(r, i) => `${r.label}-${i}`}
                            dataSource={record.costing}
                            columns={[
                              { title: "Item", dataIndex: "label" },
                              { title: "Price", dataIndex: "price" },
                            ]}
                            pagination={false}
                          />
                        </>
                      )}
                    </div>
                  ),
                })
              }
            />
          </Tooltip>
          <Tooltip title="Edit" getPopupContainer={() => document.body}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingTreatment(record);
                treatmentForm.setFieldsValue({ ...emptyTreatment, ...record });
                document
                  .getElementById("treatment-form-card")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete treatment?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await deleteDoc(doc(db, "treatments", record.id));
                message.success("Deleted");
              } catch {
                message.error("Failed to delete");
              }
            }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------- ENQUIRIES ----------
  const enquiryColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      responsive: ["md"],
      render: (v) => (
        <Text ellipsis style={{ maxWidth: 260 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "—"),
    },
  ];

  // ---------- TAB CONTENT ----------
  const HospitalsTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={10}>
        <Card
          id="hospital-form-card"
          className="panel"
          title={
            <MobileHeader
              title={editingHospital ? "Edit Hospital" : "Add Hospital"}
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setEditingHospital(null);
                    hospitalForm.resetFields();
                  }}
                />
              }
            />
          }
        >
          <Form
            layout="vertical"
            form={hospitalForm}
            initialValues={emptyHospital}
            onFinish={handleHospitalSubmit}
          >
            <Form.Item
              name="name"
              label="Hospital Name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., Apollo Hospitals" />
            </Form.Item>

            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Mumbai" />
            </Form.Item>

            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="India" />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input placeholder="+91 98765 43210" />
            </Form.Item>

            <Form.Item name="imageUrl" label="Image">
              <ImageUpload
                value={hospitalForm.getFieldValue("imageUrl")}
                onChange={(v) => hospitalForm.setFieldsValue({ imageUrl: v })}
                setLoading={setHospitalUploading}
              />
            </Form.Item>

            <Form.Item name="description" label="Short Description">
              <>
                <Input.TextArea
                  rows={3}
                  placeholder="Markdown allowed: **bold**, lists, headings, etc."
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Supports Markdown (headings, bold, bullet points).
                </Text>
              </>
            </Form.Item>

            <Form.Item name="about" label="About the Hospital">
              <>
                <Input.TextArea
                  rows={8}
                  placeholder={
                    "Use Markdown for structure.\n\nExample:\n" +
                    "## **A Commitment to World-Class Care**\n" +
                    "- JCI and NABH accreditations\n" +
                    "- Dedicated infection-free operating suites"
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Supports Markdown: <code>##</code> for headings, <code>-</code>{" "}
                  for bullet points, <code>**bold**</code> for emphasis.
                </Text>
              </>
            </Form.Item>

            <Form.List name="facilities">
              {(fields, { add, remove }) => (
                <Card
                  size="small"
                  title="Facilities (optional)"
                  className="panel"
                  style={{ marginBottom: 12 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8}>
                        <Form.Item
                          {...rest}
                          name={name}
                          style={{ flex: 1, marginBottom: 8 }}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder={
                              "Markdown supported.\n\nExample:\n- **24×7 Emergency & Trauma Care**\n- **Smart ICUs** with advanced monitoring"
                            }
                          />
                        </Form.Item>
                        <Button danger onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Flex>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      type="dashed"
                      onClick={() => add("")}
                      block
                    >
                      Add Facility
                    </Button>
                  </Space>
                </Card>
              )}
            </Form.List>

            <Form.List name="departments">
              {(fields, { add, remove }) => (
                <Card
                  size="small"
                  title="Departments (optional)"
                  className="panel"
                  style={{ marginBottom: 12 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8}>
                        <Form.Item
                          {...rest}
                          name={name}
                          style={{ flex: 1, marginBottom: 8 }}
                        >
                          <Input.TextArea
                            rows={4}
                            placeholder={
                              "Markdown supported.\n\nExample:\n" +
                              "## **Orthopaedics & Joint Replacement**\n" +
                              "Robotic knee & hip replacements, spine surgery, and trauma care."
                            }
                          />
                        </Form.Item>
                        <Button danger onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Flex>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      type="dashed"
                      onClick={() => add("")}
                      block
                    >
                      Add Department
                    </Button>
                  </Space>
                </Card>
              )}
            </Form.List>

            <Form.List name="doctors">
              {(fields, { add, remove }) => (
                <Card
                  size="small"
                  title="Doctors (optional)"
                  className="panel"
                  style={{ marginBottom: 12 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8} wrap>
                        <Form.Item
                          {...rest}
                          name={[name, "name"]}
                          label="Name"
                          style={{ flex: 1, minWidth: 160 }}
                        >
                          <Input placeholder="Markdown allowed, e.g. **Dr. Anjali Sharma**" />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, "specialty"]}
                          label="Specialty"
                          style={{ flex: 1, minWidth: 160 }}
                        >
                          <Input placeholder="Markdown allowed, e.g. **Senior Consultant – Cardiology**" />
                        </Form.Item>
                        <Button danger onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Flex>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      type="dashed"
                      onClick={() => add({ name: "", specialty: "" })}
                      block
                    >
                      Add Doctor
                    </Button>
                  </Space>
                </Card>
              )}
            </Form.List>

            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              {editingHospital && (
                <Button
                  onClick={() => {
                    setEditingHospital(null);
                    hospitalForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="primary" htmlType="submit" loading={hospitalUploading}>
                {editingHospital ? "Update" : "Add"}
              </Button>
            </Space>
          </Form>
        </Card>
      </Col>

      <Col xs={24} md={14}>
        <Card className="panel" title={<MobileHeader title="Hospitals" />}>
          <Table
            rowKey="id"
            dataSource={hospitals}
            columns={hospitalColumns}
            {...useCommonTableProps()}
          />
        </Card>
      </Col>
    </Row>
  );

  const TreatmentsTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={10}>
        <Card
          id="treatment-form-card"
          className="panel"
          title={
            <MobileHeader
              title={editingTreatment ? "Edit Treatment" : "Add Treatment"}
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setEditingTreatment(null);
                    treatmentForm.resetFields();
                  }}
                />
              }
            />
          }
        >
          <Form
            layout="vertical"
            form={treatmentForm}
            initialValues={emptyTreatment}
            onFinish={handleTreatmentSubmit}
          >
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="e.g., Knee Replacement" />
            </Form.Item>

            <Form.Item name="imageUrl" label="Cover Image">
              <ImageUpload
                value={treatmentForm.getFieldValue("imageUrl")}
                onChange={(v) => treatmentForm.setFieldsValue({ imageUrl: v })}
                setLoading={setTreatmentUploading}
              />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <>
                <Input.TextArea
                  rows={4}
                  placeholder={
                    "You can use Markdown here.\n\nExample:\n" +
                    "## **Overview**\n" +
                    "- Minimally invasive procedure\n" +
                    "- Short hospital stay\n" +
                    "- Faster recovery"
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Supports Markdown: headings, bullet points, **bold**, *italic*.
                </Text>
              </>
            </Form.Item>

            <Form.Item name="procedures" label="Procedures">
              <>
                <Input.TextArea
                  rows={4}
                  placeholder={
                    "Markdown supported.\n\nExample:\n" +
                    "1. Pre-surgery evaluation\n" +
                    "2. **Anaesthesia & preparation**\n" +
                    "3. Robotic-assisted surgery\n" +
                    "4. Post-op monitoring & rehab"
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Write step-by-step flow with numbered lists and highlights.
                </Text>
              </>
            </Form.Item>

            <Form.List name="costing">
              {(fields, { add, remove }) => (
                <Card size="small" title="Costing" className="panel">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8} align="center" wrap>
                        <Form.Item
                          {...rest}
                          name={[name, "label"]}
                          style={{ flex: 1, minWidth: 160, marginBottom: 8 }}
                        >
                          <Input placeholder="Item / Package" />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, "price"]}
                          style={{ width: 140, marginBottom: 8 }}
                        >
                          <InputNumber
                            prefix="$"
                            placeholder="Price"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Button danger onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Flex>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      type="dashed"
                      onClick={() => add({ label: "", price: "" })}
                      block
                    >
                      Add Row
                    </Button>
                  </Space>
                </Card>
              )}
            </Form.List>

            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              {editingTreatment && (
                <Button
                  onClick={() => {
                    setEditingTreatment(null);
                    treatmentForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="primary" htmlType="submit" loading={treatmentUploading}>
                {editingTreatment ? "Update" : "Add"}
              </Button>
            </Space>
          </Form>
        </Card>
      </Col>

      <Col xs={24} md={14}>
        <Card className="panel" title={<MobileHeader title="Treatments" />}>
          <Table
            rowKey="id"
            dataSource={treatments}
            columns={treatmentColumns}
            {...useCommonTableProps()}
          />
        </Card>
      </Col>
    </Row>
  );

  const EnquiriesTab = (
    <Card className="panel">
      <Table
        rowKey={(r) => r.id}
        dataSource={enquiries}
        columns={enquiryColumns}
        {...useCommonTableProps()}
      />
    </Card>
  );

  return (
    <AntdApp>
      {modalContextHolder}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#146ef5",
            borderRadius: 12,
          },
          components: {
            Card: { headerFontSize: 16, padding: 16 },
            Button: { controlHeight: isMobile ? 36 : 40 },
          },
        }}
      >
        <div className="admin-wrap">
          <div className="admin-page">
            <Flex justify="space-between" align="center" wrap style={{ marginBottom: 12 }}>
              <Title level={3} style={{ margin: 0 }}>
                Admin Console
              </Title>
              <Tag color="blue">Medway Horizons</Tag>
            </Flex>

            <Tabs
              defaultActiveKey="hospitals"
              items={[
                { key: "hospitals", label: "Hospitals", children: HospitalsTab },
                { key: "treatments", label: "Treatments", children: TreatmentsTab },
                { key: "enquiries", label: "Enquiries", children: EnquiriesTab },
              ]}
            />

            <Card style={{ marginTop: 12 }} className="panel">
              <Text type="secondary">
                Hospital & Treatment text fields support Markdown so you can create
                headings, bold text, bullet points, and beautiful structured content
                for the detail pages.
              </Text>
            </Card>
          </div>
        </div>
      </ConfigProvider>
    </AntdApp>
  );
}
