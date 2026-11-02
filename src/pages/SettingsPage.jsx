import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { facilitiesApi } from '../api/facilities';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, Card, ErrorBanner, Loading, PageHeader } from '../components/ui';
import { toContactPayload, validateContact } from '../utils/contact';

const FIELDS = [
  { key: 'contact_name', label: 'Contact name', placeholder: 'Blood Bank Officer on duty' },
  { key: 'contact_phone', label: 'Contact phone', placeholder: '+254 700 000 000' },
  { key: 'address', label: 'Address', placeholder: 'Street, building, county', multiline: true },
];

export default function SettingsPage() {
  const { facilityId } = useAuth();
  const fac = useAsync(() => (facilityId ? facilitiesApi.get(facilityId) : Promise.resolve(null)), [facilityId]);
  const [form, setForm] = useState({ contact_name: '', contact_phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const save = useAction();

  useEffect(() => {
    if (fac.data) setForm({ contact_name: fac.data.contact_name || '', contact_phone: fac.data.contact_phone || '', address: fac.data.address || '' });
  }, [fac.data]);

  async function submit(e) {
    e.preventDefault();
    setSaved(false);
    const errs = validateContact(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    const body = toContactPayload(fac.data, form);
    if (Object.keys(body).length === 0) { setSaved(true); return; }
    const updated = await save.run(() => facilitiesApi.updateContact(facilityId, body));
    if (updated) { fac.setData(updated); setSaved(true); }
  }

  if (!facilityId) return <ErrorBanner error={{ message: 'No facility is linked to this account.' }} />;
  return (
    <div>
      <PageHeader title="Facility settings" subtitle="Contact details couriers see for pickup and drop-off. Changes are audited." />
      <Card className="max-w-xl">
        {fac.loading ? <Loading /> : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <ErrorBanner error={fac.error || save.error} />
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label" htmlFor={`st-${f.key}`}>{f.label}</label>
                {f.multiline
                  ? <textarea id={`st-${f.key}`} rows={3} className="input" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setSaved(false); }} aria-invalid={Boolean(fieldErrors[f.key])} />
                  : <input id={`st-${f.key}`} className="input" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setSaved(false); }} aria-invalid={Boolean(fieldErrors[f.key])} />}
                {fieldErrors[f.key] && <p className="text-xs text-status-crimson mt-1">{fieldErrors[f.key]}</p>}
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button type="submit" busy={save.busy}>Save contact details</Button>
              {saved && <span role="status" className="flex items-center gap-1 text-xs font-bold text-status-emerald"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
