import { AuthGuard } from '@flowstack/sdk';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div>
        <h1>Dashboard</h1>
        <p>Protected content</p>
      </div>
    </AuthGuard>
  );
}
