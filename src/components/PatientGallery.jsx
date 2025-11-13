import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import '../styles/PatientGallery.css';

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh'     },
  { code: 'ET', name: 'Ethiopia'       },
  { code: 'KE', name: 'Kenya'          },
  { code: 'NG', name: 'Nigeria'        },
  { code: 'SD', name: 'Sudan'          },
  { code: 'TZ', name: 'Tanzania'       },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'UG', name: 'Uganda'         },
  { code: 'UZ', name: 'Uzbekistan'     },
  { code: 'ZM', name: 'Zambia'         },
];

export default function PatientGallery() {
  return (
    <section className="pg-section">
      <div className="pg-wrapper">
        <h2 className="pg-header">
          Medway has helped thousands of patients around the globe
        </h2>
        <div className="pg-grid">
          {COUNTRIES.map(({ code, name }) => (
            <div className="pg-item" key={code} tabIndex={0}>
              <div className="pg-flag-circle">
                <ReactCountryFlag
                  countryCode={code}
                  svg
                  className="pg-flag"
                  title={name}
                />
              </div>
              <div className="pg-name">{name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
