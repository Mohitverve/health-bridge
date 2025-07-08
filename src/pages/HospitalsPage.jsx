// src/pages/HospitalShopPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Select, Card, Row, Col, Button, Spin, Empty, Modal } from 'antd';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/HospitalsPage.css';

const { Sider, Content } = Layout;
const { Meta }           = Card;
const { Option }         = Select;

export default function HospitalShopPage() {
  const [hospitals, setHospitals]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterCity, setFilterCity]       = useState('All Cities');
  const [filterSpecialty, setFilterSpecialty] = useState('All Specialties');
  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Fetch all hospitals from Firestore
  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, 'hospitals'));
      setHospitals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  // Build city & specialty lists
  const cities = useMemo(() => ['All Cities', ...new Set(hospitals.map(h => h.city))], [hospitals]);
  const specialties = useMemo(() => ['All Specialties', ...new Set(hospitals.flatMap(h => h.specialties || []))], [hospitals]);

  // Filtered view
  const filtered = useMemo(() => {
    return hospitals.filter(h => {
      const okCity = filterCity === 'All Cities' || h.city === filterCity;
      const okSpec = filterSpecialty === 'All Specialties' || (h.specialties||[]).includes(filterSpecialty);
      return okCity && okSpec;
    });
  }, [hospitals, filterCity, filterSpecialty]);

  // Handlers
  const showDetails = (h) => {
    setSelectedHospital(h);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedHospital(null);
  };

  return (
    <Layout>
      <Header />
      <Navbar />

      <Layout hasSider>
        <Sider width={240} className="shop-sider">
          <h3 className="filter-title">Filters</h3>

          <div className="filter-row">
            <label>City</label>
            <Select
              value={filterCity}
              onChange={setFilterCity}
              className="filter-select"
            >
              {cities.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </div>

          <div className="filter-row">
            <label>Treatment</label>
            <Select
              value={filterSpecialty}
              onChange={setFilterSpecialty}
              className="filter-select"
            >
              {specialties.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </div>

          <Button type="link" className="clear-filters" onClick={() => { setFilterCity('All Cities'); setFilterSpecialty('All Specialties'); }}>
            Clear Filters
          </Button>
        </Sider>

        <Content className="shop-content">
          <h2 className="shop-heading">Browse Hospitals</h2>
          <p className="shop-subheading">Filter by city or treatment, then click “View Details.”</p>

          {loading ? (
            <div className="loading"><Spin size="large" /></div>
          ) : filtered.length === 0 ? (
            <Empty description="No hospitals found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map(h => (
                <Col xs={24} sm={12} md={8} key={h.id}>
                  <Card
                    hoverable
                    className="shop-card"
                    cover={
                      <img
                        src={h.imageUrl || h.image || '/fallback.jpg'}
                        alt={h.name}
                        className="shop-card-img"
                      />
                    }
                  >
                    <Meta
                      title={h.name}
                      description={`${h.city}, ${h.country}`}
                    />
                    <div className="shop-tags">
                      {(h.specialties || []).map(s => (
                        <span className="ant-tag" key={s}>{s}</span>
                      ))}
                    </div>
                    <Button
                      type="primary"
                      className="shop-btn"
                      block
                      onClick={() => showDetails(h)}
                    >
                      View Details
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* DETAILS MODAL */}
          <Modal
            title={selectedHospital?.name || 'Details'}
            visible={modalVisible}
            onCancel={closeModal}
            footer={[
              <Button key="close" onClick={closeModal}>Close</Button>
            ]}
          >
            {selectedHospital ? (
              selectedHospital.description ? (
                <div>
                  <p><strong>Location:</strong> {selectedHospital.city}, {selectedHospital.country}</p>
                  <p><strong>Treatments:</strong> {(selectedHospital.specialties||[]).join(', ')}</p>
                  <p><strong>About:</strong> {selectedHospital.description}</p>
                </div>
              ) : (
                <Empty description="Data not found" />
              )
            ) : null}
          </Modal>
        </Content>
      </Layout>

      <Footer />
    </Layout>
  );
}
