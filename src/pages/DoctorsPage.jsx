// src/pages/DoctorsPage.jsx
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
  Tag,              // ← import Tag here
} from 'antd';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/DoctorsPage.css';

const { Sider, Content } = Layout;
const { Option }        = Select;
const { Meta }          = Card;

export default function DoctorsPage() {
  const [doctors, setDoctors]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filterHospital, setFilterHospital] = useState('All');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  const [modalVisible, setModalVisible]     = useState(false);
  const [selected, setSelected]             = useState(null);

  // fetch doctors
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'doctors'));
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  const hospitals = useMemo(
    () => ['All', ...new Set(doctors.map(d => d.hospital))],
    [doctors]
  );
  const specialties = useMemo(
    () => ['All', ...new Set(doctors.flatMap(d => d.specialty))],
    [doctors]
  );

  const filtered = useMemo(
    () =>
      doctors.filter(d => {
        const okH = filterHospital === 'All' || d.hospital === filterHospital;
        const okS =
          filterSpecialty === 'All' || d.specialty.includes(filterSpecialty);
        return okH && okS;
      }),
    [doctors, filterHospital, filterSpecialty]
  );

  const showDetails = doc => {
    setSelected(doc);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
  };

  return (
    <>
   

      <Layout hasSider>
        <Sider width={240} className="shop-sider">
          <h3 className="filter-title">Filters</h3>

          <div className="filter-row">
            <label>Hospital</label>
            <Select
              value={filterHospital}
              onChange={setFilterHospital}
              className="filter-select"
            >
              {hospitals.map(h => (
                <Option key={h} value={h}>
                  {h}
                </Option>
              ))}
            </Select>
          </div>

          <div className="filter-row">
            <label>Specialty</label>
            <Select
              value={filterSpecialty}
              onChange={setFilterSpecialty}
              className="filter-select"
            >
              {specialties.map(s => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </div>

          <Button
            type="link"
            onClick={() => {
              setFilterHospital('All');
              setFilterSpecialty('All');
            }}
            className="clear-filters"
          >
            Clear
          </Button>
        </Sider>

        <Content className="shop-content">
          <h2 className="shop-heading">Browse Doctors</h2>
          <p className="shop-subheading">
            Select a profile and click “View Details” for full info.
          </p>

          {loading ? (
            <div className="loading">
              <Spin size="large" />
            </div>
          ) : filtered.length === 0 ? (
            <Empty description="No doctors found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map(d => (
                <Col xs={24} sm={12} md={8} key={d.id}>
                  <Card
                    hoverable
                    cover={
                      <img
                        src={d.image || '/fallback.jpg'}
                        alt={d.name}
                        className="shop-card-img"
                      />
                    }
                    className="shop-card"
                  >
                    <Meta title={d.name} description={d.hospital} />
                    <div className="shop-tags">
                      {d.specialty.map(s => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                    <Button
                      block
                      type="primary"
                      className="shop-btn"
                      onClick={() => showDetails(d)}
                    >
                      View Details
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <Modal
            title={selected?.name}
            visible={modalVisible}
            onCancel={closeModal}
            footer={[
              <Button key="close" onClick={closeModal}>
                Close
              </Button>,
            ]}
          >
            {selected && (
              <>
                <p>
                  <strong>Hospital:</strong> {selected.hospital}
                </p>
                <p>
                  <strong>Specialty:</strong> {selected.specialty.join(', ')}
                </p>
                <p>
                  <strong>Bio:</strong> {selected.bio}
                </p>
              </>
            )}
          </Modal>
        </Content>
      </Layout>

     
    </>
  );
}
