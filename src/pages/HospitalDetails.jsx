import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Descriptions,
  List,
  Table,
  Divider,
  ConfigProvider,
  Button,
} from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/HospitalDetails.css";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function HospitalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hospitals", id));
        setHospital(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const doctorsCols = useMemo(
    () => [
      {
        title: "Doctor",
        dataIndex: "name",
        key: "name",
        render: (text) => (
          <div className="hd-rich-text hd-rich-text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text || ""}
            </ReactMarkdown>
          </div>
        ),
      },
      {
        title: "Specialty",
        dataIndex: "specialty",
        key: "specialty",
        render: (text) => (
          <div className="hd-rich-text hd-rich-text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text || ""}
            </ReactMarkdown>
          </div>
        ),
      },
    ],
    []
  );

  if (!loading && !hospital) {
    return (
      <Layout className="hospital-details">
        <Content className="hd-content">
          <div className="hd-header">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
          <Card className="hd-card">
            <Title level={3}>Hospital not found</Title>
            <Paragraph>
              This hospital may have been removed or the link is invalid.
            </Paragraph>
            <Link to="/hospitals">Go to hospitals</Link>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#16a34a", // green
          borderRadius: 12,
          fontSize: 16,
        },
        components: {
          Card: { headerFontSize: 16, padding: 16 },
        },
      }}
    >
      <Layout className="hospital-details">
        <Content className="hd-content">
          <div className="hd-header">
            <Breadcrumb
              items={[
                { title: <Link to="/">Home</Link> },
                { title: <Link to="/hospitals">Hospitals</Link> },
                { title: hospital?.name || "Loading…" },
              ]}
            />
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            {/* Left: Hero & About */}
            <Col xs={24} lg={16}>
              <Card className="hd-card">
                <div className="hd-hero">
                  <img
                    src={hospital?.imageUrl || "/fallback.jpg"}
                    alt={hospital?.name}
                    className="hd-hero-img"
                  />
                  <div className="hd-hero-meta">
                    <Title level={2} className="hd-title">
                      {hospital?.name}
                    </Title>
                    <div className="hd-meta-line">
                      <Tag color="green" className="hd-loc">
                        <EnvironmentOutlined />{" "}
                        {[hospital?.city, hospital?.country]
                          .filter(Boolean)
                          .join(", ")}
                      </Tag>
                      {hospital?.phone && (
                        <Tag className="hd-phone">
                          <PhoneOutlined /> {hospital.phone}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overview (short description) */}
                {hospital?.description && (
                  <>
                    <Title level={4} className="hd-section-title">
                      Overview
                    </Title>
                    <div className="hd-rich-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {hospital.description}
                      </ReactMarkdown>
                    </div>
                  </>
                )}

                {/* About the Hospital (long markdown) */}
                {hospital?.about && (
                  <>
                    <Title level={3} className="hd-section-title">
                      About the Hospital
                    </Title>
                    <div className="hd-rich-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {hospital.about}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </Card>

              {/* Doctors */}
              {(hospital?.doctors?.length ?? 0) > 0 && (
                <Card className="hd-card">
                  <Title level={4} className="hd-section-title">
                    Doctors
                  </Title>
                  <Table
                    size="small"
                    rowKey={(r, i) => `${r.name}-${i}`}
                    columns={doctorsCols}
                    dataSource={hospital.doctors}
                    pagination={false}
                  />
                </Card>
              )}
            </Col>

            {/* Right: Quick facts */}
            <Col xs={24} lg={8}>
              <Card className="hd-card sticky">
                <Title level={5} className="hd-section-title">
                  At a glance
                </Title>
                <Descriptions
                  column={1}
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="Name">
                    {hospital?.name || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location">
                    {[hospital?.city, hospital?.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {hospital?.phone || "—"}
                  </Descriptions.Item>
                </Descriptions>

                {(hospital?.facilities?.length ?? 0) > 0 && (
                  <>
                    <Divider />
                    <Title level={5} className="hd-section-title">
                      Facilities
                    </Title>
                    <List
                      size="small"
                      dataSource={hospital.facilities}
                      renderItem={(item, idx) => (
                        <List.Item className="hd-list-item" key={idx}>
                          <div className="hd-rich-text hd-rich-text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item}
                            </ReactMarkdown>
                          </div>
                        </List.Item>
                      )}
                    />
                  </>
                )}

                {(hospital?.departments?.length ?? 0) > 0 && (
                  <>
                    <Divider />
                    <Title level={5} className="hd-section-title">
                      Departments
                    </Title>
                    <List
                      size="small"
                      dataSource={hospital.departments}
                      renderItem={(item, idx) => (
                        <List.Item className="hd-list-item" key={idx}>
                          <div className="hd-rich-text hd-rich-text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item}
                            </ReactMarkdown>
                          </div>
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
