import React from 'react';
import { BLOOD_GROUPS, PRODUCTS } from '../utils/constants';

export default function BloodFilters({ value, onChange, allowAny = false }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label className="label" htmlFor="bf-group">Blood group</label>
        <select id="bf-group" className="input" value={value.blood_group || ''} onChange={set('blood_group')}>
          {allowAny && <option value="">Any</option>}
          {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="bf-product">Product</label>
        <select id="bf-product" className="input" value={value.product_type || ''} onChange={set('product_type')}>
          {allowAny && <option value="">Any</option>}
          {PRODUCTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
    </div>
  );
}
