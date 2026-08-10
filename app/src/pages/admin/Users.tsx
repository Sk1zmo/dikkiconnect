import { useMemo, useState } from 'react'
import { Ban, Search, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { AdminCard, AdminPill, DataTable, PageHeader, type Column } from './components'
import { Avatar, EmptyState, SearchField, Segmented, Sheet, Button, KeyValue, useToast } from '@/components/ui'
import { inr, shortDate } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'

interface AdminUser {
  id: string
  name: string
  phone: string
  role: 'Sender' | 'Passenger' | 'Both'
  joined: string
  bookings: number
  spend: number
  status: 'active' | 'suspended' | 'pending'
  kyc: boolean
}

const USERS: AdminUser[] = [
  { id: 'u1', name: 'Aditi Sharma', phone: '98450 67890', role: 'Both', joined: '2025-03-14', bookings: 18, spend: 3420, status: 'active', kyc: true },
  { id: 'u2', name: 'Rohit Sharma', phone: '98455 67890', role: 'Sender', joined: '2025-06-02', bookings: 6, spend: 1180, status: 'active', kyc: true },
  { id: 'u3', name: 'Meera Iyer', phone: '99001 12233', role: 'Passenger', joined: '2025-08-21', bookings: 12, spend: 5240, status: 'active', kyc: true },
  { id: 'u4', name: 'Nikhil Verma', phone: '98123 45678', role: 'Sender', joined: '2025-11-09', bookings: 3, spend: 640, status: 'pending', kyc: false },
  { id: 'u5', name: 'Priya Das', phone: '96112 23344', role: 'Both', joined: '2026-01-18', bookings: 9, spend: 2180, status: 'active', kyc: true },
  { id: 'u6', name: 'Sanjay Pillai', phone: '98450 09988', role: 'Sender', joined: '2026-02-24', bookings: 1, spend: 349, status: 'suspended', kyc: true },
  { id: 'u7', name: 'Rhea Menon', phone: '97410 55221', role: 'Passenger', joined: '2026-04-06', bookings: 22, spend: 8940, status: 'active', kyc: true },
  { id: 'u8', name: 'Vikram Shetty', phone: '98860 41120', role: 'Both', joined: '2026-05-30', bookings: 4, spend: 1120, status: 'active', kyc: false },
]

type Filter = 'all' | 'active' | 'pending' | 'suspended'

export default function AdminUsers() {
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(USERS, 700)

  const rows = useMemo(() => {
    let list = USERS
    if (filter !== 'all') list = list.filter((u) => u.status === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<AdminUser>> = [
    {
      key: 'name',
      header: 'User',
      width: '26%',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size={32} />
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-900">{u.name}</p>
            <p className="tabular truncate text-[11.5px] text-ink-500">+91 {u.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', width: '10%', render: (u) => <span className="text-ink-600">{u.role}</span> },
    {
      key: 'kyc',
      header: 'KYC',
      width: '11%',
      render: (u) =>
        u.kyc ? (
          <AdminPill tone="good">
            <ShieldCheck size={11} />
            Verified
          </AdminPill>
        ) : (
          <AdminPill tone="neutral">Not started</AdminPill>
        ),
    },
    { key: 'joined', header: 'Joined', width: '11%', render: (u) => <span className="tabular text-ink-600">{shortDate(u.joined)}</span> },
    { key: 'bookings', header: 'Bookings', width: '10%', align: 'right', render: (u) => u.bookings },
    { key: 'spend', header: 'Lifetime value', width: '13%', align: 'right', render: (u) => inr(u.spend) },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (u) => (
        <AdminPill
          tone={u.status === 'active' ? 'good' : u.status === 'pending' ? 'warning' : 'critical'}
        >
          {u.status === 'active' ? 'Active' : u.status === 'pending' ? 'Pending' : 'Suspended'}
        </AdminPill>
      ),
    },
  ]

  const counts = {
    all: USERS.length,
    active: USERS.filter((u) => u.status === 'active').length,
    pending: USERS.filter((u) => u.status === 'pending').length,
    suspended: USERS.filter((u) => u.status === 'suspended').length,
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${USERS.length} senders and passengers on the platform`}
      />

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search name or mobile"
            className="max-w-[300px]"
          />
          <div className="w-[380px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: `All ${counts.all}` },
                { value: 'active', label: `Active ${counts.active}` },
                { value: 'pending', label: `Pending ${counts.pending}` },
                { value: 'suspended', label: `Suspended ${counts.suspended}` },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of {USERS.length}
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={setSelected}
          empty={
            <EmptyState
              icon={<Search size={26} />}
              compact
              title="No users match"
              body="Try a different name, mobile number or status filter."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('')
                setFilter('all')
              }}
            />
          }
        />
      </AdminCard>

      {/* Detail drawer */}
      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected ? `+91 ${selected.phone} · ${selected.role}` : undefined}
      >
        {selected && (
          <>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={selected.name} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <AdminPill
                    tone={
                      selected.status === 'active'
                        ? 'good'
                        : selected.status === 'pending'
                          ? 'warning'
                          : 'critical'
                    }
                  >
                    {selected.status}
                  </AdminPill>
                  {selected.kyc && (
                    <AdminPill tone="info">
                      <ShieldCheck size={11} />
                      KYC verified
                    </AdminPill>
                  )}
                </div>
              </div>
            </div>

            <KeyValue label="Joined" value={shortDate(selected.joined)} />
            <KeyValue label="Total bookings" value={String(selected.bookings)} />
            <KeyValue label="Lifetime value" value={inr(selected.spend)} strong />
            <div className="my-3 h-px bg-ink-100" />
            <KeyValue label="Disputes raised" value="1" />
            <KeyValue label="Average rating given" value="4.7" />
            <KeyValue label="Cancellation rate" value="4%" />

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                variant="outline"
                block
                icon={<UserCheck size={17} />}
                onClick={() => toast.success('User verified', selected.name)}
              >
                Mark as verified
              </Button>
              <Button
                variant="danger"
                block
                icon={selected.status === 'suspended' ? <UserX size={17} /> : <Ban size={17} />}
                onClick={() => {
                  toast.warn(
                    selected.status === 'suspended' ? 'Account reinstated' : 'Account suspended',
                    selected.name,
                  )
                  setSelected(null)
                }}
              >
                {selected.status === 'suspended' ? 'Reinstate account' : 'Suspend account'}
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}
