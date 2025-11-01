import React, { useEffect, useState } from 'react';
import {
  Layout,
  Row,
  Col,
  Button,
  Card,
  Space,
  Breadcrumb,
  Skeleton,
  Empty,
  Divider,
  Typography,
  Tag,
} from 'antd';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import '../styles/TreatmentDetails.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

function cld(url, t = 'f_auto,q_auto') {
  if (!url) return url;
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/${t}/`) : url;
}

const getImg = (o) => o?.imageUrl || o?.image || '';

export default function TreatmentDetailPage() {
  const [treatment, setTreatment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'treatments', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTreatment({ id: docSnap.id, ...docSnap.data() });
        } else {
          setTreatment(null);
        }
      } catch (e) {
        console.error('Fetch treatment failed', e);
        setTreatment(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Layout className="td-layout">
        <Content className="td-content">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Content>
      </Layout>
    );
  }

  if (!treatment) {
    return (
      <Layout className="td-layout">
        <Content className="td-content">
          <Empty
            description="Treatment not found"
            style={{ marginTop: 60 }}
          >
            <Button type="primary" onClick={() => navigate('/treatments')}>
              Back to Treatments
            </Button>
          </Empty>
        </Content>
      </Layout>
    );
  }

  const imageUrl = cld(getImg(treatment), 'f_auto,q_auto,w_1200,h_600,c_fill');

  return (
    <Layout className="td-layout">
      <Content className="td-content">
        {/* Breadcrumb Navigation */}
        <div className="td-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/treatments">Treatments</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{treatment.name}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/treatments')}
          className="td-back-btn"
        >
          Back to Treatments
        </Button>

        {/* Main Content */}
        <Row gutter={[24, 24]} className="td-main">
          {/* Left Column - Treatment Info */}
          <Col xs={24} lg={16}>
            <Card className="td-card td-info-card">
              <div className="td-header">
                <div>
                  <Title level={1} className="td-title">
                    {treatment.name}
                  </Title>
                  {treatment.category && (
                    <div className="td-category-tag">
                      <Tag color="blue" className="td-tag">
                        {treatment.category}
                      </Tag>
                    </div>
                  )}
                </div>
              </div>

              <Divider className="td-divider" />

              <div className="td-section">
                <div className="td-section-header">
                  <InfoCircleOutlined className="td-section-icon" />
                  <Title level={3} className="td-section-title">
                    About This Treatment
                  </Title>
                </div>
                <Paragraph className="td-description">
                  {treatment.description || 
                    'No detailed description available for this treatment at the moment. Please contact us for more information.'}
                </Paragraph>
              </div>

              {treatment.keywords && (
                <>
                  <Divider className="td-divider" />
                  <div className="td-section">
                    <Title level={4} className="td-subsection-title">
                      Related Keywords
                    </Title>
                    <div className="td-keywords">
                      {treatment.keywords.split(',').map((keyword, idx) => (
                        <Tag key={idx} className="td-keyword-tag">
                          {keyword.trim()}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card>
          </Col>

          {/* Right Column - Contact/Enquiry */}
          <Col xs={24} lg={8}>
            <Card className="td-card td-enquiry-card">
              <Title level={3} className="td-enquiry-title">
                Interested in this treatment?
              </Title>
              <Paragraph className="td-enquiry-text">
                Get in touch with our medical team to learn more about this treatment
                and find the best hospitals for your needs.
              </Paragraph>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<MailOutlined />}
                  className="td-action-btn td-primary-btn"
                  onClick={() => navigate('/quote')}
                >
                  Send Enquiry
                </Button>
                
                <Button
                  size="large"
                  block
                  icon={<PhoneOutlined />}
                  className="td-action-btn td-secondary-btn"
                  onClick={() => navigate('/contact')}
                >
                  Contact Us
                </Button>
              </Space>

              <Divider className="td-divider-small" />

              <div className="td-help-section">
                <Title level={5} className="td-help-title">
                  Need Help?
                </Title>
                <Paragraph className="td-help-text">
                  Our healthcare advisors are available to answer your questions
                  and guide you through the process.
                </Paragraph>
              </div>
            </Card>

            {/* Additional Info Card */}
            <Card className="td-card td-info-box">
              <div className="td-info-box-content">
                <InfoCircleOutlined className="td-info-box-icon" />
                <div>
                  <Title level={5} className="td-info-box-title">
                    Personalized Care
                  </Title>
                  <Paragraph className="td-info-box-text">
                    We connect you with top hospitals and specialists tailored to
                    your specific treatment needs.
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}