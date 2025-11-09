import React, { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { getDocs, collection } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import "../styles/HospitalsPage.css";

const { Content } = Layout;
const { Meta } = Card;

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "hospitals"));
      setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  return (
    <Layout className="hospital-page">
      <Content className="shop-content">
        <header className="shop-header">
          <div>
            <h1 className="shop-heading">Browse Hospitals</h1>
            <p className="shop-subheading">Explore accredited hospitals across cities.</p>
          </div>
        </header>

        <Row gutter={[16, 16]} loading={loading ? 1 : 0}>
          {hospitals.map((h) => (
            <Col xs={24} sm={12} md={8} lg={6} key={h.id}>
              <Card
                hoverable
                className="shop-card"
                cover={
                  <div className="cover-wrap">
                    <img
                      src={h.imageUrl || "/fallback.jpg"}
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
                  <Link key="read" to={`/hospitals/${h.id}`} className="shop-btn-link">
                    Read More
                  </Link>,
                ]}
              >
                <Meta
                  title={<span className="card-title">{h.name}</span>}
                  description={
                    <span className="card-sub">
                      {h.description ? h.description : (
                        <Tag className="accr-chip">Details available</Tag>
                      )}
                    </span>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  );
}
