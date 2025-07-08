import React, { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Input,
  Space,
  Button,
  Divider,
} from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/TopHospitals.css';

import aiimsImg      from '../assets/aiims-delhi.jpg';
import apolloImg     from '../assets/apollo-chennai.jpg';
import fortisImg     from '../assets/fortis-gurugram.jpg';
import medantaImg    from '../assets/medanta-gurugram.jpg';
import cmcVelloreImg from '../assets/cmc-vellore.jpg';

const { Option } = Select;
const { Search } = Input;
const INITIAL_COUNT = 6;

// Hard-coded initial hospitals
const HOSPITALS = [
  { id:'aiims',    name:'AIIMS',         city:'New Delhi', country:'India', specialties:['Cardiology','Neurology'],       image:aiimsImg },
  { id:'apollo',   name:'Apollo',        city:'Chennai',   country:'India', specialties:['Orthopedics','Oncology'],        image:apolloImg },
  { id:'fortis',   name:'Fortis MRI',    city:'Gurugram',  country:'India', specialties:['Cardiology','Gastroenterology'],image:fortisImg },
  { id:'medanta',  name:'Medanta',       city:'Gurugram',  country:'India', specialties:['Nephrology','Oncology'],        image:medantaImg },
  { id:'cmc',      name:'CMC Vellore',   city:'Vellore',   country:'India', specialties:['Cardiology','Neurology'],       image:cmcVelloreImg },
  { id:'max',      name:'Max Hospital',  city:'New Delhi', country:'India', specialties:['Cardiology','Orthopedics'],     image:aiimsImg },
];

export default function TopHospitals() {
  const [searchText, setSearchText]           = useState('');
  const [filterCity, setFilterCity]           = useState('All Cities');
  const [filterSpecialty, setFilterSpecialty] = useState('All Specialties');
  const [fetched, setFetched]                 = useState([]);
  const [visibleCount, setVisibleCount]       = useState(INITIAL_COUNT);

  // 1) Load any Firestore hospitals once
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'hospitals'));
      setFetched(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // 2) Reset when filters/search change
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [searchText, filterCity, filterSpecialty]);

  // 3) Build the full list, then filter
  const allHospitals = useMemo(() => [...HOSPITALS, ...fetched], [fetched]);

  const filtered = useMemo(() => {
    return allHospitals.filter(h => {
      const matchName = h.name.toLowerCase().includes(searchText.toLowerCase());
      const matchCity = filterCity==='All Cities' || h.city===filterCity;
      const matchSpec = filterSpecialty==='All Specialties' ||
                        (h.specialties||[]).includes(filterSpecialty);
      return matchName && matchCity && matchSpec;
    });
  }, [searchText, filterCity, filterSpecialty, allHospitals]);

  // 4) Slice out only what we should show
  const visibleHospitals = filtered.slice(0, visibleCount);

  // 5) Boolean flags for buttons
  const canShowMore = visibleCount < filtered.length;
  const canShowLess = visibleCount > INITIAL_COUNT;

  return (
    <div className="top-hospitals-container">
      <h2 className="section-title">Top Hospitals in India</h2>

      <Space className="filters" wrap>
        <Search 
          placeholder="Search hospitals…" 
          allowClear 
          value={searchText}
          onSearch={setSearchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />
        <Select value={filterCity} onChange={setFilterCity} style={{ width: 180 }}>
          {['All Cities', ...new Set(allHospitals.map(h=>h.city))].map(c=>(
            <Option key={c} value={c}>{c}</Option>
          ))}
        </Select>
        <Select value={filterSpecialty} onChange={setFilterSpecialty} style={{ width: 220 }}>
          {['All Specialties', ...new Set(allHospitals.flatMap(h=>h.specialties||[]))].map(s=>(
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
      </Space>

      <Row gutter={[32, 32]}>
        {visibleHospitals.map(h => (
          <Col xs={24} sm={12} md={8} key={h.id}>
            <Card hoverable className="hospital-card">
              <div className="img-wrapper">
                <img src={h.image} alt={h.name} className="hospital-image"/>
              </div>
              <Divider style={{ margin:'16px 0' }}/>
              <Card.Meta
                title={h.name}
                description={`${h.city}, ${h.country}`}
                className="hospital-meta"
              />
              <Divider dashed style={{ margin:'16px 0' }}/>
              <div className="hospital-actions">
                <Button type="link">More Details</Button>
                <Button type="primary">Book Appointment</Button>
              </div>
            </Card>
          </Col>
        ))}
        {visibleHospitals.length === 0 && (
          <Col span={24} className="no-results">
            No hospitals match your filters.
          </Col>
        )}
      </Row>

      {(canShowMore || canShowLess) && (
        <div className="show-more-container">
          {canShowMore && (
            <Button
              className="show-more-btn"
              icon={<DownOutlined/>}
              onClick={()=>setVisibleCount(vc=>vc+INITIAL_COUNT)}
            >
              Show More
            </Button>
          )}
          {canShowLess && (
            <Button
              className="show-less-btn"
              icon={<UpOutlined/>}
              onClick={()=>setVisibleCount(INITIAL_COUNT)}
            >
              Show Less
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
