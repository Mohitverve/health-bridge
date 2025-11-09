import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Card,
  Space,
  Empty,
  Skeleton,
  Statistic,
  Breadcrumb,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import {
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "../styles/TreatmentsPage.css";

const { Content } = Layout;
const { Option } = Select;

function cld(url, t = "f_auto,q_auto") {
  if (!url) return url;
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/${t}/`)
    : url;
}

export default function TreatmentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("a-z");

  const navigate = useNavigate();

  // Fetch + normalize
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "treatments"));
        const items = snap.docs.map((d) => {
          const raw = { id: d.id, ...d.data() };
          return {
            id: raw.id,
            title: raw.title || raw.name || "Untitled Treatment",
            imageUrl: raw.imageUrl || raw.image || "",
            description: raw.description || "",
            category: raw.category || "",
          };
        });
        setData(items);
      } catch (e) {
        console.error("Fetch treatments failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    data.forEach((t) => t?.category && set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [data]);

  const normalized = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let arr = data.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!normalized) return true;
      const hay = `${t.title || ""} ${t.description || ""}`.toLowerCase();
      return hay.includes(normalized);
    });

    arr = arr.sort((a, b) => {
      const an = (a.title || "").toLowerCase();
      const bn = (b.title || "").toLowerCase();
      if (sortBy === "a-z") return an.localeCompare(bn);
      if (sortBy === "z-a") return bn.localeCompare(an);
      return 0;
    });

    return arr;
  }, [data, category, normalized, sortBy]);

  const clearFilters = () => {
    setQ("");
    setCategory("All");
    setSortBy("a-z");
  };

  return (
    <Layout className="tp-layout">
      <Content className="tp-content">
        {/* Header */}
        <div className="tp-header">
          <Breadcrumb className="tp-breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Treatments</Breadcrumb.Item>
          </Breadcrumb>

          <div className="tp-headbar">
            <div>
              <h1 className="tp-h1">Treatments Catalog</h1>
              <p className="tp-subhead">
                Explore treatments and connect with hospitals instantly.
              </p>
            </div>
            <Space size={24} className="tp-stats">
              <Statistic title="Total" value={data.length} />
              <Statistic title="Showing" value={filtered.length} />
            </Space>
          </div>
        </div>

        {/* Toolbar */}
        <section className="tp-toolbar" role="region" aria-label="Filters">
          <div className="tp-tool-row">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search treatments…"
              allowClear
              className="tp-search"
            />

            <Select
              value={category}
              onChange={setCategory}
              className="tp-select"
              size="large"
            >
              {categories.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>

            <Select
              value={sortBy}
              onChange={setSortBy}
              className="tp-select"
              size="large"
            >
              <Option value="a-z">Sort: A–Z</Option>
              <Option value="z-a">Sort: Z–A</Option>
            </Select>

            <Button onClick={clearFilters} icon={<ReloadOutlined />} className="tp-reset">
              Reset
            </Button>
          </div>

          {/* Active filters */}
          <div className="tp-active">
            {category !== "All" && (
              <Tag closable onClose={(e) => (e.preventDefault(), setCategory("All"))}>
                {category}
              </Tag>
            )}
            {q && (
              <Tag closable onClose={(e) => (e.preventDefault(), setQ(""))}>
                Search: “{q}”
              </Tag>
            )}
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={i}>
                <Card className="tp-card">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filtered.length === 0 ? (
          <div className="tp-empty">
            <Empty description="No treatments found. Adjust filters or search." />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((t) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={t.id}>
                <TreatmentCard
                  t={t}
                  onView={() => navigate(`/treatments/${t.id}`)}
                  onEnquire={() => navigate("/Quote")}
                />
              </Col>
            ))}
          </Row>
        )}
      </Content>
    </Layout>
  );
}

function TreatmentCard({ t, onView, onEnquire }) {
  // small square thumbnail (badge style)
  const thumb = cld(t.imageUrl, "f_auto,q_auto,w_120,h_120,c_thumb,g_face");

  return (
    <Card className="tp-card" hoverable>
      <div className="tp-card-inner">
        {/* tiny image badge */}
        <div className="tp-thumb">
          <img
            src={thumb || "/fallback.jpg"}
            alt={t.title}
            onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
          />
        </div>

        {/* title + desc */}
        <div className="tp-card-title">{t.title}</div>
        {t.description && (
          <p className="tp-card-desc">
            {t.description.length > 180 ? t.description.slice(0, 177) + "…" : t.description}
          </p>
        )}

        {/* actions */}
        <div className="tp-actions">
          <Button type="primary" className="tp-cta" onClick={onEnquire}>
            Enquire
          </Button>
          <Button className="tp-ghost" icon={<ArrowRightOutlined />} onClick={onView}>
            Read More
          </Button>
        </div>
      </div>
    </Card>
  );
}
