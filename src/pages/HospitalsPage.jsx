import React, { useEffect, useMemo, useState } from "react";
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
  Tag,
  Input,
  Space,
  Tooltip,
} from "antd";
import {
  EnvironmentOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/HospitalsPage.css";

const { Content } = Layout;
const { Meta } = Card;
const { Option } = Select;

export default function HospitalPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [filterCity, setFilterCity] = useState("All Cities");
  const [filterSpecialty, setFilterSpecialty] = useState("All Specialties");
  const [sortKey, setSortKey] = useState("best");

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "hospitals"));
      setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  const cities = useMemo(
    () => ["All Cities", ...Array.from(new Set(hospitals.map((h) => h.city).filter(Boolean)))],
    [hospitals]
  );
  const specialties = useMemo(
    () => [
      "All Specialties",
      ...Array.from(new Set(hospitals.flatMap((h) => h.specialties || []))),
    ],
    [hospitals]
  );

  // filter + search + sort
  const filtered = useMemo(() => {
    const norm = (s) => (s || "").toString().toLowerCase();
    let list = hospitals.filter((h) => {
      const okCity = filterCity === "All Cities" || norm(h.city) === norm(filterCity);
      const okSpec =
        filterSpecialty === "All Specialties" ||
        (h.specialties || []).map(norm).includes(norm(filterSpecialty));
      const text = [h.name, h.city, h.country, ...(h.specialties || [])].join(" ");
      const okQ = !q || norm(text).includes(norm(q));
      return okCity && okSpec && okQ;
    });

    switch (sortKey) {
      case "az":
        list = list.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "city":
        list = list.slice().sort((a, b) => (a.city || "").localeCompare(b.city || ""));
        break;
      default:
        // "best" – keep source order
        break;
    }
    return list;
  }, [hospitals, filterCity, filterSpecialty, q, sortKey]);

  const resultLabel = loading ? "…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`;

  const showDetails = (h) => {
    setSelectedHospital(h);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedHospital(null);
  };
  const clearAll = () => {
    setQ("");
    setFilterCity("All Cities");
    setFilterSpecialty("All Specialties");
    setSortKey("best");
  };

  return (
    <Layout className="hospital-page">
      <Content className="shop-content">
        {/* Header */}
        <header className="shop-header">
          <div>
            <h1 className="shop-heading">Browse Hospitals</h1>
            <p className="shop-subheading">Find accredited hospitals by city and treatment.</p>
          </div>
          <span className="result-pill">{resultLabel}</span>
        </header>

        {/* Sticky utility bar */}
        <section className="util-bar" role="region" aria-label="Search and filters">
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            size="large"
            placeholder="Search hospitals, cities, treatments…"
            className="util-search"
            prefix={<MedicineBoxOutlined />}
          />

          <div className="util-row">
            <Space size={12} wrap>
              <Select
                value={filterCity}
                onChange={setFilterCity}
                size="large"
                className="util-select"
                suffixIcon={<EnvironmentOutlined />}
              >
                {cities.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>

              <Select
                value={filterSpecialty}
                onChange={setFilterSpecialty}
                size="large"
                className="util-select"
                suffixIcon={<MedicineBoxOutlined />}
                showSearch
                optionFilterProp="children"
              >
                {specialties.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>

              <Select
                value={sortKey}
                onChange={setSortKey}
                size="large"
                className="util-select"
                suffixIcon={<SortAscendingOutlined />}
              >
                <Option value="best">Best match</Option>
                <Option value="az">Name A–Z</Option>
                <Option value="city">City A–Z</Option>
              </Select>

              <Button
                onClick={clearAll}
                className="util-clear"
                icon={<ReloadOutlined />}
              >
                Reset
              </Button>
            </Space>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-wrap">
            <Empty description="No hospitals found" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((h) => (
              <Col xs={24} sm={12} md={8} lg={6} key={h.id}>
                <Card
                  hoverable
                  className="shop-card"
                  cover={
                    <div className="cover-wrap">
                      <img
                        src={h.imageUrl || h.image || "/fallback.jpg"}
                        alt={h.name}
                        className="shop-card-img"
                      />
                      {(h.city || h.country) && (
                        <span className="city-chip">
                          <EnvironmentOutlined />{" "}
                          {[h.city, h.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  }
                  actions={[
                    <Button
                      key="view"
                      type="primary"
                      className="shop-btn"
                      onClick={() => showDetails(h)}
                      block
                    >
                      View Details
                    </Button>,
                  ]}
                >
                  <Meta
                    title={<span className="card-title">{h.name}</span>}
                    description={
                      <span className="card-sub">
                        {h.accredited ? (
                          <Tag color="success" className="accr-chip">
                            Accredited
                          </Tag>
                        ) : (
                          <Tooltip title="Accreditation info not available">
                            <Tag className="accr-chip">
                              <InfoCircleOutlined /> Info pending
                            </Tag>
                          </Tooltip>
                        )}
                      </span>
                    }
                  />
                  <div className="shop-tags">
                    {(h.specialties || []).slice(0, 3).map((s) => (
                      <Tag key={s} className="tag-chip">
                        {s}
                      </Tag>
                    ))}
                    {(h.specialties || []).length > 3 && (
                      <span className="more-chip">
                        +{(h.specialties || []).length - 3}
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Details modal */}
        <Modal
          title={selectedHospital?.name || "Details"}
          open={modalVisible}
          onCancel={closeModal}
          footer={[<Button key="close" onClick={closeModal}>Close</Button>]}
          className="detail-modal"
        >
          {selectedHospital ? (
            selectedHospital.description ||
            selectedHospital.city ||
            selectedHospital.country ? (
              <div className="detail-body">
                <p>
                  <strong>Location:</strong>{" "}
                  {[selectedHospital.city, selectedHospital.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {(selectedHospital.specialties || []).length > 0 && (
                  <p>
                    <strong>Treatments:</strong>{" "}
                    {(selectedHospital.specialties || []).join(", ")}
                  </p>
                )}
                {selectedHospital.description && (
                  <p className="detail-about">
                    <strong>About:</strong> {selectedHospital.description}
                  </p>
                )}
              </div>
            ) : (
              <Empty description="Data not found" />
            )
          ) : null}
        </Modal>
      </Content>
    </Layout>
  );
}
