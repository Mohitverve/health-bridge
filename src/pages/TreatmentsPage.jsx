// src/pages/TreatmentsShopPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout, Select, Card, Row, Col, Button, Spin, Empty, Modal, Input,
  Drawer, Tag, Skeleton, Affix, Space, Grid,
} from 'antd';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { FunnelPlotOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import '../styles/HospitalsPage.css';
import '../styles/TreatmentsPage.css';

const { Sider, Content } = Layout;
const { Meta } = Card;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Cloudinary-friendly helper
function cld(url, transform = 'f_auto,q_auto') {
  if (!url) return url;
  return url.includes('/upload/')
    ? url.replace('/upload/', `/upload/${transform}/`)
    : url;
}
// Resolve image from either `imageUrl`(new) or `image`(old)
const getImg = (obj) => obj?.imageUrl || obj?.image || '';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('All Treatments');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('nameAsc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'treatments'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTreatments(data);
      } catch (e) {
        console.error('Failed to fetch treatments', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const names = useMemo(
    () => ['All Treatments', ...new Set(treatments.map((t) => t.name).filter(Boolean))],
    [treatments]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const base = treatments.filter((t) => {
      const passName = filterName === 'All Treatments' || t.name === filterName;
      if (!passName) return false;
      if (!normalizedQuery) return true;
      const hay = `${t.name || ''} ${t.description || ''}`.toLowerCase();
      return hay.includes(normalizedQuery);
    });
    return [...base].sort((a, b) => {
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      if (sortBy === 'nameAsc') return an.localeCompare(bn);
      if (sortBy === 'nameDesc') return bn.localeCompare(an);
      return 0;
    });
  }, [treatments, filterName, normalizedQuery, sortBy]);

  const showDetails = (t) => { setSelectedTreatment(t); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setSelectedTreatment(null); };

  const clearAll = () => { setFilterName('All Treatments'); setQuery(''); setSortBy('nameAsc'); };

  const FiltersBlock = (
    <div className="shop-filters">
      <h3 className="filter-title">Filters</h3>

      <div className="filter-row">
        <label htmlFor="treatment-filter">Treatment</label>
        <Select id="treatment-filter" value={filterName} onChange={setFilterName} className="filter-select" popupMatchSelectWidth>
          {names.map((n) => (<Option key={n} value={n}>{n}</Option>))}
        </Select>
      </div>

      <div className="filter-row">
        <label htmlFor="search-input">Search</label>
        <Input
          id="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<SearchOutlined />}
          placeholder="Find a treatment…"
          allowClear
        />
      </div>

      <div className="filter-row">
        <label htmlFor="sort-select">Sort</label>
        <Select id="sort-select" value={sortBy} onChange={setSortBy} className="filter-select">
          <Option value="nameAsc">Name (A → Z)</Option>
          <Option value="nameDesc">Name (Z → A)</Option>
        </Select>
      </div>

      <Button type="link" className="clear-filters" icon={<ReloadOutlined />} onClick={clearAll}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <Layout className="shop-layout">
      <Affix offsetTop={0}>
        <div className="shop-topbar">
          <Space className="topbar-inner" size="middle" align="center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search treatments"
              allowClear
              className="topbar-search"
            />
            <Button
              type="default"
              icon={<FunnelPlotOutlined />}
              className="topbar-filter-btn"
              onClick={() => setDrawerOpen(true)}
            >
              Filters
            </Button>
          </Space>
        </div>
      </Affix>

      <Layout hasSider className="shop-body">
        {!isMobile && (
          <Sider width={280} className="shop-sider">
            <Affix offsetTop={88}>{FiltersBlock}</Affix>
          </Sider>
        )}

        <Content className="shop-content">
          <div className="shop-heading-block">
            <h1 className="shop-heading">Browse Treatments</h1>
            <p className="shop-subheading">Refine by treatment or search, then tap “View Details”.</p>
            <div className="active-chips">
              {filterName !== 'All Treatments' && (
                <Tag closable onClose={(e) => { e.preventDefault(); setFilterName('All Treatments'); }}>
                  {filterName}
                </Tag>
              )}
              {normalizedQuery && (
                <Tag closable onClose={(e) => { e.preventDefault(); setQuery(''); }}>
                  Search: “{query}”
                </Tag>
              )}
              {sortBy !== 'nameAsc' && (
                <Tag closable onClose={(e) => { e.preventDefault(); setSortBy('nameAsc'); }}>
                  Sort: {sortBy === 'nameDesc' ? 'Z → A' : 'A → Z'}
                </Tag>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <Row gutter={[16, 16]}>
                {Array.from({ length: isMobile ? 4 : 8 }).map((_, i) => (
                  <Col xs={12} sm={12} md={8} lg={6} key={i}>
                    <Card className="shop-card">
                      <Skeleton.Image active style={{ width: '100%', height: 160 }} />
                      <Skeleton active paragraph={{ rows: 2 }} title className="mt-12" />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-wrap">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span>Nothing matches your filters. Try clearing them or searching differently.</span>}
              />
              <Button onClick={clearAll} className="mt-12">Reset Filters</Button>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map((t) => {
                const rawSrc = getImg(t);
                const src = cld(rawSrc, 'f_auto,q_auto,w_600,h_380,c_fill');
                return (
                  <Col xs={12} sm={12} md={8} lg={6} key={t.id}>
                    <Card
                      hoverable
                      className="shop-card"
                      cover={
                        <div className="shop-card-cover">
                          <img
                            src={src || '/fallback.jpg'}
                            alt={t.name}
                            className="shop-card-img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = '/fallback.jpg'; }}
                          />
                        </div>
                      }
                      onClick={() => showDetails(t)}
                      bodyStyle={{ padding: 14 }}
                    >
                      <Meta
                        title={<span className="card-title">{t.name}</span>}
                        description={
                          <span className="card-desc">
                            {t.description ? (t.description.length > 90 ? `${t.description.slice(0, 90)}…` : t.description) : 'No description available.'}
                          </span>
                        }
                      />
                      <div className="shop-card-footer">
                        {t.category && <Tag className="shop-tag">{t.category}</Tag>}
                        {t.duration && <Tag className="shop-tag">⏱ {t.duration}</Tag>}
                        <Button
                          type="primary"
                          className="shop-btn"
                          block
                          onClick={(e) => { e.stopPropagation(); showDetails(t); }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* use 'visible' for AntD v4 */}
          <Modal
            title={selectedTreatment?.name || 'Details'}
            visible={modalVisible}
            onCancel={closeModal}
            footer={[<Button key="close" onClick={closeModal}>Close</Button>]}
            centered
          >
            {selectedTreatment ? (
              <>
                <div className="modal-cover">
                  <img
                    src={cld(getImg(selectedTreatment), 'f_auto,q_auto,w_1200,c_fit') || '/fallback.jpg'}
                    alt={selectedTreatment.name}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/fallback.jpg'; }}
                  />
                </div>
                <p className="modal-desc">{selectedTreatment.description || 'No description found.'}</p>
              </>
            ) : (
              <Empty description="Data not found" />
            )}
          </Modal>
        </Content>
      </Layout>

      {/* Mobile Filters Drawer — use 'visible' for AntD v4 */}
      <Drawer
        title="Filters"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        visible={drawerOpen}
        width={Math.min(window.innerWidth * 0.86, 360)}
      >
        {FiltersBlock}
        <Space style={{ marginTop: 12 }}>
          <Button onClick={clearAll} icon={<ReloadOutlined />}>Clear</Button>
          <Button type="primary" onClick={() => setDrawerOpen(false)}>Apply</Button>
        </Space>
      </Drawer>
    </Layout>
  );
}
