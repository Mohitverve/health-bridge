// src/pages/TreatmentsShopPage.jsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  Layout,
  Select,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Empty,
  Modal,
} from 'antd';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/HospitalsPage.css'; // you can keep reusing this

const { Sider, Content } = Layout;
const { Meta } = Card;
const { Option } = Select;

export default function TreatmentsShopPage() {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterName, setFilterName] = useState('All Treatments');
  const [modalVisible, setModalVisible]         = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // 1️⃣ Fetch from `treatments` instead of `hospitals`
  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, 'treatments'));
      setTreatments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  // build the single “filter by name” dropdown
  const names = useMemo(
    () => ['All Treatments', ...new Set(treatments.map(t => t.name))],
    [treatments],
  );

  // apply the filter
  const filtered = useMemo(
    () =>
      treatments.filter(
        t => filterName === 'All Treatments' || t.name === filterName,
      ),
    [treatments, filterName],
  );

  // show / hide modal
  const showDetails = t => {
    setSelectedTreatment(t);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTreatment(null);
  };

  return (
    <Layout>
      
     

      <Layout hasSider>
        <Sider width={240} className="shop-sider">
          <h3 className="filter-title">Filters</h3>

          <div className="filter-row">
            <label>Treatment</label>
            <Select
              value={filterName}
              onChange={setFilterName}
              className="filter-select"
            >
              {names.map(n => (
                <Option key={n} value={n}>
                  {n}
                </Option>
              ))}
            </Select>
          </div>

          <Button
            type="link"
            className="clear-filters"
            onClick={() => setFilterName('All Treatments')}
          >
            Clear Filters
          </Button>
        </Sider>

        <Content className="shop-content">
          <h2 className="shop-heading">Browse Treatments</h2>
          <p className="shop-subheading">
            Filter by treatment, then click “View Details.”
          </p>

          {loading ? (
            <div className="loading">
              <Spin size="large" />
            </div>
          ) : filtered.length === 0 ? (
            <Empty description="No treatments found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map(t => (
                <Col xs={24} sm={12} md={8} key={t.id}>
                  <Card
                    hoverable
                    className="shop-card"
                    cover={
                      <img
                        src={t.image}
                        alt={t.name}
                        className="shop-card-img"
                        onError={e => {
                          e.currentTarget.src = '/fallback.jpg';
                        }}
                      />
                    }
                  >
                    <Meta
                      title={t.name}
                      description={
                        t.description.length > 80
                          ? t.description.slice(0, 80) + '…'
                          : t.description
                      }
                    />
                    <Button
                      type="primary"
                      className="shop-btn"
                      block
                      onClick={() => showDetails(t)}
                    >
                      View Details
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <Modal
            title={selectedTreatment?.name || 'Details'}
            visible={modalVisible}
            onCancel={closeModal}
            footer={[
              <Button key="close" onClick={closeModal}>
                Close
              </Button>,
            ]}
          >
            {selectedTreatment ? (
              <>
                <img
                  src={selectedTreatment.image}
                  alt={selectedTreatment.name}
                  style={{ width: '100%', marginBottom: 16 }}
                  onError={e => {
                    e.currentTarget.src = '/fallback.jpg';
                  }}
                />
                <p>{selectedTreatment.description || 'No description found.'}</p>
              </>
            ) : (
              <Empty description="Data not found" />
            )}
          </Modal>
        </Content>
      </Layout>

      <Footer />
    </Layout>
  );
}
