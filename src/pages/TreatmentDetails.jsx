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
  ConfigProvider,
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
const { Title, Paragraph } = Typography;

// Cloudinary helper (works even if you paste a non-Cloudinary URL; it’s a no-op)
function cld(url, t = 'f_auto,q_auto') {
  if (!url) return url;
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/${t}/`) : url;
}
const getImg = (o) => o?.imageUrl || o?.image || '';

/**
 * Normalize Firestore doc to a single shape the UI can render:
 * - title: string
 * - description: string | html
 * - procedures: string | string[]
 * - costing: [{label, price}] OR legacy costRows
 */
function normalizeTreatment(raw) {
  if (!raw) return null;

  // Title
  const title = raw.title || raw.name || 'Treatment';

  // Description (prefer html if present; else plain)
  const descriptionHtml = raw.descriptionHtml || null;
  const description = raw.description || '';

  // Procedures: accept string (from Admin) or array (legacy)
  let proceduresText = '';
  let proceduresList = null;
  if (Array.isArray(raw.procedures)) {
    proceduresList = raw.procedures.filter(Boolean);
  } else if (typeof raw.procedures === 'string') {
    proceduresText = raw.procedures;
  }

  // Costing: prefer new schema [{label, price}] ; support legacy costRows
  let costing = null;
  let legacyCostRows = null;
  if (Array.isArray(raw.costing) && raw.costing.length > 0) {
    costing = raw.costing
      .filter((r) => r && (r.label || r.price !== undefined))
      .map((r) => ({ label: r.label ?? '', price: r.price ?? '' }));
  } else if (Array.isArray(raw.costRows) && raw.costRows.length > 0) {
    legacyCostRows = raw.costRows;
  }

  // Keywords (legacy optional)
  const keywords = typeof raw.keywords === 'string' ? raw.keywords : null;

  return {
    title,
    imageUrl: raw.imageUrl || raw.image || '',
    descriptionHtml,
    description,
    proceduresText,
    proceduresList,
    costing,
    legacyCostRows,
    category: raw.category || '',
    keywords,
  };
}

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch & normalize
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'treatments', id));
        const data = snap.exists() ? normalizeTreatment({ id: snap.id, ...snap.data() }) : null;
        setT(data);
      } catch (e) {
        console.error(e);
        setT(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Columns for new costing [{label, price}]
  const costingCols = useMemo(
    () => [
      { title: 'Item', dataIndex: 'label', key: 'label' },
      {
        title: 'Price (USD)',
        dataIndex: 'price',
        key: 'price',
        width: 180,
        render: (v) =>
          v || v === 0 ? (
            typeof v === 'number' ? `$${Number(v).toLocaleString()}` : String(v)
          ) : (
            '—'
          ),
      },
    ],
    []
  );

  // Columns for legacy costRows
  const legacyCols = useMemo(
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
  const hasNewCost = Array.isArray(t.costing) && t.costing.length > 0;
  const hasLegacyCost = Array.isArray(t.legacyCostRows) && t.legacyCostRows.length > 0;
  const hasAnyCost = hasNewCost || hasLegacyCost;
  const hasProceduresList = Array.isArray(t.proceduresList) && t.proceduresList.length > 0;
  const hasProceduresText = !!t.proceduresText;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#16a34a', // green
          borderRadius: 12,
        },
        components: { Card: { headerFontSize: 16, padding: 16 } },
      }}
    >
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
              <Breadcrumb.Item>{t.title}</Breadcrumb.Item>
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
                {t.title}
              </Title>
              {t.category && (
                <div className="td2-kicker">India – Advanced {t.category}</div>
              )}
            </header>

            {/* Optional hero image */}
            {imageUrl && (
              <figure className="td2-hero">
                <img
                  src={imageUrl}
                  alt={t.title}
                  onError={(e) => (e.currentTarget.style.opacity = 0.2)}
                />
              </figure>
            )}

            {/* Overview / Description */}
            <section className="td2-section">
              <h2 className="td2-h2">Overview</h2>
              {t.descriptionHtml ? (
                <div
                  className="td2-rich"
                  dangerouslySetInnerHTML={{ __html: t.descriptionHtml }}
                />
              ) : (
                <Paragraph className="td2-p prewrap">
                  {t.description || 'No description available yet.'}
                </Paragraph>
              )}
            </section>

            {/* Procedures */}
            {(hasProceduresList || hasProceduresText) && (
              <section className="td2-section">
                <h2 className="td2-h2">Procedures</h2>

                {/* New admin: a single multi-line text field */}
                {hasProceduresText && (
                  <Paragraph className="td2-p prewrap">{t.proceduresText}</Paragraph>
                )}

                {/* Legacy: array of procedure strings */}
                {hasProceduresList && (
                  <ul className="td2-list">
                    {t.proceduresList.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Costing */}
            {hasAnyCost && (
              <section className="td2-section">
                <h2 className="td2-h2">Estimated Costs</h2>

                {/* New admin costing */}
                {hasNewCost && (
                  <Card className="td2-card">
                    <Table
                      rowKey={(r, i) => `${r.label}-${i}`}
                      columns={costingCols}
                      dataSource={t.costing}
                      pagination={false}
                      size="small"
                    />
                    <div className="td2-note">
                      * Prices vary by hospital, surgeon, implant choice, and patient condition.
                    </div>
                  </Card>
                )}

                {/* Legacy costing */}
                {hasLegacyCost && (
                  <Card className="td2-card">
                    <Table
                      rowKey={(r, i) => `${r.item}-${i}`}
                      columns={legacyCols}
                      dataSource={t.legacyCostRows}
                      pagination={false}
                      size="small"
                    />
                    <div className="td2-note">
                      * Prices vary by hospital, surgeon, implant choice, and patient condition.
                    </div>
                  </Card>
                )}
              </section>
            )}

            {/* Keywords (legacy) */}
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
    </ConfigProvider>
  );
}
