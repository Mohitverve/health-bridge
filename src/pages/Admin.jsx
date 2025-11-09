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

// Optional Cloudinary config (or just paste URLs)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Cloudinary env missing");
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const useCommonTableProps = () => ({
  size: "small",
  scroll: { x: 800 },
  pagination: { pageSize: 8, showSizeChanger: false },
});

const emptyHospital = {
  name: "",
  city: "",
  country: "",
  phone: "",
  imageUrl: "",
  description: "", // short
  about: "", // long
  facilities: [], // strings (optional)
  departments: [], // strings (optional)
  doctors: [], // {name, specialty} (optional)
};

const emptyTreatment = {
  title: "",
  imageUrl: "",
  description: "",
  procedures: "",
  costing: [], // [{label, price}]
};

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
          // Will be replaced by modal.error via hook in component; keep fallback:
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

  // Modal hook (context safe)
  const [modal, modalContextHolder] = Modal.useModal();

  // Forms
  const [hospitalForm] = Form.useForm();
  const [treatmentForm] = Form.useForm();

  // State — hospitals
  const [hospitals, setHospitals] = useState([]);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalUploading, setHospitalUploading] = useState(false);

  // State — treatments
  const [treatments, setTreatments] = useState([]);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [treatmentUploading, setTreatmentUploading] = useState(false);

  // Enquiries
  const [enquiries, setEnquiries] = useState([]);

  // Live listeners (guard db)
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

  // ---- Hospitals ----
  const handleHospitalSubmit = async (values) => {
    if (!db) {
      message.error(
        "Firestore not ready. Ensure <Admin db={getFirestore(app)} /> is used."
      );
      return;
    }
    try {
      const payload = {
        ...values,
        facilities: (values.facilities || []).filter((x) => !!x),
        departments: (values.departments || []).filter((x) => !!x),
        doctors: (values.doctors || []).filter(
          (d) => d && (d.name || d.specialty)
        ),
      };

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
          <Image
            src={src}
            alt="hospital"
            width={64}
            height={48}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
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
      width: 160,
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
                          <p>{record.description}</p>
                        </>
                      )}
                      {record.about && (
                        <>
                          <Title level={5}>About</Title>
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {record.about}
                          </p>
                        </>
                      )}
                      {!!record.facilities?.length && (
                        <>
                          <Title level={5}>Facilities</Title>
                          <ul>
                            {record.facilities.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {!!record.departments?.length && (
                        <>
                          <Title level={5}>Departments</Title>
                          <ul>
                            {record.departments.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {!!record.doctors?.length && (
                        <>
                          <Title level={5}>Doctors</Title>
                          <ul>
                            {record.doctors.map((d, i) => (
                              <li key={i}>
                                {d.name}
                                {d.specialty ? ` — ${d.specialty}` : ""}
                              </li>
                            ))}
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
              } catch (e) {
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

  // ---- Treatments ----
  const handleTreatmentSubmit = async (values) => {
    if (!db) {
      message.error(
        "Firestore not ready. Ensure <Admin db={getFirestore(app)} /> is used."
      );
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
          <Image
            src={src}
            alt="treatment"
            width={64}
            height={48}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
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
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {record.description}
                          </p>
                        </>
                      )}
                      {record.procedures && (
                        <>
                          <Title level={5}>Procedures</Title>
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {record.procedures}
                          </p>
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
              } catch (e) {
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

  // ---- Enquiries ----
  const enquiryColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      responsive: ["md"],
      render: (v) => <Text ellipsis style={{ maxWidth: 260 }}>{v}</Text>,
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "—"),
    },
  ];

  // ---- Tabs ----
  const HospitalsTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={10}>
        <Card
          id="hospital-form-card"
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
          variant="outlined"
        >
          <Form
            layout="vertical"
            form={hospitalForm}
            initialValues={emptyHospital}
            onFinish={handleHospitalSubmit}
            onFinishFailed={() => message.error("Please fill required fields")}
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
              <Input.TextArea rows={3} placeholder="One or two lines" />
            </Form.Item>

            <Form.Item name="about" label="About the Hospital">
              <Input.TextArea rows={5} placeholder="Overview, specialties…" />
            </Form.Item>

            {/* Facilities (optional) */}
            <Form.List name="facilities">
              {(fields, { add, remove }) => (
                <Card size="small" title="Facilities (optional)" variant="outlined">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8}>
                        <Form.Item
                          {...rest}
                          name={name}
                          style={{ flex: 1, marginBottom: 8 }}
                        >
                          <Input placeholder="e.g., 24×7 Pharmacy" />
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

            {/* Departments (optional) */}
            <Form.List name="departments">
              {(fields, { add, remove }) => (
                <Card size="small" title="Departments (optional)" variant="outlined" style={{ marginTop: 12 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8}>
                        <Form.Item
                          {...rest}
                          name={name}
                          style={{ flex: 1, marginBottom: 8 }}
                        >
                          <Input placeholder="e.g., Cardiology" />
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

            {/* Doctors (optional) */}
            <Form.List name="doctors">
              {(fields, { add, remove }) => (
                <Card size="small" title="Doctors (optional)" variant="outlined" style={{ marginTop: 12 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...rest }) => (
                      <Flex key={key} gap={8} wrap>
                        <Form.Item
                          {...rest}
                          name={[name, "name"]}
                          label="Name"
                          style={{ flex: 1, minWidth: 160 }}
                        >
                          <Input placeholder="Doctor name" />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, "specialty"]}
                          label="Specialty"
                          style={{ flex: 1, minWidth: 160 }}
                        >
                          <Input placeholder="e.g., Orthopedics" />
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
        <Card title={<MobileHeader title="Hospitals" />} variant="outlined">
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
          variant="outlined"
        >
          <Form
            layout="vertical"
            form={treatmentForm}
            initialValues={emptyTreatment}
            onFinish={handleTreatmentSubmit}
            onFinishFailed={() => message.error("Please fill required fields")}
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
              <Input.TextArea rows={4} placeholder="Treatment details…" />
            </Form.Item>

            <Form.Item name="procedures" label="Procedures">
              <Input.TextArea rows={4} placeholder="Step-by-step…" />
            </Form.Item>

            <Form.List name="costing">
              {(fields, { add, remove }) => (
                <Card size="small" title="Costing" variant="outlined">
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
        <Card title={<MobileHeader title="Treatments" />} variant="outlined">
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
    <Card variant="outlined">
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
            Input: { controlHeight: isMobile ? 36 : 40 },
          },
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
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

          <Card style={{ marginTop: 12 }} variant="outlined">
            <Text type="secondary">
              Images can be uploaded (Cloudinary) or pasted as URLs. Hospital fields for departments,
              doctors, and facilities are optional. Treatments support simple costing rows.
            </Text>
          </Card>
        </div>
      </ConfigProvider>
    </AntdApp>
  );
}
