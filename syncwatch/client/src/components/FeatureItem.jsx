import React from 'react';

export default function FeatureItem({ icon: Icon, line1, line2 }) {
  return (
    <div className="scane-feature-item">
      <div className="scane-feature-icon-box">
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <div className="scane-feature-label">
        <div>{line1}</div>
        <div>{line2}</div>
      </div>
    </div>
  );
}