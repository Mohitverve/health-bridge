import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Breadcrumb,
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Empty,
  Skeleton,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import '../styles/TreatmentDetails.css';

const { Content } = Layout;
const { Title } = Typography;

function cld(url, t = 'f_auto,q_auto') {
  if (!url) return url;
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/${t}/`) : url;
}
const getImg = (o) => o?.imageUrl || o?.image || '';

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'treatments', id));
        setT(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.error(e);
        setT(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const costColumns = useMemo(
    () => [
      { title: 'Item', dataIndex: 'item', key: 'item' },
      {
        title: 'Min (USD)',
        dataIndex: 'min',
        key: 'min',
        width: 140,
        render: (v) => (v || v === 0 ? `$${Number(v).toLocaleString()}` : '—'),
      },
      {
        title: 'Max (USD)',
        dataIndex: 'max',
        key: 'max',
        width: 140,
        render: (v) => (v || v === 0 ? `$${Number(v).toLocaleString()}` : '—'),
      },
      { title: 'Notes', dataIndex: 'notes', key: 'notes' },
    ],
    []
  );

  if (loading) {
    return (
      <Layout className="td2-layout">
        <Content className="td2-content">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Content>
      </Layout>
    );
  }

  if (!t) {
    return (
      <Layout className="td2-layout">
        <Content className="td2-content">
          <Empty description="Treatment not found" style={{ marginTop: 60 }}>
            <Button type="primary" onClick={() => navigate('/treatments')}>
              Back to Treatments
            </Button>
          </Empty>
        </Content>
      </Layout>
    );
  }

  const imageUrl = cld(getImg(t), 'f_auto,q_auto,w_1400,h_700,c_fill');
  const hasCost = Array.isArray(t.costRows) && t.costRows.length > 0;
  const hasProcedures = Array.isArray(t.procedures) && t.procedures.length > 0;

  return (
    <Layout className="td2-layout">
      <Content className="td2-content">
        {/* Breadcrumb + Back */}
        <div className="td2-bc">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/treatments">Treatments</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{t.name}</Breadcrumb.Item>
          </Breadcrumb>

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/treatments')}
            className="td2-back"
          >
            Back to Treatments
          </Button>
        </div>

        {/* Article */}
        <article className="td2-article">
          {/* Title group */}
          <header className="td2-head">
            <Title level={1} className="td2-title">
              {t.name}
            </Title>
            {t.category && (
              <div className="td2-kicker">India – Advanced {t.category}</div>
            )}
          </header>

          {/* Optional hero image */}
          {imageUrl && (
            <figure className="td2-hero">
              <img src={imageUrl} alt={t.name} onError={(e) => (e.currentTarget.style.opacity = 0.2)} />
            </figure>
          )}

          {/* About / Description */}
          <section className="td2-section">
            {t.descriptionHtml ? (
              <div
                className="td2-rich"
                dangerouslySetInnerHTML={{ __html: t.descriptionHtml }}
              />
            ) : (
              <p className="td2-p">{t.description || 'No description available yet.'}</p>
            )}
          </section>

          {/* Why Choose */}
          {t.whyChooseHtml && (
            <section className="td2-section">
              <h2 className="td2-h2">Why Choose this Treatment?</h2>
              <div
                className="td2-rich"
                dangerouslySetInnerHTML={{ __html: t.whyChooseHtml }}
              />
            </section>
          )}

          {/* Costing table */}
          {hasCost && (
            <section className="td2-section">
              <h2 className="td2-h2">Estimated Costs</h2>
              <Card className="td2-card">
                <Table
                  rowKey={(r, i) => `${r.item}-${i}`}
                  columns={costColumns}
                  dataSource={t.costRows}
                  pagination={false}
                />
                <div className="td2-note">
                  * Prices vary by hospital, surgeon, implant choice, and patient condition.
                </div>
              </Card>
            </section>
          )}

          {/* Procedures list */}
          {hasProcedures && (
            <section className="td2-section">
              <h2 className="td2-h2">Types / Procedures under this Treatment</h2>
              <ul className="td2-list">
                {t.procedures.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Keywords */}
          {t.keywords && (
            <section className="td2-tags">
              {t.keywords.split(',').map((k, i) => (
                <Tag key={i}>{k.trim()}</Tag>
              ))}
            </section>
          )}

          {/* Bottom CTAs */}
          <section className="td2-cta-grid">
            <Card className="td2-cta td2-cta-primary" bordered={false}>
              <h3>Interested in this Treatment?</h3>
              <p>Share your reports and get a personalized treatment plan and transparent estimate.</p>
              <div className="td2-cta-actions">
                <Button
                  type="primary"
                  size="large"
                  icon={<MailOutlined />}
                  onClick={() => navigate('/quote')}
                >
                  Get a Quote
                </Button>
                <Button
                  size="large"
                  icon={<PhoneOutlined />}
                  onClick={() => navigate('/contact')}
                >
                  Talk to Care Advisor
                </Button>
              </div>
            </Card>

            <Card className="td2-cta td2-cta-soft" bordered={false}>
              <h3>Personalized Care, End-to-End</h3>
              <p>Hospital shortlisting, doctor opinions, visas, travel & stay — we handle everything.</p>
              <div className="td2-cta-actions">
                <Button onClick={() => navigate('/hospitals')}>Explore Hospitals</Button>
              </div>
            </Card>
          </section>
        </article>

        {/* Floating rails (desktop) */}
        <a className="td2-rail" href="/contact">
          Contact us Now
        </a>

        <Button
          className="td2-whatsapp"
          shape="round"
          size="large"
          icon={<WhatsAppOutlined />}
          onClick={() => navigate('/quote')}
        >
          Chat / Share Reports
        </Button>
      </Content>
    </Layout>
  );
}
