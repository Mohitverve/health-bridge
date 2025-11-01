import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Table,
  Card,
  Space,
  Statistic,
  Tooltip,
  Divider,
  Empty,
  Skeleton,
  Grid,
  Breadcrumb,
} from 'antd';
import { useNavigate, Link,useLocation } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import '../styles/TreatmentsPage.css';

const { Content } = Layout;
const { Option } = Select;
const { useBreakpoint } = Grid;

function cld(url, t = 'f_auto,q_auto') {
  if (!url) return url;
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/${t}/`) : url;
}
const getImg = (o) => o?.imageUrl || o?.image || '';

export default function TreatmentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
const { pathname } = useLocation();
  // filters
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('a-z');
  const [view, setView] = useState('table'); // table | grid

  const screens = useBreakpoint();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'treatments'));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setData(items);
      } catch (e) {
        console.error('Fetch treatments failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    data.forEach((t) => t?.category && set.add(t.category));
    return ['All', ...Array.from(set)];
  }, [data]);

  const normalized = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let arr = data.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!normalized) return true;
      const hay = `${t.name || ''} ${t.description || ''} ${t.keywords || ''}`.toLowerCase();
      return hay.includes(normalized);
    });

    arr = arr.sort((a, b) => {
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      if (sortBy === 'a-z') return an.localeCompare(bn);
      if (sortBy === 'z-a') return bn.localeCompare(an);
      return 0;
    });
    return arr;
  }, [data, category, normalized, sortBy]);

  const clearFilters = () => {
    setQ('');
    setCategory('All');
    setSortBy('a-z');
  };

  // ---------- TABLE VIEW ----------
  const columns = [
    {
      title: 'Treatment',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <img
            src={cld(getImg(record), 'f_auto,q_auto,w_120,h_90,c_fill') || '/fallback.jpg'}
            alt={record.name}
            onError={(e) => (e.currentTarget.src = '/fallback.jpg')}
            className="tc-thumb"
          />
          <div>
            <div className="tc-title">{text}</div>
            <div className="tc-sub">
              {record.description ? truncate(record.description, 100) : '—'}
            </div>
          </div>
        </Space>
      ),
    },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 180 },
    {
      title: '',
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space>
          <Button onClick={() => navigate(`/treatments/${r.id}`)}>View</Button>
          <Button type="primary"  onClick={() => navigate('/quote')}>
            Enquire
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="tc-layout">
      <Content className="tc-content">
        {/* Header */}
        <div className="tc-header">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Treatments</Breadcrumb.Item>
          </Breadcrumb>

          <div className="tc-headbar">
            <div>
              <h1 className="tc-h1">Treatments Catalog</h1>
              <p className="tc-subhead">
                Explore treatments and connect with hospitals instantly.
              </p>
            </div>
            <Space size={24}>
              <Statistic title="Total Treatments" value={data.length} />
              <Statistic title="Showing" value={filtered.length} />
            </Space>
          </div>
        </div>

        {/* Filters */}
        <Card className="tc-toolbar" bodyStyle={{ padding: 12 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10} lg={8}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Search treatments"
                allowClear
              />
            </Col>
            <Col xs={12} md={6} lg={6}>
              <Select value={category} onChange={setCategory} style={{ width: '100%' }}>
                {categories.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={6} lg={6}>
              <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }}>
                <Option value="a-z">Sort: A–Z</Option>
                <Option value="z-a">Sort: Z–A</Option>
              </Select>
            </Col>
            <Col xs={24} md={2} lg={4}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Tooltip title="Table">
                  <Button
                    type={view === 'table' ? 'primary' : 'default'}
                    icon={<BarsOutlined />}
                    onClick={() => setView('table')}
                  />
                </Tooltip>
                <Tooltip title="Grid">
                  <Button
                    type={view === 'grid' ? 'primary' : 'default'}
                    icon={<AppstoreOutlined />}
                    onClick={() => setView('grid')}
                  />
                </Tooltip>
                <Button onClick={clearFilters} icon={<ReloadOutlined />}>
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Active filters */}
        <div className="tc-active">
          {category !== 'All' && (
            <Tag closable onClose={(e) => (e.preventDefault(), setCategory('All'))}>
              {category}
            </Tag>
          )}
          {q && (
            <Tag closable onClose={(e) => (e.preventDefault(), setQ(''))}>
              Search: “{q}”
            </Tag>
          )}
        </div>

        <Divider style={{ margin: '12px 0 16px' }} />

        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Col md={12} lg={12} key={i}>
                <Card>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filtered.length === 0 ? (
          <div className="tc-empty">
            <Empty description="No treatments found. Adjust filters or search." />
          </div>
        ) : view === 'table' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((t) => (
              <Col xl={6} lg={8} md={12} key={t.id}>
                <TreatmentCard t={t} onView={() => navigate(`/treatments/${t.id}`)} />
              </Col>
            ))}
          </Row>
        )}
      </Content>
    </Layout>
  );
}

function TreatmentCard({ t, onView }) {
  const src = cld(getImg(t), 'f_auto,q_auto,w_640,h_400,c_fill');
  return (
    <Card
      className="tc-card"
      hoverable
      cover={
        <img
          src={src || '/fallback.jpg'}
          alt={t.name}
          onError={(e) => (e.currentTarget.src = '/fallback.jpg')}
        />
      }
    >
      <div className="tc-card-title">{t.name}</div>
      <div className="tc-card-meta">
        {t.category && <Tag>{t.category}</Tag>}
      </div>
      <div className="tc-card-desc">
        {t.description ? truncate(t.description, 120) : '—'}
      </div>
      <Space style={{ marginTop: 10 }}>
        <Button onClick={onView}>View</Button>
        <Button type="primary"  onClick={() => navigate('/quote')}>
          Enquire
        </Button>
      </Space>
    </Card>
  );
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}
